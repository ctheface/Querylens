import crypto from 'node:crypto';
import { redis } from '../../redis/client.js';
import { keys } from '../../redis/keys.js';
import { config } from '../../config.js';

/**
 * Refresh sessions with rotation and replay detection.
 *
 * A refresh token looks like `<familyId>.<random>`. Redis stores it hashed:
 *   sess:refresh:<sha256(token)>  -> hash { userId, familyId, createdAt, ua }
 *   sess:family:<familyId>        -> set of every token hash ever issued
 *
 * On each refresh the old token is deleted and a new one issued in the same
 * family. If a token arrives that is *in the family set* but *no longer has a
 * live key*, it was already rotated once - i.e. someone is replaying a stolen
 * token - so the entire family is revoked and the user must log in again.
 */

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function storeToken(client, { token, userId, familyId, ua }) {
  const tokenHash = hashToken(token);
  const ttl = config.auth.refreshTtlSeconds;
  await client
    .multi()
    .hSet(keys.refresh(tokenHash), {
      userId: String(userId),
      familyId,
      ua: ua ?? '',
      createdAt: new Date().toISOString(),
    })
    .expire(keys.refresh(tokenHash), ttl)
    .sAdd(keys.family(familyId), tokenHash)
    .expire(keys.family(familyId), ttl)
    .exec();
}

export async function createSession(userId, ua) {
  const client = await redis();
  const familyId = crypto.randomUUID();
  const token = `${familyId}.${crypto.randomBytes(32).toString('base64url')}`;
  await storeToken(client, { token, userId, familyId, ua });
  return token;
}

export async function destroyFamily(familyId) {
  const client = await redis();
  const members = await client.sMembers(keys.family(familyId));
  const toDelete = [...members.map((h) => keys.refresh(h)), keys.family(familyId)];
  if (toDelete.length > 0) {
    await client.del(toDelete);
  }
}

/**
 * Rotates a refresh token. Returns { userId, token } with a fresh token, or
 * null when the token is invalid, expired, or a detected replay.
 */
export async function rotateSession(oldToken, ua) {
  if (typeof oldToken !== 'string' || !oldToken.includes('.')) return null;
  const client = await redis();
  const familyId = oldToken.slice(0, oldToken.indexOf('.'));
  const oldHash = hashToken(oldToken);

  const data = await client.hGetAll(keys.refresh(oldHash));
  if (!data?.userId) {
    // Not an active token. If it belongs to a known family it was already
    // used once - replay attack - so revoke every session in that family.
    const wasInFamily = await client.sIsMember(keys.family(familyId), oldHash);
    if (wasInFamily) {
      console.warn(`[auth] refresh token replay detected - revoking family ${familyId}`);
      await destroyFamily(familyId);
    }
    return null;
  }

  await client.del(keys.refresh(oldHash));
  const token = `${familyId}.${crypto.randomBytes(32).toString('base64url')}`;
  await storeToken(client, { token, userId: data.userId, familyId, ua });
  return { userId: Number(data.userId), token };
}

/** Logout: revoke this token's whole family. */
export async function revokeSession(token) {
  if (typeof token !== 'string' || !token.includes('.')) return;
  await destroyFamily(token.slice(0, token.indexOf('.')));
}
