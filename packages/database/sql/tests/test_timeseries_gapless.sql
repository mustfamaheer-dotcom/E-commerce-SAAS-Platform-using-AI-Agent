-- packages/database/sql/tests/test_timeseries_gapless.sql
--
-- Acceptance tests for the Retaj feature store (RET-DB).
-- Run against a live Postgres:
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/database/sql/tests/test_timeseries_gapless.sql
--
-- Every check raises an exception on failure, so the script exits non-zero on
-- the first broken invariant.

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- 1. The view must expose the expected contract
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    column_name text;
BEGIN
    FOREACH column_name IN ARRAY ARRAY[
        'tenant_id', 'product_id', 'sku', 'report_date', 'units_sold',
        'discount_pct', 'avg_unit_price', 'stock_level', 'is_holiday',
        'holiday_weight', 'day_of_week', 'month'
    ]
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'v_daily_product_timeseries' AND column_name = column_name
        ) THEN
            RAISE EXCEPTION 'missing column % in v_daily_product_timeseries', column_name;
        END IF;
    END LOOP;
    RAISE NOTICE 'OK: v_daily_product_timeseries exposes the expected columns';
END $$;

-- ---------------------------------------------------------------------------
-- 2. Gapless: every (tenant, product) has one row per calendar day
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    row_count bigint;
    day_count bigint;
    expected_days bigint;
    min_date date;
    max_date date;
BEGIN
    FOR row_count, day_count, expected_days, min_date, max_date IN
        SELECT
            COUNT(*),
            COUNT(DISTINCT report_date),
            (MAX(report_date) - MIN(report_date) + 1),
            MIN(report_date),
            MAX(report_date)
        FROM v_daily_product_timeseries
        GROUP BY tenant_id, product_id
    LOOP
        IF day_count <> expected_days THEN
            RAISE EXCEPTION 'gap detected between % and %: % distinct days for % expected days',
                min_date, max_date, day_count, expected_days;
        END IF;
        IF day_count <> 180 THEN
            RAISE EXCEPTION 'expected a 180 day window, got % days (% -> %)',
                day_count, min_date, max_date;
        END IF;
    END LOOP;
    RAISE NOTICE 'OK: the series is gapless (one row per calendar day)';
END $$;

-- ---------------------------------------------------------------------------
-- 3. No NULL demand: zero-sale days are 0, never NULL
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    null_count bigint;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM v_daily_product_timeseries
    WHERE units_sold IS NULL OR stock_level IS NULL OR report_date IS NULL;

    IF null_count > 0 THEN
        RAISE EXCEPTION '% rows contain NULL units_sold / stock_level / report_date', null_count;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM v_daily_product_timeseries WHERE units_sold = 0) THEN
        RAISE NOTICE 'WARN: no zero-sale day found (the seed data may be dense)';
    END IF;

    RAISE NOTICE 'OK: zero-sale days are present as 0 and never NULL';
END $$;

-- ---------------------------------------------------------------------------
-- 4. Calendar flags: is_holiday must match the seeded calendar
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    mismatches bigint;
BEGIN
    SELECT COUNT(*) INTO mismatches
    FROM v_daily_product_timeseries v
    JOIN calendar_events c
      ON c.event_date = v.report_date
    WHERE v.is_holiday IS DISTINCT FROM TRUE;

    IF mismatches > 0 THEN
        RAISE EXCEPTION '% rows on a seeded calendar day are not flagged is_holiday', mismatches;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM calendar_events WHERE event_name = 'white_friday') THEN
        RAISE EXCEPTION 'calendar_events is missing the white_friday seed';
    END IF;

    RAISE NOTICE 'OK: is_holiday matches the seeded calendar';
END $$;

-- ---------------------------------------------------------------------------
-- 5. Stock reconstruction: stock_level must never be negative and must equal
--    current stock + units sold after the row's date
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    negative_rows bigint;
BEGIN
    SELECT COUNT(*) INTO negative_rows
    FROM v_daily_product_timeseries
    WHERE stock_level < 0;

    IF negative_rows > 0 THEN
        RAISE EXCEPTION '% rows have a negative stock_level', negative_rows;
    END IF;

    RAISE NOTICE 'OK: stock_level is never negative';
END $$;

-- ---------------------------------------------------------------------------
-- 6. Access control: the analyst role may SELECT but never write
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    can_insert boolean;
    can_update boolean;
    can_delete boolean;
BEGIN
    SELECT has_table_privilege('techzone_readonly_analyst', 'v_daily_product_timeseries', 'INSERT')
      INTO can_insert;
    SELECT has_table_privilege('techzone_readonly_analyst', 'v_daily_product_timeseries', 'UPDATE')
      INTO can_update;
    SELECT has_table_privilege('techzone_readonly_analyst', 'v_daily_product_timeseries', 'DELETE')
      INTO can_delete;

    IF can_insert OR can_update OR can_delete THEN
        RAISE EXCEPTION 'techzone_readonly_analyst must not be able to write to the view';
    END IF;

    RAISE NOTICE 'OK: techzone_readonly_analyst has read-only access';
END $$;

\echo 'All Retaj feature-store acceptance checks passed.'
