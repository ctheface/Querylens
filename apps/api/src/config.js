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
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env at the repo root and fill it in.'
    );
  }
  if (!config.llm.hasApiKey) {
    console.warn('[config] GOOGLE_GENERATIVE_AI_API_KEY is not set - /api/ask will fail until it is.');
  }
}
