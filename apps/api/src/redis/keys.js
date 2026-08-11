/**
 * Single source of truth for every Redis key in the app.
 * Never build key strings anywhere else - scattered string literals are how
 * multi-user key-prefix bugs happen.
 */
export const keys = {
  // Auth sessions: refresh tokens are stored by sha256 hash, grouped into
  // rotation "families" so a replayed (stolen) token kills the whole family.
  refresh: (tokenHash) => `sess:refresh:${tokenHash}`,
  family: (familyId) => `sess:family:${familyId}`,

  // Login lockout counter per email.
  loginFail: (email) => `auth:loginfail:${email.toLowerCase()}`,

  // One-time OAuth CSRF state (Google sign-in).
  oauthState: (state) => `oauth:state:${state}`,

  // Sliding-window rate limits.
  rateAsk: (userId) => `rl:ask:${userId}`,

  // Semantic cache entries (hashes carrying the embedding vector).
  SEMCACHE_PREFIX: 'semcache:',
  SEMCACHE_INDEX: 'idx:semcache',
  semEntry: (userId, schemaChecksum, questionHash) =>
    `semcache:${userId}:${schemaChecksum}:${questionHash}`,
};
