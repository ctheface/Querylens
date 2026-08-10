import pg from 'pg';

/**
 * Opens a single connection, runs SELECT 1, and closes it.
 * Throws with a readable message when the connection fails.
 */
export async function testConnection(clientConfig) {
  const client = new pg.Client(clientConfig);
  try {
    await client.connect();
    await client.query('SELECT 1');
  } finally {
    await client.end().catch(() => {});
  }
}
