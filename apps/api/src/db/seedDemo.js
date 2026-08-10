import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { makePool } from './pool.js';

const seedPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed', 'demo.sql');

async function seed() {
  if (!config.demoAdminUrl) {
    throw new Error('DEMO_ADMIN_URL is not set in .env');
  }
  const pool = makePool(config.demoAdminUrl, { max: 1 });
  const client = await pool.connect();
  try {
    console.log('applying demo schema and data (takes a few seconds)...');
    await client.query(fs.readFileSync(seedPath, 'utf8'));

    const counts = await client.query(`
      SELECT
        (SELECT count(*) FROM customers) AS customers,
        (SELECT count(*) FROM products) AS products,
        (SELECT count(*) FROM orders) AS orders,
        (SELECT count(*) FROM order_items) AS order_items
    `);
    console.log('seeded:', counts.rows[0]);

    if (config.demoRoPassword) {
      // Escape single quotes; role passwords cannot be bound as parameters.
      const pw = config.demoRoPassword.replaceAll("'", "''");
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'querylens_ro') THEN
            CREATE ROLE querylens_ro LOGIN;
          END IF;
        END
        $$;
      `);
      await client.query(`ALTER ROLE querylens_ro LOGIN PASSWORD '${pw}'`);
      await client.query('GRANT USAGE ON SCHEMA public TO querylens_ro');
      await client.query('GRANT SELECT ON ALL TABLES IN SCHEMA public TO querylens_ro');
      await client.query(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO querylens_ro'
      );
      console.log('read-only role querylens_ro is ready.');
      console.log(
        'NOTE: when connecting through the Supabase pooler, the username is querylens_ro.<project-ref>'
      );
    } else {
      console.warn('DEMO_RO_PASSWORD not set - skipped creating the read-only role.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('seed failed:', err.message);
  process.exit(1);
});
