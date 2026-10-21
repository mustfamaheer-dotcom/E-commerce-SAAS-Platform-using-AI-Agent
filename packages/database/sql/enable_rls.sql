-- packages/database/sql/enable_rls.sql
-- Multi-Tenant PostgreSQL Row-Level Security (RLS) Policies

-- Helper function to ensure setup
CREATE OR REPLACE FUNCTION setup_tenant_rls(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  RAISE NOTICE 'RLS configured for tenant %', p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. TENANTS TABLE
ALTER TABLE IF EXISTS tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_self_access ON tenants;
CREATE POLICY tenant_self_access ON tenants
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NOT NULL 
    AND id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  );

-- 2. USERS TABLE
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_tenant_isolation ON users;
CREATE POLICY user_tenant_isolation ON users
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NOT NULL 
    AND tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  );

-- 3. PRODUCTS TABLE
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_tenant_isolation ON products;
CREATE POLICY product_tenant_isolation ON products
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NOT NULL 
    AND tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  );

-- 4. INVENTORY TABLE
ALTER TABLE IF EXISTS inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inventory_tenant_isolation ON inventory;
CREATE POLICY inventory_tenant_isolation ON inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = inventory.product_id
        AND products.tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
  );

-- 5. ORDERS TABLE
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS order_tenant_isolation ON orders;
CREATE POLICY order_tenant_isolation ON orders
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NOT NULL 
    AND tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  );

-- 6. ORDER_ITEMS TABLE
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS order_items_tenant_isolation ON order_items;
CREATE POLICY order_items_tenant_isolation ON order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
  );

-- 7. CUSTOMERS TABLE
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_tenant_isolation ON customers;
CREATE POLICY customer_tenant_isolation ON customers
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NOT NULL 
    AND tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  );

-- 8. PROMOTIONS TABLE
ALTER TABLE IF EXISTS promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS promotion_tenant_isolation ON promotions;
CREATE POLICY promotion_tenant_isolation ON promotions
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NOT NULL 
    AND tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  );

-- 9. POLICIES TABLE
ALTER TABLE IF EXISTS policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS policies FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS policies_tenant_isolation ON policies;
CREATE POLICY policies_tenant_isolation ON policies
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NOT NULL 
    AND tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  );

-- 10. PAYMENTS TABLE
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_tenant_isolation ON payments;
CREATE POLICY payments_tenant_isolation ON payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
        AND orders.tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
  );

-- 11. AGENT_ACTIONS TABLE
ALTER TABLE IF EXISTS agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agent_actions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_actions_tenant_isolation ON agent_actions;
CREATE POLICY agent_actions_tenant_isolation ON agent_actions
  FOR ALL
  USING (
    current_setting('app.current_tenant_id', true) IS NOT NULL 
    AND tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
  );
