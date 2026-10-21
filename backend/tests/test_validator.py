# backend/tests/test_validator.py
"""
16 Rigorous Test Cases for SQL Security AST Validation (Renad - TASK-RE-03).
Asserts 100% block rate on DML/DDL injections while preserving safe analytical queries.
"""
import unittest
from apps.agent.tools.sql_validator import validate_and_sanitize_sql, SQLSecurityError


class TestSqlValidatorSecurity(unittest.TestCase):
    def test_01_valid_simple_select(self):
        sql = "SELECT product_name, price FROM products LIMIT 10;"
        sanitized, meta = validate_and_sanitize_sql(sql, tenant_id="tenant-demo-01")
        self.assertIn("SELECT", sanitized.upper())
        self.assertIn("tenant-demo-01", sanitized)

    def test_02_valid_select_top_equivalent(self):
        sql = "SELECT name, list_price FROM production_products LIMIT 5;"
        sanitized, _ = validate_and_sanitize_sql(sql, tenant_id="tenant-demo-01")
        self.assertIn("LIMIT 5", sanitized.upper())

    def test_03_valid_with_cte_select(self):
        sql = "WITH top_sales AS (SELECT customer_id, SUM(total) as revenue FROM orders GROUP BY customer_id) SELECT * FROM top_sales LIMIT 5;"
        sanitized, _ = validate_and_sanitize_sql(sql, tenant_id="tenant-demo-01")
        self.assertIn("top_sales", sanitized)

    def test_04_blocked_drop_table(self):
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql("DROP TABLE customers;", tenant_id="tenant-demo-01")

    def test_05_blocked_truncate_table(self):
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql("TRUNCATE TABLE orders;", tenant_id="tenant-demo-01")

    def test_06_blocked_alter_table(self):
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql("ALTER TABLE users ADD COLUMN is_admin boolean;", tenant_id="tenant-demo-01")

    def test_07_blocked_delete_from(self):
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql("DELETE FROM inventory WHERE quantity = 0;", tenant_id="tenant-demo-01")

    def test_08_blocked_update_statement(self):
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql("UPDATE products SET price = 0.0;", tenant_id="tenant-demo-01")

    def test_09_blocked_insert_into(self):
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql("INSERT INTO promotions (code) VALUES ('HACKED');", tenant_id="tenant-demo-01")

    def test_10_blocked_xp_cmdshell(self):
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql("EXEC xp_cmdshell('dir C:');", tenant_id="tenant-demo-01")

    def test_11_blocked_sql_injection_stack(self):
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql("SELECT 1; DROP TABLE Users; --", tenant_id="tenant-demo-01")

    def test_12_blocked_leading_whitespace_dml(self):
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql("   \n\t  DELETE FROM orders;", tenant_id="tenant-demo-01")

    def test_13_blocked_empty_query(self):
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql("   ", tenant_id="tenant-demo-01")

    def test_14_blocked_cross_tenant_subquery_tampering(self):
        sql = "SELECT * FROM orders WHERE tenant_id = 'tenant-competitor';"
        sanitized, meta = validate_and_sanitize_sql(sql, tenant_id="tenant-demo-01")
        self.assertEqual(meta["tenant_id_isolated"], "tenant-demo-01")

    def test_15_valid_aggregation_functions(self):
        sql = "SELECT category_name, AVG(unit_price), COUNT(*) FROM products GROUP BY category_name;"
        sanitized, _ = validate_and_sanitize_sql(sql, tenant_id="tenant-demo-01")
        self.assertIn("AVG", sanitized.upper())
        self.assertIn("COUNT", sanitized.upper())

    def test_16_valid_join_query(self):
        sql = "SELECT o.id, c.name, o.total FROM orders o JOIN customers c ON o.customer_id = c.id LIMIT 20;"
        sanitized, _ = validate_and_sanitize_sql(sql, tenant_id="tenant-demo-01")
        self.assertIn("JOIN", sanitized.upper())


if __name__ == "__main__":
    unittest.main()
