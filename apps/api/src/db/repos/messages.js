import { query } from '../pool.js';

/**
 * Append-only log of every question and its outcome. `status` is one of
 * 'ok' | 'rejected' | 'error'. Best-effort: logging must never break a request.
 */
export async function logMessage(entry) {
  try {
    await query(
      `INSERT INTO messages
         (data_source_id, user_id, question, generated_sql, status, rejection_code, row_count, exec_ms, cache_hit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.dataSourceId,
        entry.userId ?? null,
        entry.question,
        entry.generatedSql ?? null,
        entry.status,
        entry.rejectionCode ?? null,
        entry.rowCount ?? null,
        entry.execMs ?? null,
        entry.cacheHit ?? false,
      ]
    );
  } catch (err) {
    console.error('failed to log message:', err.message);
  }
}
