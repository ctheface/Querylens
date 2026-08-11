import { Router } from 'express';
import { z } from 'zod';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { ApiError } from '../lib/errors.js';
import { signAccessToken } from '../services/auth/tokens.js';
import { createSession, rotateSession, revokeSession } from '../services/auth/sessions.js';
import {
  beginGoogleOAuth,
  finishGoogleOAuth,
  googleOAuthConfigured,
} from '../services/auth/google.js';
import {
  createUser,
  getUserByEmail,
  getUserById,
  countUsers,
  claimOrphanDataSources,
  upsertGoogleUser,
} from '../db/repos/users.js';
import { redis } from '../redis/client.js';
import { keys } from '../redis/keys.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { config } from '../config.js';

const router = Router();

const REFRESH_COOKIE = 'ql_refresh';
const MAX_LOGIN_FAILURES = 5;
const LOCKOUT_SECONDS = 15 * 60;

const credentialsSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(1).max(100),
});

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    // Lax so the cookie survives the Google → API redirect that sets it.
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
    maxAge: config.auth.refreshTtlSeconds * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

async function issueTokens(res, user, req) {
  const refreshToken = await createSession(user.id, req.headers['user-agent']);
  setRefreshCookie(res, refreshToken);
  return signAccessToken(user);
}

async function maybeClaimOrphans(userId) {
  if ((await countUsers()) === 1) {
    const claimed = await claimOrphanDataSources(userId);
    if (claimed > 0) console.log(`[auth] first user claimed ${claimed} existing data source(s)`);
  }
}

router.get('/providers', (_req, res) => {
  res.json({ google: googleOAuthConfigured() });
});

router.post('/register', async (req, res) => {
  const input = registerSchema.parse(req.body);

  if (await getUserByEmail(input.email)) {
    throw new ApiError(409, 'E_EMAIL_TAKEN', 'An account with this email already exists.');
  }

  const passwordHash = await argonHash(input.password);
  const user = await createUser({ email: input.email, name: input.name, passwordHash });
  await maybeClaimOrphans(user.id);

  const accessToken = await issueTokens(res, user, req);
  res.status(201).json({ user, accessToken });
});

router.post('/login', async (req, res) => {
  const input = credentialsSchema.parse(req.body);
  const client = await redis();
  const failKey = keys.loginFail(input.email);

  const failures = Number((await client.get(failKey)) ?? 0);
  if (failures >= MAX_LOGIN_FAILURES) {
    throw new ApiError(
      429,
      'E_LOCKED',
      'Too many failed login attempts. Try again in 15 minutes.'
    );
  }

  const user = await getUserByEmail(input.email);
  const valid =
    user?.password_hash && (await argonVerify(user.password_hash, input.password));
  if (!valid) {
    await client.multi().incr(failKey).expire(failKey, LOCKOUT_SECONDS).exec();
    const hint =
      user && !user.password_hash
        ? 'This account uses Google sign-in. Continue with Google instead.'
        : 'Incorrect email or password.';
    throw new ApiError(401, 'E_BAD_CREDENTIALS', hint);
  }

  await client.del(failKey);
  const accessToken = await issueTokens(res, user, req);
  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    accessToken,
  });
});

router.get('/google', async (req, res) => {
  const url = await beginGoogleOAuth();
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const web = config.auth.webOrigin.replace(/\/$/, '');
  try {
    if (req.query.error) {
      throw new ApiError(400, 'E_OAUTH', String(req.query.error_description || req.query.error));
    }
    const profile = await finishGoogleOAuth({
      code: req.query.code,
      state: req.query.state,
    });
    const { user, created } = await upsertGoogleUser(profile);
    if (created) await maybeClaimOrphans(user.id);
    await issueTokens(res, user, req);
    res.redirect(`${web}/auth/callback`);
  } catch (err) {
    const message = encodeURIComponent(err.message || 'Google sign-in failed');
    res.redirect(`${web}/login?error=${message}`);
  }
});

router.post('/refresh', async (req, res) => {
  const oldToken = req.cookies?.[REFRESH_COOKIE];
  const rotated = oldToken ? await rotateSession(oldToken, req.headers['user-agent']) : null;
  if (!rotated) {
    clearRefreshCookie(res);
    throw new ApiError(401, 'E_UNAUTHORIZED', 'Session expired - please log in again.');
  }
  const user = await getUserById(rotated.userId);
  if (!user) {
    clearRefreshCookie(res);
    throw new ApiError(401, 'E_UNAUTHORIZED', 'Account no longer exists.');
  }
  setRefreshCookie(res, rotated.token);
  res.json({ user, accessToken: await signAccessToken(user) });
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await revokeSession(token);
  clearRefreshCookie(res);
  res.status(204).end();
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user) throw new ApiError(404, 'E_NOT_FOUND', 'Account not found');
  res.json(user);
});

export default router;
