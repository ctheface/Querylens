import { parse } from 'libpg-query';

const DEFAULT_ROW_LIMIT = 1000;

/**
 * Functions that are legal inside a SELECT but must never run against a
 * customer database: sleep-based DoS, file access, cross-db links, admin.
 */
const FORBIDDEN_FUNCTIONS = new Set([
  'pg_sleep',
  'pg_sleep_for',
  'pg_sleep_until',
  'pg_read_file',
  'pg_read_binary_file',
  'pg_ls_dir',
  'pg_stat_file',
  'dblink',
  'dblink_exec',
  'dblink_connect',
  'lo_import',
  'lo_export',
  'pg_terminate_backend',
  'pg_cancel_backend',
  'pg_reload_conf',
  'set_config',
]);

function reject(code, message) {
  return { ok: false, code, message };
}

/**
 * Validates untrusted SQL (LLM-generated or user-edited) and returns either
 * { ok: true, sql } with a row-capped statement, or { ok: false, code, message }.
 *
 * Gates:
 *  1. E_PARSE           - must parse with PostgreSQL's own parser
 *  2. E_EMPTY           - must contain a statement
 *  3. E_MULTI_STATEMENT - exactly one statement
 *  4. E_NOT_SELECT      - top-level node must be SelectStmt
 *  5. E_FORBIDDEN_NODE  - no DML/DDL anywhere (catches WITH x AS (DELETE ...)),
 *                         no SELECT INTO, no FOR UPDATE, no dangerous functions
 *  6. Row cap           - wraps in SELECT * FROM (...) _q LIMIT 1000 when
 *                         the statement has no LIMIT of its own
 */
export async function guardSql(sql) {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    return reject('E_EMPTY', 'No SQL statement was provided.');
  }

  let parsed;
  try {
    parsed = await parse(sql);
  } catch (err) {
    return reject('E_PARSE', `Not valid PostgreSQL: ${err.message}`);
  }

  const stmts = parsed?.stmts ?? [];
  if (stmts.length === 0) {
    return reject('E_EMPTY', 'No SQL statement was provided.');
  }
  if (stmts.length > 1) {
    return reject('E_MULTI_STATEMENT', 'Only a single statement is allowed.');
  }

  const stmt = stmts[0].stmt ?? {};
  if (!('SelectStmt' in stmt)) {
    const kind = Object.keys(stmt)[0] ?? 'unknown';
    return reject('E_NOT_SELECT', `Only SELECT statements are allowed (got ${kind}).`);
  }

  const violation = findViolation(stmt);
  if (violation) {
    return violation;
  }

  return { ok: true, sql: applyRowCap(sql, stmt.SelectStmt) };
}

/** Depth-first walk of the parse tree looking for anything non-read-only. */
function findViolation(node) {
  if (Array.isArray(node)) {
    for (const item of node) {
      const v = findViolation(item);
      if (v) return v;
    }
    return null;
  }
  if (node === null || typeof node !== 'object') {
    return null;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'SelectStmt') {
      if (value?.intoClause) {
        return reject('E_FORBIDDEN_NODE', 'SELECT INTO is not allowed.');
      }
      if (Array.isArray(value?.lockingClause) && value.lockingClause.length > 0) {
        return reject('E_FORBIDDEN_NODE', 'Locking clauses (FOR UPDATE/SHARE) are not allowed.');
      }
    } else if (key.endsWith('Stmt') && key !== 'RawStmt') {
      // Any other statement node anywhere in the tree (including inside CTEs
      // like WITH x AS (DELETE ... RETURNING *)) is a write or DDL attempt.
      return reject('E_FORBIDDEN_NODE', `${key} is not allowed inside a query.`);
    }

    if (key === 'FuncCall') {
      const name = functionName(value);
      if (name && FORBIDDEN_FUNCTIONS.has(name)) {
        return reject('E_FORBIDDEN_NODE', `Function ${name}() is not allowed.`);
      }
    }

    const v = findViolation(value);
    if (v) return v;
  }
  return null;
}

/** Extracts the (unqualified, lowercased) function name from a FuncCall node. */
function functionName(funcCall) {
  const parts = funcCall?.funcname;
  if (!Array.isArray(parts) || parts.length === 0) return null;
  const last = parts[parts.length - 1];
  const name = last?.String?.sval ?? last?.String?.str;
  return typeof name === 'string' ? name.toLowerCase() : null;
}

/**
 * Ensures a row cap. If the statement already has LIMIT (or FETCH FIRST),
 * it is kept; otherwise the query is wrapped in a subquery with LIMIT.
 * Wrapping avoids a deparse step and stays correct across UNION and WITH.
 */
function applyRowCap(sql, selectStmt) {
  if (selectStmt.limitCount) {
    return sql.trim().replace(/;+\s*$/, '');
  }
  const inner = sql.trim().replace(/;+\s*$/, '');
  return `SELECT * FROM (\n${inner}\n) AS _q LIMIT ${DEFAULT_ROW_LIMIT}`;
}
