-- packages/database/sql/renad_indexes_and_rls.sql
-- Renad Hakim (Vertical Slice 05): Customer RFM Segmentation, Orders & Promotions RLS and Indexes

-- 1. Enable Row-Level Security (RLS) on Renad's Commerce Tables
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotions ENABLE ROW LEVEL SECURITY;

-- 2. Create Tenant Isolation Policies (enforces SET LOCAL app.current_tenant_id = :tenant_id)
DROP POLICY IF EXISTS tenant_isolation_customers ON customers;
CREATE POLICY tenant_isolation_customers ON customers
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_orders ON orders;
CREATE POLICY tenant_isolation_orders ON orders
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS tenant_isolation_order_items ON order_items;
CREATE POLICY tenant_isolation_order_items ON order_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND o.tenant_id::text = current_setting('app.current_tenant_id', true)
        )
    );

DROP POLICY IF EXISTS tenant_isolation_promotions ON promotions;
CREATE POLICY tenant_isolation_promotions ON promotions
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- 3. Composite Performance Indexes for High-Velocity RFM Analytical Queries
CREATE INDEX IF NOT EXISTS idx_orders_rfm_lookup
    ON orders (tenant_id, customer_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_rfm_segment
    ON customers (tenant_id, rfm_segment);

CREATE INDEX IF NOT EXISTS idx_promotions_segment_lookup
    ON promotions (tenant_id, target_segment, is_active);
