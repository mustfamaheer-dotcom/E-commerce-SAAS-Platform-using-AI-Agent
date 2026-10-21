# apps/manual_test_bi_interactive.py
"""
Interactive CLI Console for Manual Testing of Abdallah's Vertical Slice 03:
Conversational BI Analytics, Secure Text-to-SQL Engine & Anomaly Detection.

Usage:
    .\\.venv\\Scripts\\python.exe apps/manual_test_bi_interactive.py
"""
import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from apps.agent.tools.sql_validator import validate_and_sanitize_sql, SQLSecurityError
from apps.agent.tools.analytics_tools import query_sales_data, auto_detect_chart_type
from apps.ml.src.analytics.anomaly_service import detect_series_anomalies
from apps.ml.src.analytics.attribution_service import attribute_anomaly_root_causes


def print_banner():
    print("=" * 80)
    print("📊 TECHZONE BI ANALYTICS & TEXT-TO-SQL CONSOLE (Abdallah's Vertical Slice 03)")
    print("=" * 80)
    print("Available Manual Testing Modes:")
    print("  [1] Ask a Business Intelligence question (Arabic or English)")
    print("      Examples:")
    print("      • 'ايه أكتر 5 منتجات حققت ربح في القاهرة؟'")
    print("      • 'Show me daily revenue and net profit trend for the last 30 days'")
    print("      • 'عرض أداء ومبيعات الفئات'")
    print("  [2] Test AST Security Guard (Try SQL injection, DROP, DELETE, pg_catalog)")
    print("      Examples: 'DROP TABLE users;', 'SELECT * FROM pg_catalog.pg_tables;'")
    print("  [3] Test ML Profit Anomaly Detection & Automated Root-Cause Explainer")
    print("  (Type 'exit' to quit)\n")


def test_bi_query(question: str):
    print(f"\n🔍 Processing Question: '{question}'")
    print("⏳ Translating via Text-to-SQL, parsing AST, and executing query...")

    result = query_sales_data.invoke({
        "question": question,
        "tenant_id": "store-cairo-01",
    })

    if not result.get("success"):
        print(f"\n❌ Execution Failed: {result.get('error')}")
        return

    print("\n" + "-" * 78)
    print(f"✅ VERIFIED SQL (AST Safe, statement_timeout=3000ms, Exec Time: {result['execution_time_ms']}ms):")
    print("-" * 78)
    print(result["verified_sql"])
    print("-" * 78)
    print(f"📊 Auto-Detected GenUI Chart Hint: [{result['chart_hint'].upper()}] | Rows: {result['row_count']}")
    print("-" * 78)

    cols = result["columns"]
    rows = result["rows"]

    # Print table header
    col_format = " | ".join([f"{c:<20}" for c in cols])
    print(col_format)
    print("-" * 78)
    for r in rows[:10]:
        line = " | ".join([f"{str(r.get(c, '')):<20}" for c in cols])
        print(line)
    print("-" * 78)


def test_security_guard(malicious_sql: str):
    print(f"\n🛡️ Testing AST Guard with SQL: '{malicious_sql}'")
    try:
        sanitized, meta = validate_and_sanitize_sql(malicious_sql, tenant_id="tenant-demo-01")
        print(f"⚠️ Query was permitted: {sanitized}")
    except SQLSecurityError as sec_err:
        print(f"🛑 BLOCKED BY AST GUARD: {sec_err}")
    except Exception as e:
        print(f"❌ Syntax Error: {e}")


def test_anomaly_detection_demo():
    print("\n📈 Running ML Financial Anomaly Detection & Attribution Demo:")
    print("------------------------------------------------------------------------------")
    dates = [f"2026-10-{i:02d}" for i in range(1, 15)]
    # Normal daily profit ~25,000 EGP with an extreme drop to 3,200 EGP on Oct 10
    values = [25000.0, 24000.0, 26000.0, 24500.0, 25500.0, 24800.0, 25200.0, 24900.0, 25800.0, 3200.0, 25000.0, 24500.0, 25100.0, 24800.0]

    anomalies = detect_series_anomalies(dates, values, metric_name="net_profit", z_threshold=2.5)

    if anomalies:
        for anom in anomalies:
            print(f"🚨 Anomaly Detected on {anom['date']}:")
            print(f"   • Metric: {anom['metric']} | Actual: {anom['value']:,.2f} EGP (Expected: {anom['expected_value']:,.2f} EGP)")
            print(f"   • Z-Score: {anom['z_score']} ({anom['severity'].upper()} {anom['direction'].upper()})")

            causes = attribute_anomaly_root_causes(anom["date"], anom["direction"])
            print("   • Automated Root-Cause Explanations:")
            for c in causes:
                print(f"     - [{c['dimension'].upper()}] {c['explanation']} (Impact: {c['contribution_pct']}%)")
    else:
        print("No statistical anomalies detected.")
    print("------------------------------------------------------------------------------")


def main():
    print_banner()

    while True:
        try:
            user_input = input("\n👤 Enter command or question (or press Enter for sample BI query): ").strip()

            if user_input.lower() in ("exit", "quit", "q"):
                print("Exiting BI console. Goodbye!")
                break

            if not user_input:
                user_input = "ايه أكتر 5 منتجات حققت ربح في القاهرة؟"
                print(f"Using default sample question: '{user_input}'")

            # Check if testing security or anomaly
            if any(k in user_input.lower() for k in ("drop ", "delete ", "update ", "insert ", "pg_catalog", "alter ")):
                test_security_guard(user_input)
            elif "anomaly" in user_input.lower() or "شذوذ" in user_input.lower():
                test_anomaly_detection_demo()
            else:
                test_bi_query(user_input)

        except KeyboardInterrupt:
            print("\nInterrupted. Exiting...")
            break
        except Exception as e:
            print(f"\n❌ Error during test: {e}")


if __name__ == "__main__":
    main()
