import pg from 'pg';

const MAX_RETURNED_ROWS = 1000;

/**
 * Executes a validated SELECT inside a READ ONLY transaction with a
 * statement timeout. The transaction is rolled back rather than committed,
 * so even a bug elsewhere cannot persist anything.
 */
export async function executeReadOnly(clientConfig, sql) {
  const client = new pg.Client(clientConfig);
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '10s'");

    const started = performance.now();
    const result = await client.query(sql);
    const execMs = Math.round(performance.now() - started);

    await client.query('ROLLBACK');

    return {
      columns: result.fields.map((f) => f.name),
      rows: result.rows.slice(0, MAX_RETURNED_ROWS),
      rowCount: result.rowCount ?? result.rows.length,
      execMs,
    };
  } finally {
    await client.end().catch(() => {});
  }
}
