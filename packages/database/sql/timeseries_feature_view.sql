-- packages/database/sql/timeseries_feature_view.sql
-- Retaj's Vertical Slice 04: Gapless daily product time-series feature store,
-- Egyptian holiday calendar, and MLflow registry schema support.
--
-- Design reference: Docs/Retaj.md (RET-DB) + Docs/system_design.md sections 5.3 & 6.
-- Contract: exactly one row per (tenant_id, product_id, report_date) over the
-- trailing 180-day analysis window. Days with no sales are explicit zeros.

-- ---------------------------------------------------------------------------
-- 1. Egyptian calendar events (used by the is_holiday / holiday_weight features)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name  VARCHAR(100) NOT NULL,
  event_type  VARCHAR(50)  NOT NULL, -- national_holiday | religious_season | shopping_season | back_to_school
  country     CHAR(2)      NOT NULL DEFAULT 'EG',
  starts_on   DATE         NOT NULL,
  ends_on     DATE         NOT NULL,
  weight      NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT calendar_events_valid_range CHECK (ends_on >= starts_on)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_lookup
  ON calendar_events (country, starts_on, ends_on);

-- ---------------------------------------------------------------------------
-- 2. Gapless daily product time-series view
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_daily_product_timeseries AS
WITH grid AS (
  -- Every active product x every calendar day in its 180-day window (gapless).
  SELECT
    p.tenant_id,
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    gs.day::date AS report_date,
    EXTRACT(ISODOW FROM gs.day)::int AS day_of_week, -- 5 = Friday, 6 = Saturday (EG weekend)
    EXTRACT(MONTH FROM gs.day)::int AS month
  FROM products p
  CROSS JOIN LATERAL generate_series(
    GREATEST(
      date_trunc('day', p.created_at),
      date_trunc('day', now()) - INTERVAL '180 days'
    ),
    date_trunc('day', now()),
    INTERVAL '1 day'
  ) AS gs(day)
  WHERE p.is_active
),
daily_sales AS (
  SELECT
    oi.product_id,
    DATE(o.created_at) AS report_date,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.quantity * oi.unit_price) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY oi.product_id, DATE(o.created_at)
),
daily_pricing AS (
  -- Realized effective discount against the current list price. Historical list
  -- prices are not versioned in this schema, so this is a documented approximation.
  SELECT
    oi.product_id,
    DATE(o.created_at) AS report_date,
    AVG(1 - (oi.unit_price / NULLIF(p.price, 0))) AS discount_pct,
    AVG(oi.unit_price) AS avg_unit_price
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN orders o   ON o.id = oi.order_id
  WHERE o.status <> 'cancelled'
  GROUP BY oi.product_id, DATE(o.created_at)
),
daily_stock AS (
  -- inventory stores only a live snapshot; reconstruct end-of-day level backwards:
  -- stock(t) = current_qty + SUM(units_sold strictly after t)
  SELECT
    g.product_id,
    g.report_date,
    COALESCE(i.quantity, 0)::numeric + COALESCE(fut.units_after, 0) AS stock_level
  FROM grid g
  LEFT JOIN inventory i ON i.product_id = g.product_id
  LEFT JOIN LATERAL (
    SELECT SUM(s2.units_sold) AS units_after
    FROM daily_sales s2
    WHERE s2.product_id = g.product_id
      AND s2.report_date > g.report_date
  ) fut ON true
)
SELECT
  g.tenant_id,
  g.product_id,
  g.sku,
  g.product_name,
  g.report_date,
  COALESCE(ds.units_sold, 0)                    AS units_sold,     -- explicit zero-fill
  COALESCE(ds.revenue, 0)                       AS revenue,
  COALESCE(dp.discount_pct, 0)                  AS discount_pct,
  COALESCE(dp.avg_unit_price, p.price)          AS avg_unit_price,
  GREATEST(COALESCE(dst.stock_level, 0), 0)::int AS stock_level,
  (ce.id IS NOT NULL)                           AS is_holiday,
  COALESCE(ce.weight, 0)                        AS holiday_weight,
  ce.event_name                                 AS holiday_name,
  g.day_of_week,
  g.month
FROM grid g
JOIN products p ON p.id = g.product_id
LEFT JOIN daily_sales   ds  ON ds.product_id  = g.product_id AND ds.report_date  = g.report_date
LEFT JOIN daily_pricing dp  ON dp.product_id  = g.product_id AND dp.report_date  = g.report_date
LEFT JOIN daily_stock   dst ON dst.product_id = g.product_id AND dst.report_date = g.report_date
LEFT JOIN calendar_events ce
       ON ce.country = 'EG'
      AND g.report_date BETWEEN ce.starts_on AND ce.ends_on;

-- ---------------------------------------------------------------------------
-- 3. Read-only analyst grants (mirror analytical_views.sql conventions)
-- ---------------------------------------------------------------------------
GRANT SELECT ON v_daily_product_timeseries TO techzone_readonly_analyst;

COMMENT ON VIEW v_daily_product_timeseries IS
  'Retaj slice 04: gapless daily (tenant, product) sales series with discount, stock and Egyptian holiday features for forecasting.';
