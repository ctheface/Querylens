CREATE TABLE IF NOT EXISTS data_sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 5432,
  database_name TEXT NOT NULL,
  username TEXT NOT NULL,
  password_ciphertext TEXT NOT NULL,
  password_iv TEXT NOT NULL,
  password_auth_tag TEXT NOT NULL,
  ssl_mode TEXT NOT NULL DEFAULT 'require',
  last_introspected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schema_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_source_id BIGINT NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  tables JSONB NOT NULL,
  checksum TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schema_snapshots_latest
  ON schema_snapshots (data_source_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_source_id BIGINT REFERENCES data_sources(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  generated_sql TEXT,
  status TEXT NOT NULL CHECK (status IN ('ok', 'rejected', 'error')),
  rejection_code TEXT,
  row_count INTEGER,
  exec_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_source_time
  ON messages (data_source_id, created_at DESC);
