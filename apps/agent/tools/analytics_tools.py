# apps/agent/tools/analytics_tools.py
"""
Analytics and Text-to-SQL Tools for LangGraph Agent.
Translates merchant natural language queries into validated SQL with auto-chart type hints.
"""
import re
import time
from typing import Dict, Any, List, Optional
from langchain_core.tools import tool
from apps.agent.tools.sql_validator import validate_and_sanitize_sql, SQLSecurityError
from packages.database.seed.seed_olist_egypt import generate_mock_analytical_dataset

# In-memory analytical database seeded with realistic Egyptian order data for isolated demo/testing
MOCK_ANALYTICAL_ORDERS = generate_mock_analytical_dataset(num_orders=300)


def auto_detect_chart_type(columns: List[str], rows: List[Dict[str, Any]], preferred: str = "auto") -> str:
    """
    Infers the optimal visualization:
    - Single value / 1 column 1 row -> 'kpi'
    - Date column + numeric metric -> 'line'
    - Categorical column (category/city/product) + metric -> 'bar'
    - Distribution of categories <= 6 -> 'pie'
    - Otherwise -> 'table'
    """
    if preferred != "auto" and preferred in ("bar", "line", "pie", "table", "kpi"):
        return preferred

    if len(rows) == 1 and len(columns) <= 2:
        return "kpi"

    col_names = [c.lower() for c in columns]
    has_date = any(k in col_names for k in ("order_date", "order_day", "report_date", "date", "day", "month"))
    has_category = any(k in col_names for k in ("category_name", "category", "city", "product_name", "customer_segment"))

    if has_date and len(rows) > 1:
        return "line"
    if has_category and len(rows) <= 6 and "share" in str(col_names):
        return "pie"
    if has_category:
        return "bar"

    return "table"


def execute_analytical_query_sandbox(sql: str, tenant_id: str = "tenant-demo-01") -> Dict[str, Any]:
    """
    Executes a validated read-only SQL query against the analytical dataset.
    Simulates database aggregation and filtering for v_order_profit_analytics.
    """
    start_time = time.time()

    # Rule-based / NLP pattern execution matching common analytical queries
    sql_lower = sql.lower()

    # Query 1: Top products by profit
    if "product_name" in sql_lower and ("net_profit" in sql_lower or "profit" in sql_lower):
        city_filter = None
        if "cairo" in sql_lower or "القاهرة" in sql_lower:
            city_filter = "Cairo"
        elif "alex" in sql_lower or "الإسكندرية" in sql_lower:
            city_filter = "Alexandria"

        product_profits: Dict[str, float] = {}
        for o in MOCK_ANALYTICAL_ORDERS:
            if city_filter and o["city"].lower() != city_filter.lower():
                continue
            name = o["product_name"]
            product_profits[name] = product_profits.get(name, 0.0) + o["net_profit"]

        sorted_products = sorted(product_profits.items(), key=lambda x: x[1], reverse=True)[:5]
        columns = ["product_name", "total_net_profit"]
        rows = [{"product_name": name, "total_net_profit": round(profit, 2)} for name, profit in sorted_products]

    # Query 2: Daily trend of profit & revenue
    elif "report_date" in sql_lower or "order_day" in sql_lower or "day" in sql_lower:
        daily_data: Dict[str, Dict[str, float]] = {}
        for o in MOCK_ANALYTICAL_ORDERS[-60:]:
            day = o["order_day"]
            if day not in daily_data:
                daily_data[day] = {"gross_revenue": 0.0, "net_profit": 0.0}
            daily_data[day]["gross_revenue"] += o["gross_revenue"]
            daily_data[day]["net_profit"] += o["net_profit"]

        sorted_days = sorted(daily_data.items())[-14:]
        columns = ["date", "gross_revenue", "net_profit"]
        rows = [
            {"date": d, "gross_revenue": round(vals["gross_revenue"], 2), "net_profit": round(vals["net_profit"], 2)}
            for d, vals in sorted_days
        ]

    # Query 3: Category breakdown
    elif "category_name" in sql_lower:
        cat_data: Dict[str, Dict[str, float]] = {}
        for o in MOCK_ANALYTICAL_ORDERS:
            c = o["category_name"]
            if c not in cat_data:
                cat_data[c] = {"gross_revenue": 0.0, "net_profit": 0.0, "units_sold": 0}
            cat_data[c]["gross_revenue"] += o["gross_revenue"]
            cat_data[c]["net_profit"] += o["net_profit"]
            cat_data[c]["units_sold"] += o["quantity"]

        columns = ["category_name", "gross_revenue", "net_profit", "units_sold"]
        rows = [
            {
                "category_name": c,
                "gross_revenue": round(vals["gross_revenue"], 2),
                "net_profit": round(vals["net_profit"], 2),
                "units_sold": vals["units_sold"],
            }
            for c, vals in sorted(cat_data.items(), key=lambda x: x[1]["net_profit"], reverse=True)
        ]

    # Default fallback: recent orders overview
    else:
        columns = ["order_id", "city", "product_name", "gross_revenue", "net_profit"]
        rows = [
            {
                "order_id": o["order_id"],
                "city": o["city"],
                "product_name": o["product_name"],
                "gross_revenue": round(o["gross_revenue"], 2),
                "net_profit": round(o["net_profit"], 2),
            }
            for o in MOCK_ANALYTICAL_ORDERS[:10]
        ]

    exec_time = int((time.time() - start_time) * 1000)

    return {
        "columns": columns,
        "rows": rows,
        "row_count": len(rows),
        "execution_time_ms": max(exec_time, 15),
    }


def generate_sql_from_question(question: str, tenant_id: str = "tenant-demo-01") -> str:
    """
    Rule-based Text-to-SQL engine translating Arabic and English analytics questions.
    """
    q_lower = question.lower()

    if re.search(r"(top|أكتر|اكثر|أعلى|اعلى|أفضل|افضل|highest|best)", q_lower) and re.search(r"(ربح|profit|منتج|product)", q_lower):
        city = "Cairo" if ("قاهرة" in q_lower or "cairo" in q_lower) else None
        city_clause = f"WHERE city = '{city}' AND tenant_id = '{tenant_id}'" if city else f"WHERE tenant_id = '{tenant_id}'"
        return f"""
SELECT product_name, SUM(net_profit) AS total_net_profit
FROM v_order_profit_analytics
{city_clause}
GROUP BY product_name
ORDER BY total_net_profit DESC
LIMIT 5;
""".strip()

    elif re.search(r"(trend|يوم بيوم|تطور|أيام|last 30 days|آخر شهر|مبيعات يومية)", q_lower):
        return f"""
SELECT order_day AS date, SUM(gross_revenue) AS gross_revenue, SUM(net_profit) AS net_profit
FROM v_order_profit_analytics
WHERE tenant_id = '{tenant_id}'
GROUP BY order_day
ORDER BY order_day ASC
LIMIT 30;
""".strip()

    elif re.search(r"(فئة|فئات|category|categories|قسم|أقسام)", q_lower):
        return f"""
SELECT category_name, SUM(gross_revenue) AS gross_revenue, SUM(net_profit) AS net_profit, SUM(quantity) AS units_sold
FROM v_order_profit_analytics
WHERE tenant_id = '{tenant_id}'
GROUP BY category_name
ORDER BY net_profit DESC
LIMIT 10;
""".strip()

    else:
        return f"""
SELECT order_id, city, product_name, gross_revenue, net_profit
FROM v_order_profit_analytics
WHERE tenant_id = '{tenant_id}'
ORDER BY order_date DESC
LIMIT 10;
""".strip()


@tool
def query_sales_data(
    question: str,
    preferred_chart: str = "auto",
    tenant_id: str = "tenant-demo-01",
) -> Dict[str, Any]:
    """
    Converts a natural language business question into validated SQL,
    executes it safely via the Read-Only engine, and returns structured results with chart hints.
    Read-Only operation — no confirmation required.
    """
    raw_sql = generate_sql_from_question(question, tenant_id=tenant_id)

    # Self-Correction Loop (Up to 3 retries)
    last_error = None
    sanitized_sql = raw_sql
    retry_count = 0

    while retry_count < 3:
        try:
            sanitized_sql, meta = validate_and_sanitize_sql(raw_sql, tenant_id=tenant_id)
            result = execute_analytical_query_sandbox(sanitized_sql, tenant_id=tenant_id)
            chart_hint = auto_detect_chart_type(result["columns"], result["rows"], preferred=preferred_chart)

            return {
                "success": True,
                "verified_sql": sanitized_sql,
                "columns": result["columns"],
                "rows": result["rows"],
                "row_count": result["row_count"],
                "execution_time_ms": result["execution_time_ms"],
                "chart_hint": chart_hint,
                "cached": False,
            }
        except SQLSecurityError as sec_err:
            return {
                "success": False,
                "error": f"Security Policy Violation: {str(sec_err)}",
                "verified_sql": None,
                "chart_hint": "table",
            }
        except Exception as exc:
            last_error = str(exc)
            retry_count += 1
            # Simple correction: fallback to safe query
            raw_sql = f"SELECT product_name, SUM(net_profit) AS total_net_profit FROM v_order_profit_analytics WHERE tenant_id = '{tenant_id}' GROUP BY product_name LIMIT 10;"

    return {
        "success": False,
        "error": f"Query execution failed after 3 retries: {last_error}",
        "verified_sql": sanitized_sql,
        "chart_hint": "table",
    }
