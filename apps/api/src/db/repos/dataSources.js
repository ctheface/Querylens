import { query } from '../pool.js';

const PUBLIC_COLUMNS =
  'id, name, host, port, database_name, username, ssl_mode, last_introspected_at, created_at';

export async function listDataSources() {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM data_sources ORDER BY created_at DESC`
  );
  return rows;
}

/** Includes encrypted credential fields; never send this row to the client. */
export async function getDataSourceWithSecrets(id) {
  const { rows } = await query('SELECT * FROM data_sources WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function insertDataSource(ds) {
  const { rows } = await query(
    `INSERT INTO data_sources
       (name, host, port, database_name, username,
        password_ciphertext, password_iv, password_auth_tag, ssl_mode)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${PUBLIC_COLUMNS}`,
    [
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

export async function deleteDataSource(id) {
  const { rowCount } = await query('DELETE FROM data_sources WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function touchIntrospected(id) {
  await query('UPDATE data_sources SET last_introspected_at = now() WHERE id = $1', [id]);
}
