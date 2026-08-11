import crypto from 'node:crypto';
import { redis } from './client.js';
import { ApiError } from '../lib/errors.js';

/**
 * Sliding-window rate limiter over a sorted set, executed as a single Lua
 * script so the check-and-record is atomic. Three separate commands would
 * race: two concurrent requests could both read a count below the limit.
 *
 * Returns {1, '0'} when allowed, {0, retryAfterMs} when limited.
 */
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retry = math.floor(oldest[2] + window - now)
  return {0, tostring(retry)}
end
redis.call('ZADD', key, now, tostring(now) .. '-' .. ARGV[4])
redis.call('PEXPIRE', key, window)
return {1, '0'}
`;

export async function checkRateLimit(key, { windowMs, limit }) {
  const client = await redis();
  const [allowed, retryAfterMs] = await client.eval(SLIDING_WINDOW_LUA, {
    keys: [key],
    arguments: [
      String(Date.now()),
      String(windowMs),
      String(limit),
      crypto.randomBytes(4).toString('hex'),
    ],
  });
  return { allowed: allowed === 1, retryAfterMs: Number(retryAfterMs) };
}

/** Throws 429 when the caller is over the limit. */
export async function enforceRateLimit(key, { windowMs, limit, what }) {
  const { allowed, retryAfterMs } = await checkRateLimit(key, { windowMs, limit });
  if (!allowed) {
    const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    throw new ApiError(
      429,
      'E_RATE_LIMIT',
      `Too many ${what ?? 'requests'} - try again in ${seconds}s.`
    );
  }
}
