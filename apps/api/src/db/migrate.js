import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appPool } from './pool.js';

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

async function migrate() {
  const pool = appPool();
  const client = await pool.connect();
  try {
    await client.query(
      'CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())'
    );
    const { rows } = await client.query('SELECT name FROM _migrations');
    const applied = new Set(rows.map((r) => r.name));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`applying ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        ran += 1;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
    console.log(ran > 0 ? `applied ${ran} migration(s)` : 'already up to date');
  } finally {
    client.release();
    await appPool().end();
  }
}

migrate().catch((err) => {
  console.error('migration failed:', err.message);
  process.exit(1);
});
