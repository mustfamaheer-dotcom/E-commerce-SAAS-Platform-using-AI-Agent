-- packages/database/sql/analytical_views.sql
-- Abdallah's Vertical Slice: Semantic Analytical Views optimized for LLM Text-to-SQL Comprehension

-- 1. Detailed Order Profit Analytics View
CREATE OR REPLACE VIEW v_order_profit_analytics AS
SELECT
  o.id AS order_id,
  o.tenant_id,
  o.created_at AS order_date,
  DATE(o.created_at) AS order_day,
  o.status AS order_status,
  c.id AS customer_id,
  c.name AS customer_name,
  COALESCE(c.segment, 'retail') AS customer_segment,
  COALESCE(c.phone, 'Cairo') AS city,
  p.id AS product_id,
  p.sku,
  p.name AS product_name,
  cat.id AS category_id,
  COALESCE(cat.name, 'General') AS category_name,
  oi.quantity,
  oi.unit_price,
  (oi.unit_price * oi.quantity) AS gross_revenue,
  p.cost AS unit_cost,
  (p.cost * oi.quantity) AS total_cost,
  ((oi.unit_price * oi.quantity) - (p.cost * oi.quantity)) AS net_profit
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
LEFT JOIN categories cat ON cat.id = p.category_id
LEFT JOIN customers c ON c.id = o.customer_id;

-- 2. Daily Category Performance & KPIs View
CREATE OR REPLACE VIEW v_daily_category_kpis AS
SELECT
  o.tenant_id,
  DATE(o.created_at) AS report_date,
  COALESCE(cat.id, '00000000-0000-0000-0000-000000000000'::uuid) AS category_id,
  COALESCE(cat.name, 'Uncategorized') AS category_name,
  COUNT(DISTINCT o.id) AS order_count,
  SUM(oi.quantity) AS units_sold,
  ROUND(SUM(oi.unit_price * oi.quantity)::numeric, 2) AS gross_revenue,
  ROUND(SUM(p.cost * oi.quantity)::numeric, 2) AS total_cost,
  ROUND(SUM((oi.unit_price * oi.quantity) - (p.cost * oi.quantity))::numeric, 2) AS net_profit,
  ROUND((SUM(oi.unit_price * oi.quantity) / NULLIF(COUNT(DISTINCT o.id), 0))::numeric, 2) AS avg_order_value
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
LEFT JOIN categories cat ON cat.id = p.category_id
WHERE o.status != 'cancelled'
GROUP BY o.tenant_id, DATE(o.created_at), cat.id, cat.name;

-- 3. Grant SELECT on views to techzone_readonly_analyst
GRANT SELECT ON v_order_profit_analytics TO techzone_readonly_analyst;
GRANT SELECT ON v_daily_category_kpis TO techzone_readonly_analyst;
