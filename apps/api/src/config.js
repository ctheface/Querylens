import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load the repo-root .env regardless of where the process was started from.
const rootEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env');
dotenv.config({ path: rootEnvPath });

export const config = {
  port: Number.parseInt(process.env.PORT ?? '4000', 10),
  appDatabaseUrl: process.env.APP_DATABASE_URL,
  demoAdminUrl: process.env.DEMO_ADMIN_URL,
  demoRoPassword: process.env.DEMO_RO_PASSWORD,
  encryptionKey: process.env.ENCRYPTION_KEY,
  redisUrl: process.env.REDIS_URL,
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
    refreshTtlSeconds: 30 * 24 * 60 * 60,
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    // Browser hits the API directly for the OAuth callback (not via Vite proxy).
    googleRedirectUri:
      process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:4000/api/auth/google/callback',
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  },
  semcache: {
    embeddingModel: process.env.EMBEDDING_MODEL ?? 'gemini-embedding-001',
    embeddingDim: 768,
    // Cosine distance (1 - similarity). 0.1 accepts paraphrases, rejects new questions.
    maxDistance: Number.parseFloat(process.env.SEMCACHE_MAX_DISTANCE ?? '0.1'),
    ttlSeconds: 7 * 24 * 60 * 60,
  },
  llm: {
    model: process.env.LLM_MODEL ?? 'gemini-3.5-flash',
    maxOutputTokens: Number.parseInt(process.env.LLM_MAX_OUTPUT_TOKENS ?? '4096', 10),
    // Gemini 3.x reasoning tokens are billed against maxOutputTokens, and schema-to-SQL
    // translation gains little from them. 'auto' leaves the model default in place.
    thinkingBudget: process.env.LLM_THINKING_BUDGET ?? '0',
    // @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY from the environment.
    hasApiKey: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
  },
};

export function assertServerConfig() {
  const missing = [];
  if (!config.appDatabaseUrl) missing.push('APP_DATABASE_URL');
  if (!config.encryptionKey) missing.push('ENCRYPTION_KEY');
  if (!config.redisUrl) missing.push('REDIS_URL');
  if (!config.auth.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env at the repo root and fill it in.'
    );
  }
  if (!config.llm.hasApiKey) {
    console.warn('[config] GOOGLE_GENERATIVE_AI_API_KEY is not set - /api/ask will fail until it is.');
  }
  if (!config.auth.googleClientId || !config.auth.googleClientSecret) {
    console.warn('[config] Google OAuth not configured - "Continue with Google" will be disabled.');
  }
}
