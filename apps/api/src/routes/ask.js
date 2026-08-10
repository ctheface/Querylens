import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/errors.js';
import { generateSql } from '../services/llm/generateSql.js';
import { guardSql } from '../services/sqlguard/index.js';
import { executeReadOnly } from '../services/connector/execute.js';
import { introspectAndStore, connectionConfigFor } from '../services/introspectAndStore.js';
import { getDataSourceWithSecrets } from '../db/repos/dataSources.js';
import { latestSnapshot } from '../db/repos/snapshots.js';
import { logMessage } from '../db/repos/messages.js';

const router = Router();

const askSchema = z.object({
  dataSourceId: z.coerce.number().int(),
  question: z.string().trim().min(3).max(1000),
});

const runSchema = z.object({
  dataSourceId: z.coerce.number().int(),
  sql: z.string().trim().min(1).max(20_000),
});

async function loadSourceAndSchema(dataSourceId) {
  const ds = await getDataSourceWithSecrets(dataSourceId);
  if (!ds) {
    throw new ApiError(404, 'E_NOT_FOUND', 'Data source not found');
  }
  let snapshot = await latestSnapshot(ds.id);
  if (!snapshot) {
    snapshot = await introspectAndStore(ds);
  }
  return { ds, snapshot };
}

/**
 * Shared tail of /ask and /run: validate untrusted SQL with the guard,
 * execute read-only, log the outcome, and shape the response.
 */
async function guardAndExecute({ ds, question, sql, res }) {
  const guard = await guardSql(sql);
  if (!guard.ok) {
    await logMessage({
      dataSourceId: ds.id,
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
      question,
      generatedSql: guard.sql,
      status: 'ok',
      rowCount: result.rowCount,
      execMs: result.execMs,
    });
    return res.json({ sql: guard.sql, ...result });
  } catch (err) {
    await logMessage({
      dataSourceId: ds.id,
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

router.post('/ask', async (req, res) => {
  const { dataSourceId, question } = askSchema.parse(req.body);
  const { ds, snapshot } = await loadSourceAndSchema(dataSourceId);

  let sql;
  try {
    sql = await generateSql(snapshot.tables, question);
  } catch (err) {
    console.error('LLM error:', err);
    throw new ApiError(502, 'E_LLM', `SQL generation failed: ${err.message}`);
  }

  return guardAndExecute({ ds, question, sql, res });
});

router.post('/run', async (req, res) => {
  const { dataSourceId, sql } = runSchema.parse(req.body);
  const { ds } = await loadSourceAndSchema(dataSourceId);
  return guardAndExecute({ ds, question: '(manual SQL run)', sql, res });
});

export default router;
