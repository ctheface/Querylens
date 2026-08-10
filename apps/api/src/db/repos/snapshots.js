import { query } from '../pool.js';

export async function insertSnapshot(dataSourceId, tables, checksum) {
  const { rows } = await query(
    `INSERT INTO schema_snapshots (data_source_id, tables, checksum)
     VALUES ($1, $2, $3)
     RETURNING id, data_source_id, tables, checksum, captured_at`,
    [dataSourceId, JSON.stringify(tables), checksum]
  );
  return rows[0];
}

export async function latestSnapshot(dataSourceId) {
  const { rows } = await query(
    `SELECT id, data_source_id, tables, checksum, captured_at
     FROM schema_snapshots
     WHERE data_source_id = $1
     ORDER BY captured_at DESC
     LIMIT 1`,
    [dataSourceId]
  );
  return rows[0] ?? null;
}
