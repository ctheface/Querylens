export function buildClientConfig(dataSource, password) {
  return {
    host: dataSource.host,
    port: dataSource.port,
    database: dataSource.database_name,
    user: dataSource.username,
    password,
    ssl: dataSource.ssl_mode === 'disable' ? undefined : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10_000,
  };
}
