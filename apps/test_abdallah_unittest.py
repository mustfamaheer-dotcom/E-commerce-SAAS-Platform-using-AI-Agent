# apps/test_abdallah_unittest.py
"""
Unit and Integration Test Suite for Abdallah's Vertical Slice 03:
Conversational BI Analytics & Secure Text-to-SQL Engine.
"""
import os
import sys
import unittest

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from apps.agent.tools.sql_validator import (
    validate_and_sanitize_sql,
    SQLSecurityError,
    MAX_ROW_LIMIT,
)
from apps.agent.tools.analytics_tools import (
    auto_detect_chart_type,
    generate_sql_from_question,
    query_sales_data,
)
from apps.agent.graphs.text_to_sql_graph import (
    TextToSqlState,
    build_text_to_sql_graph,
)
from apps.ml.src.analytics.anomaly_service import detect_series_anomalies
from apps.ml.src.analytics.attribution_service import attribute_anomaly_root_causes
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver


class TestAbdallahSlice(unittest.TestCase):

    # --- 1. sqlglot AST Validator & Security Tests ---
    def test_sqlglot_blocks_drop_table(self):
        sql = "DROP TABLE users;"
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql(sql)

    def test_sqlglot_blocks_delete_and_update(self):
        sql_del = "DELETE FROM orders WHERE id = '123';"
        sql_upd = "UPDATE products SET price = 100 WHERE id = '123';"
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql(sql_del)
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql(sql_upd)

    def test_sqlglot_blocks_system_catalog_access(self):
        sql = "SELECT * FROM pg_catalog.pg_tables;"
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql(sql)

    def test_sqlglot_blocks_multi_statements(self):
        sql = "SELECT * FROM orders; DROP TABLE products"
        with self.assertRaises(SQLSecurityError):
            validate_and_sanitize_sql(sql)

    def test_sqlglot_enforces_limit_cap(self):
        # If user requests LIMIT 5000, must be capped to 500
        sql = "SELECT * FROM v_order_profit_analytics WHERE tenant_id = 'tid-1' LIMIT 5000"
        sanitized, meta = validate_and_sanitize_sql(sql, tenant_id="tid-1")
        self.assertIn("LIMIT 500", sanitized)

    def test_sqlglot_injects_tenant_id_isolation(self):
        sql = "SELECT product_name, SUM(net_profit) FROM v_order_profit_analytics GROUP BY product_name"
        sanitized, meta = validate_and_sanitize_sql(sql, tenant_id="tenant-alpha-99")
        self.assertIn("tenant-alpha-99", sanitized)

    # --- 2. Chart Hint Auto-Detection Tests ---
    def test_chart_hint_auto_detection(self):
        # Date column -> Line chart
        date_cols = ["order_day", "net_profit"]
        date_rows = [{"order_day": "2026-10-01", "net_profit": 5000}, {"order_day": "2026-10-02", "net_profit": 7000}]
        self.assertEqual(auto_detect_chart_type(date_cols, date_rows), "line")

        # Categorical column -> Bar chart
        cat_cols = ["category_name", "gross_revenue"]
        cat_rows = [{"category_name": "Speakers", "gross_revenue": 50000}, {"category_name": "Cables", "gross_revenue": 12000}]
        self.assertEqual(auto_detect_chart_type(cat_cols, cat_rows), "bar")

        # Single KPI row
        kpi_cols = ["total_revenue"]
        kpi_rows = [{"total_revenue": 145000.0}]
        self.assertEqual(auto_detect_chart_type(kpi_cols, kpi_rows), "kpi")

    # --- 3. Text-to-SQL Tool & Execution Tests ---
    def test_query_sales_data_tool_arabic(self):
        res = query_sales_data.invoke({
            "question": "ايه أكتر 5 منتجات حققت ربح في القاهرة؟",
            "tenant_id": "tenant-demo-01",
        })
        self.assertTrue(res["success"])
        self.assertIn("v_order_profit_analytics", res["verified_sql"])
        self.assertTrue(len(res["rows"]) > 0)
        self.assertEqual(res["chart_hint"], "bar")

    # --- 4. ML Layer: Anomaly Detection & Attribution Tests ---
    def test_ml_anomaly_detection_z_score(self):
        dates = [f"2026-10-{i:02d}" for i in range(1, 15)]
        # Normal series ~20,000, with an extreme drop to 2,000 on day 10
        values = [20000.0, 19500.0, 20500.0, 21000.0, 19800.0, 20200.0, 20000.0, 19700.0, 20400.0, 2000.0, 19900.0, 20100.0, 19800.0, 20300.0]

        anomalies = detect_series_anomalies(dates, values, metric_name="net_profit", z_threshold=2.5)
        self.assertTrue(len(anomalies) >= 1)
        drop_anomaly = anomalies[0]
        self.assertEqual(drop_anomaly["date"], "2026-10-10")
        self.assertEqual(drop_anomaly["direction"], "drop")
        self.assertTrue(drop_anomaly["z_score"] < -2.5)

    def test_ml_attribution_root_causes(self):
        causes = attribute_anomaly_root_causes(anomaly_date="2026-10-10", direction="drop")
        self.assertTrue(len(causes) >= 1)
        self.assertEqual(causes[0]["dimension"], "category")
        self.assertTrue("Speakers" in causes[0]["value"])
        self.assertTrue(causes[0]["contribution_pct"] > 50)

    # --- 5. LangGraph Text-to-SQL Workflow & Self-Correction ---
    def test_text_to_sql_langgraph_flow(self):
        cp = MemorySaver()
        graph = build_text_to_sql_graph(checkpointer=cp)
        config = {"configurable": {"thread_id": "thread-sql-test-01"}}

        prompt = "وريني تطور أرباح ومبيعات المتجر اليومية لآخر شهر"
        events = list(graph.stream({"messages": [HumanMessage(content=prompt)]}, config=config))

        state = graph.get_state(config)
        self.assertTrue(state.values.get("sql_valid"))
        self.assertIsNotNone(state.values.get("query_result"))
        self.assertEqual(state.values.get("chart_hint"), "line")
        last_msg = state.values["messages"][-1].content
        self.assertIn("تم تحليل البيانات", last_msg)


if __name__ == "__main__":
    unittest.main()
