import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from '../../config.js';
import { redis } from '../../redis/client.js';
import { keys } from '../../redis/keys.js';
import { ApiError } from '../../lib/errors.js';

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

const STATE_TTL_SECONDS = 600;

export function googleOAuthConfigured() {
  return Boolean(config.auth.googleClientId && config.auth.googleClientSecret);
}

function assertConfigured() {
  if (!googleOAuthConfigured()) {
    throw new ApiError(
      503,
      'E_OAUTH_DISABLED',
      'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
    );
  }
}

/** Builds the Google consent URL and stores a one-time CSRF state in Redis. */
export async function beginGoogleOAuth() {
  assertConfigured();
  const state = crypto.randomBytes(24).toString('base64url');
  const client = await redis();
  await client.set(keys.oauthState(state), '1', { EX: STATE_TTL_SECONDS });

  const params = new URLSearchParams({
    client_id: config.auth.googleClientId,
    redirect_uri: config.auth.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH}?${params}`;
}

/**
 * Exchanges the authorization code for tokens, verifies the ID token against
 * Google's JWKS, and returns the verified profile claims.
 */
export async function finishGoogleOAuth({ code, state }) {
  assertConfigured();
  if (!code || !state) {
    throw new ApiError(400, 'E_OAUTH', 'Missing OAuth code or state.');
  }

  const client = await redis();
  const consumed = await client.getDel(keys.oauthState(state));
  if (!consumed) {
    throw new ApiError(400, 'E_OAUTH', 'Invalid or expired OAuth state. Try again.');
  }

  const body = new URLSearchParams({
    code,
    client_id: config.auth.googleClientId,
    client_secret: config.auth.googleClientSecret,
    redirect_uri: config.auth.googleRedirectUri,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokens = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokens.id_token) {
    console.error('[oauth/google] token exchange failed:', tokens);
    throw new ApiError(502, 'E_OAUTH', 'Google token exchange failed.');
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: config.auth.googleClientId,
    }));
  } catch (err) {
    console.error('[oauth/google] id_token verify failed:', err.message);
    throw new ApiError(401, 'E_OAUTH', 'Invalid Google ID token.');
  }

  if (!payload.email || payload.email_verified !== true) {
    throw new ApiError(403, 'E_OAUTH', 'Google account email is not verified.');
  }

  return {
    googleSub: String(payload.sub),
    email: String(payload.email).toLowerCase(),
    name: String(payload.name || payload.email.split('@')[0]).slice(0, 100),
  };
}
