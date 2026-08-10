import test from 'node:test';
import assert from 'node:assert/strict';
import { guardSql } from '../src/services/sqlguard/index.js';

async function expectRejection(sql, code) {
  const result = await guardSql(sql);
  assert.equal(result.ok, false, `expected rejection for: ${sql}`);
  assert.equal(result.code, code, `expected ${code} for: ${sql} (got ${result.code})`);
}

test('accepts a plain SELECT and adds a row cap', async () => {
  const result = await guardSql('SELECT name, price FROM products');
  assert.equal(result.ok, true);
  assert.match(result.sql, /LIMIT 1000/);
});

test('keeps an existing LIMIT without wrapping', async () => {
  const result = await guardSql('SELECT name FROM products LIMIT 5;');
  assert.equal(result.ok, true);
  assert.equal(result.sql, 'SELECT name FROM products LIMIT 5');
});

test('accepts joins, aggregates, CTEs, and unions', async () => {
  const queries = [
    `SELECT r.name, sum(oi.quantity * oi.unit_price) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN customers c ON c.id = o.customer_id
     JOIN regions r ON r.id = c.region_id
     GROUP BY r.name ORDER BY revenue DESC`,
    `WITH totals AS (SELECT order_id, sum(quantity) q FROM order_items GROUP BY order_id)
     SELECT * FROM totals WHERE q > 3`,
    `SELECT name FROM products UNION ALL SELECT name FROM regions`,
  ];
  for (const sql of queries) {
    const result = await guardSql(sql);
    assert.equal(result.ok, true, `expected ok for: ${sql} (got ${result.code})`);
  }
});

test('rejects empty and unparseable input', async () => {
  await expectRejection('', 'E_EMPTY');
  await expectRejection('   ', 'E_EMPTY');
  await expectRejection('SELECT FROM WHERE', 'E_PARSE');
  await expectRejection('DROP TABLE users CASCADE MAYBE', 'E_PARSE');
});

test('rejects multiple statements (classic injection)', async () => {
  await expectRejection('SELECT 1; DROP TABLE users', 'E_MULTI_STATEMENT');
  await expectRejection('SELECT 1; SELECT 2', 'E_MULTI_STATEMENT');
});

test('rejects non-SELECT statements', async () => {
  await expectRejection('DELETE FROM orders', 'E_NOT_SELECT');
  await expectRejection("UPDATE products SET price = 0 WHERE id = 1", 'E_NOT_SELECT');
  await expectRejection("INSERT INTO products (name) VALUES ('x')", 'E_NOT_SELECT');
  await expectRejection('DROP TABLE orders', 'E_NOT_SELECT');
  await expectRejection('TRUNCATE orders', 'E_NOT_SELECT');
  await expectRejection('CREATE TABLE evil (id int)', 'E_NOT_SELECT');
  await expectRejection("SET work_mem = '1GB'", 'E_NOT_SELECT');
  await expectRejection('EXPLAIN SELECT 1', 'E_NOT_SELECT');
});

test('rejects data-modifying CTEs hidden inside a SELECT', async () => {
  await expectRejection(
    'WITH x AS (DELETE FROM orders RETURNING *) SELECT * FROM x',
    'E_FORBIDDEN_NODE'
  );
  await expectRejection(
    "WITH x AS (UPDATE products SET price = 0 RETURNING id) SELECT count(*) FROM x",
    'E_FORBIDDEN_NODE'
  );
  await expectRejection(
    "WITH x AS (INSERT INTO orders (customer_id, status, ordered_at) VALUES (1, 'x', now()) RETURNING id) SELECT * FROM x",
    'E_FORBIDDEN_NODE'
  );
});

test('rejects SELECT INTO and locking clauses', async () => {
  await expectRejection('SELECT * INTO evil_copy FROM orders', 'E_FORBIDDEN_NODE');
  await expectRejection('SELECT * FROM orders FOR UPDATE', 'E_FORBIDDEN_NODE');
  await expectRejection('SELECT * FROM orders FOR SHARE', 'E_FORBIDDEN_NODE');
});

test('rejects dangerous function calls, including nested ones', async () => {
  await expectRejection('SELECT pg_sleep(10)', 'E_FORBIDDEN_NODE');
  await expectRejection("SELECT pg_read_file('/etc/passwd')", 'E_FORBIDDEN_NODE');
  await expectRejection(
    "SELECT * FROM products WHERE price > (SELECT pg_sleep(5))::int",
    'E_FORBIDDEN_NODE'
  );
  await expectRejection("SELECT set_config('work_mem', '1GB', false)", 'E_FORBIDDEN_NODE');
  await expectRejection('SELECT pg_terminate_backend(123)', 'E_FORBIDDEN_NODE');
});

test('row cap wrapping stays valid for UNION and WITH queries', async () => {
  const union = await guardSql('SELECT name FROM products UNION SELECT name FROM regions');
  assert.equal(union.ok, true);
  assert.match(union.sql, /^SELECT \* FROM \(/);

  const cte = await guardSql(
    'WITH t AS (SELECT id FROM orders) SELECT count(*) FROM t'
  );
  assert.equal(cte.ok, true);
  assert.match(cte.sql, /LIMIT 1000/);

  // The wrapped SQL must itself pass the guard (i.e. still parse as one SELECT).
  const rewrapped = await guardSql(union.sql);
  assert.equal(rewrapped.ok, true);
});
