import crypto from 'node:crypto';
import pg from 'pg';

const INTROSPECT_SQL = `
  SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable
  FROM information_schema.tables t
  JOIN information_schema.columns c
    ON c.table_schema = t.table_schema AND c.table_name = t.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name, c.ordinal_position
`;

/**
 * Reads the public schema of the target database and returns
 * { tables: [{ name, columns: [{ name, type, nullable }] }], checksum }.
 * The checksum ties cached artifacts (and later, the semantic cache) to a schema version.
 */
export async function introspectSchema(clientConfig) {
  const client = new pg.Client(clientConfig);
  try {
    await client.connect();
    const { rows } = await client.query(INTROSPECT_SQL);

    const byTable = new Map();
    for (const row of rows) {
      if (!byTable.has(row.table_name)) {
        byTable.set(row.table_name, { name: row.table_name, columns: [] });
      }
      byTable.get(row.table_name).columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
      });
    }

    const tables = [...byTable.values()];
    const checksum = crypto
      .createHash('sha256')
      .update(JSON.stringify(tables))
      .digest('hex');

    return { tables, checksum };
  } finally {
    await client.end().catch(() => {});
  }
}
