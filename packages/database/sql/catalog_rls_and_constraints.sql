-- packages/database/sql/catalog_rls_and_constraints.sql
-- Adel's Vertical Slice: Catalog, Categories & Inventory Integrity Constraints, B-Tree Indexes & RLS Policies

-- 1. INTEGRITY CHECK CONSTRAINTS
-- Ensure price, cost, and stock quantity cannot be negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_product_price_non_negative'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT check_product_price_non_negative CHECK (price >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_product_cost_non_negative'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT check_product_cost_non_negative CHECK (cost >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_inventory_quantity_non_negative'
  ) THEN
    ALTER TABLE inventory ADD CONSTRAINT check_inventory_quantity_non_negative CHECK (quantity >= 0);
  END IF;
END $$;

-- 2. COMPOSITE B-TREE INDEXES FOR SUB-10MS FILTERING
CREATE INDEX IF NOT EXISTS idx_products_tenant_cat_active 
  ON products(tenant_id, category_id, is_active);

CREATE INDEX IF NOT EXISTS idx_products_tenant_sku 
  ON products(tenant_id, sku);

CREATE INDEX IF NOT EXISTS idx_categories_tenant_parent 
  ON categories(tenant_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_inventory_tenant_product 
  ON inventory(tenant_id, product_id);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES

-- A. CATEGORIES TABLE
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS category_tenant_isolation ON categories;
CREATE POLICY category_tenant_isolation ON categories
  FOR ALL
  USING (
    (current_setting('app.current_tenant_id', true) IS NOT NULL 
     AND tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    OR
    (current_setting('app.tenant_id', true) IS NOT NULL 
     AND tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  );

-- B. PRODUCTS TABLE
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_tenant_isolation ON products;
CREATE POLICY product_tenant_isolation ON products
  FOR ALL
  USING (
    (current_setting('app.current_tenant_id', true) IS NOT NULL 
     AND tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    OR
    (current_setting('app.tenant_id', true) IS NOT NULL 
     AND tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  );

-- C. INVENTORY TABLE
ALTER TABLE IF EXISTS inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inventory_tenant_isolation ON inventory;
CREATE POLICY inventory_tenant_isolation ON inventory
  FOR ALL
  USING (
    (current_setting('app.current_tenant_id', true) IS NOT NULL 
     AND tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    OR
    (current_setting('app.tenant_id', true) IS NOT NULL 
     AND tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    OR
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = inventory.product_id
        AND (
          products.tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
          OR products.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        )
    )
  );
