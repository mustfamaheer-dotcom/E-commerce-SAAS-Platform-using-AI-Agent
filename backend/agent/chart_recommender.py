# backend/agent/chart_recommender.py
from typing import List, Dict, Any

def recommend_chart_type(rows: List[Dict[str, Any]]) -> str:
    """Auto-detects the optimal visualization type for SQL result sets."""
    if not rows:
        return "table"

    if len(rows) == 1 and len(rows[0]) <= 2:
        return "kpi_card"

    sample = rows[0]
    keys = list(sample.keys())

    date_keys = [k for k in keys if "date" in k.lower() or "time" in k.lower() or "day" in k.lower() or "month" in k.lower()]
    if date_keys and len(rows) > 3:
        return "line"

    cat_keys = [k for k in keys if "name" in k.lower() or "category" in k.lower() or "city" in k.lower() or "segment" in k.lower()]
    if cat_keys and len(rows) <= 15:
        return "bar"

    if len(rows) <= 6 and len(keys) == 2:
        return "pie"

    return "table"
