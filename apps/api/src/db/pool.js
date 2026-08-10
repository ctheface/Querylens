import pg from 'pg';
import { config } from '../config.js';

const LOCAL_HOSTS = /(^|@)(localhost|127\.0\.0\.1)/;

export function makePool(connectionString, options = {}) {
  if (!connectionString) {
    throw new Error('makePool called without a connection string');
  }
  return new pg.Pool({
    connectionString,
    max: 5,
    // Supabase pooler requires TLS; skip it only for local databases.
    ssl: LOCAL_HOSTS.test(connectionString) ? undefined : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10_000,
    ...options,
  });
}

let _appPool = null;

export function appPool() {
  if (!_appPool) {
    _appPool = makePool(config.appDatabaseUrl);
  }
  return _appPool;
}

export async function query(text, params) {
  return appPool().query(text, params);
}
