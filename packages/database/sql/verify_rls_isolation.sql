-- packages/database/sql/verify_rls_isolation.sql
-- Run as application user to verify multi-tenant isolation

BEGIN;

-- Insert two test tenants
INSERT INTO tenants (id, slug, name, currency) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'store-alpha', 'Alpha Store', 'EGP'),
  ('22222222-2222-2222-2222-222222222222', 'store-beta', 'Beta Store', 'USD')
ON CONFLICT (slug) DO NOTHING;

-- Insert users for both tenants
INSERT INTO users (id, tenant_id, email, role)
VALUES 
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'admin@alpha.com', 'merchant'),
  ('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'admin@beta.com', 'merchant')
ON CONFLICT DO NOTHING;

-- Test 1: Query as Tenant Alpha
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count FROM users;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'RLS failed for tenant Alpha! Expected 1 user, got %', v_count;
  END IF;

  -- Ensure we can't see tenant beta's user even if specifically filtered
  SELECT count(*) INTO v_count FROM users WHERE email = 'admin@beta.com';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Cross-tenant leak detected for Beta user under Alpha session!';
  END IF;
  RAISE NOTICE 'Test 1 Passed: Tenant Alpha isolation verified.';
END $$;

-- Test 2: Query as Tenant Beta
SET LOCAL app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count FROM users;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'RLS failed for tenant Beta! Expected 1 user, got %', v_count;
  END IF;

  SELECT count(*) INTO v_count FROM users WHERE email = 'admin@alpha.com';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Cross-tenant leak detected for Alpha user under Beta session!';
  END IF;
  RAISE NOTICE 'Test 2 Passed: Tenant Beta isolation verified.';
END $$;

-- Test 3: No tenant context set -> should see 0 rows
SET LOCAL app.current_tenant_id = '';
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count FROM users;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'RLS failed for unauthenticated session! Expected 0 users, got %', v_count;
  END IF;
  RAISE NOTICE 'Test 3 Passed: Empty tenant context isolation verified.';
END $$;

ROLLBACK;
