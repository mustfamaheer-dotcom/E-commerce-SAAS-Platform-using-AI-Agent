-- packages/database/sql/create_readonly_role.sql
-- Abdallah's Vertical Slice: Dedicated Read-Only PostgreSQL Role for Sandboxed Text-to-SQL Execution

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'techzone_readonly_analyst'
  ) THEN
    CREATE ROLE techzone_readonly_analyst NOLOGIN;
  END IF;
END $$;

-- 1. Connection & Schema Usages
GRANT CONNECT ON DATABASE postgres TO techzone_readonly_analyst;
GRANT USAGE ON SCHEMA public TO techzone_readonly_analyst;

-- 2. Read-Only Permissions (Strict SELECT only, ZERO write privileges)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO techzone_readonly_analyst;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO techzone_readonly_analyst;

-- 3. Default privileges for future analytical views/tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO techzone_readonly_analyst;

-- 4. Session timeout safeguards (Hard 3000ms engine-level timeout)
ALTER ROLE techzone_readonly_analyst SET statement_timeout = '3000ms';
ALTER ROLE techzone_readonly_analyst SET default_transaction_read_only = on;
