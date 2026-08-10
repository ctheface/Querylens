-- Demo "customer" database: a small e-commerce dataset.
-- Applied by `npm run seed:demo` against DEMO_ADMIN_URL (Supabase project 2).

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS regions CASCADE;

CREATE TABLE regions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL
);

CREATE TABLE customers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  region_id BIGINT NOT NULL REFERENCES regions(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  signed_up_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL,
  ordered_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL
);

INSERT INTO regions (name, country) VALUES
  ('North India', 'India'),
  ('South India', 'India'),
  ('West India', 'India'),
  ('East India', 'India'),
  ('West Coast', 'USA'),
  ('East Coast', 'USA'),
  ('Western Europe', 'Germany'),
  ('Southeast Asia', 'Singapore');

INSERT INTO customers (region_id, name, email, signed_up_at)
SELECT
  1 + floor(random() * 8)::int,
  'Customer ' || i,
  'customer' || i || '@example.com',
  now() - (random() * interval '730 days')
FROM generate_series(1, 500) AS i;

INSERT INTO products (name, category, price)
SELECT
  initcap(cat.name) || ' ' || model.suffix,
  cat.name,
  round((cat.base + random() * cat.spread)::numeric, 2)
FROM (
  VALUES
    ('laptop', 45000.0, 90000.0),
    ('phone', 12000.0, 70000.0),
    ('headphones', 1200.0, 20000.0),
    ('monitor', 8000.0, 30000.0),
    ('keyboard', 900.0, 9000.0),
    ('mouse', 400.0, 5000.0),
    ('tablet', 15000.0, 50000.0),
    ('camera', 25000.0, 90000.0),
    ('speaker', 2000.0, 25000.0),
    ('smartwatch', 3000.0, 35000.0),
    ('router', 1500.0, 12000.0),
    ('printer', 7000.0, 25000.0),
    ('webcam', 1500.0, 9000.0),
    ('microphone', 2500.0, 20000.0),
    ('charger', 500.0, 4000.0)
) AS cat(name, base, spread)
CROSS JOIN (
  VALUES ('Pro'), ('Air'), ('Max'), ('Lite')
) AS model(suffix);

INSERT INTO orders (customer_id, status, ordered_at)
SELECT
  1 + floor(random() * 500)::int,
  (ARRAY['delivered', 'delivered', 'delivered', 'shipped', 'pending', 'cancelled'])[1 + floor(random() * 6)::int],
  now() - (random() * interval '540 days')
FROM generate_series(1, 5000);

-- 1 to 3 items per order, priced from the product with a small random discount.
-- The random product choice is made in a subquery SELECT list rather than an
-- uncorrelated LATERAL, which Postgres would evaluate once for every row.
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT
  cand.order_id,
  cand.product_id,
  cand.quantity,
  round((p.price * cand.discount)::numeric, 2)
FROM (
  SELECT
    o.id AS order_id,
    1 + floor(random() * (SELECT count(*) FROM products))::int AS product_id,
    1 + floor(random() * 4)::int AS quantity,
    0.9 + random() * 0.1 AS discount
  FROM orders o
  CROSS JOIN generate_series(1, 3) AS item_slot
  WHERE item_slot = 1 OR random() < 0.45
) AS cand
JOIN products p ON p.id = cand.product_id;

ANALYZE regions, customers, products, orders, order_items;
