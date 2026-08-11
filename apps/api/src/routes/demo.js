import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/errors.js';
import { config } from '../config.js';
import { enforceRateLimit } from '../redis/rateLimit.js';
import { keys } from '../redis/keys.js';
import { generateSql } from '../services/llm/generateSql.js';
import { guardSql } from '../services/sqlguard/index.js';
import { executeReadOnly } from '../services/connector/execute.js';
import { introspectAndStore, connectionConfigFor } from '../services/introspectAndStore.js';
import * as semcache from '../services/semcache/index.js';
import { getDataSourceByIdUnscoped } from '../db/repos/dataSources.js';
import { latestSnapshot } from '../db/repos/snapshots.js';
import { logMessage } from '../db/repos/messages.js';

/**
 * Public demo mode: lets visitors query the seeded demo database without an
 * account. Enabled by setting DEMO_DATA_SOURCE_ID to an existing data source.
 *
 * Safety posture is identical to the authenticated path (sqlguard AST checks,
 * read-only transaction, statement timeout, read-only DB role) plus a stricter
 * per-IP rate limit. The semantic cache is shared across all demo visitors
 * under a single "demo" tag — the demo data is public by definition.
 */
const router = Router();

// Stricter than the per-user limit: the whole internet shares this endpoint.
const DEMO_LIMIT = { windowMs: 60_000, limit: 6, what: 'demo questions' };
const DEMO_CACHE_USER = 'demo';

const askSchema = z.object({
  question: z.string().trim().min(3).max(500),
});

const runSchema = z.object({
  sql: z.string().trim().min(1).max(20_000),
});

function demoEnabled() {
  return Number.isInteger(config.demoDataSourceId) && config.demoDataSourceId > 0;
}

async function loadDemoSource() {
  if (!demoEnabled()) {
    throw new ApiError(503, 'E_DEMO_DISABLED', 'The public demo is not configured.');
  }
  const ds = await getDataSourceByIdUnscoped(config.demoDataSourceId);
  if (!ds) {
    throw new ApiError(503, 'E_DEMO_DISABLED', 'The demo data source no longer exists.');
  }
  let snapshot = await latestSnapshot(ds.id);
  if (!snapshot) {
    snapshot = await introspectAndStore(ds);
  }
  return { ds, snapshot };
}

function clientIp(req) {
  return req.ip ?? 'unknown';
}

async function guardAndExecute({ ds, question, sql, res, cache, onSuccess }) {
  const guard = await guardSql(sql);
  if (!guard.ok) {
    await logMessage({
      dataSourceId: ds.id,
      userId: null,
      question,
      generatedSql: sql,
      status: 'rejected',
      rejectionCode: guard.code,
    });
    return res.status(400).json({ code: guard.code, message: guard.message, sql });
  }

  try {
    const result = await executeReadOnly(connectionConfigFor(ds), guard.sql);
    await logMessage({
      dataSourceId: ds.id,
      userId: null,
      question,
      generatedSql: guard.sql,
      status: 'ok',
      rowCount: result.rowCount,
      execMs: result.execMs,
      cacheHit: Boolean(cache?.hit),
    });
    if (onSuccess) {
      onSuccess(guard.sql).catch((err) => console.warn('post-success hook failed:', err.message));
    }
    return res.json({ sql: guard.sql, cache: cache ?? { hit: false }, ...result });
  } catch (err) {
    await logMessage({
      dataSourceId: ds.id,
      userId: null,
      question,
      generatedSql: guard.sql,
      status: 'error',
      rejectionCode: 'E_EXECUTION',
    });
    return res
      .status(400)
      .json({ code: 'E_EXECUTION', message: err.message, sql: guard.sql });
  }
}

router.get('/status', (_req, res) => {
  res.json({ enabled: demoEnabled() });
});

router.get('/schema', async (_req, res) => {
  const { ds, snapshot } = await loadDemoSource();
  res.json({
    name: ds.name,
    tables: snapshot.tables,
    checksum: snapshot.checksum,
    capturedAt: snapshot.captured_at,
  });
});

router.post('/ask', async (req, res) => {
  const { question } = askSchema.parse(req.body);
  await enforceRateLimit(keys.rateDemo(clientIp(req)), DEMO_LIMIT);
  const { ds, snapshot } = await loadDemoSource();

  const cached = await semcache.lookup({
    userId: DEMO_CACHE_USER,
    schemaChecksum: snapshot.checksum,
    question,
  });
  if (cached) {
    return guardAndExecute({
      ds,
      question,
      sql: cached.sql,
      res,
      cache: {
        hit: true,
        exact: cached.exact,
        similarity: cached.similarity,
        matchedQuestion: cached.question,
      },
    });
  }

  let sql;
  try {
    sql = await generateSql(snapshot.tables, question);
  } catch (err) {
    console.error('LLM error (demo):', err);
    throw new ApiError(502, 'E_LLM', `SQL generation failed: ${err.message}`);
  }

  return guardAndExecute({
    ds,
    question,
    sql,
    res,
    cache: { hit: false },
    onSuccess: (finalSql) =>
      semcache.store({
        userId: DEMO_CACHE_USER,
        schemaChecksum: snapshot.checksum,
        question,
        sql: finalSql,
      }),
  });
});

router.post('/run', async (req, res) => {
  const { sql } = runSchema.parse(req.body);
  await enforceRateLimit(keys.rateDemo(clientIp(req)), DEMO_LIMIT);
  const { ds } = await loadDemoSource();
  return guardAndExecute({ ds, question: '(demo manual SQL run)', sql, res });
});

export default router;
