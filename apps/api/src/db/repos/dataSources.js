import { query } from '../pool.js';

const PUBLIC_COLUMNS =
  'id, name, host, port, database_name, username, ssl_mode, last_introspected_at, created_at';

export async function listDataSources(userId) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM data_sources WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Includes encrypted credential fields; never send this row to the client.
 * Scoped by owner: a wrong-user lookup behaves exactly like a missing row.
 */
export async function getDataSourceWithSecrets(id, userId) {
  const { rows } = await query(
    'SELECT * FROM data_sources WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] ?? null;
}

/**
 * Owner-agnostic lookup used ONLY by the public demo route, where the target
 * data source is pinned by DEMO_DATA_SOURCE_ID in the environment — never by
 * caller-supplied input.
 */
export async function getDataSourceByIdUnscoped(id) {
  const { rows } = await query('SELECT * FROM data_sources WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function insertDataSource(ds) {
  const { rows } = await query(
    `INSERT INTO data_sources
       (user_id, name, host, port, database_name, username,
        password_ciphertext, password_iv, password_auth_tag, ssl_mode)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${PUBLIC_COLUMNS}`,
    [
      ds.userId,
      ds.name,
      ds.host,
      ds.port,
      ds.database,
      ds.username,
      ds.passwordCiphertext,
      ds.passwordIv,
      ds.passwordAuthTag,
      ds.sslMode,
    ]
  );
  return rows[0];
}

export async function deleteDataSource(id, userId) {
  const { rowCount } = await query(
    'DELETE FROM data_sources WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
}

export async function touchIntrospected(id) {
  await query('UPDATE data_sources SET last_introspected_at = now() WHERE id = $1', [id]);
}
