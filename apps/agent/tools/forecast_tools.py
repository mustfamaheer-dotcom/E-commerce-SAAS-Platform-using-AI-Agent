# apps/agent/tools/forecast_tools.py
"""
LangGraph tools for Retaj's sales forecasting slice.

Bridges the ML forecasting microservice with the agent conversation:
- fuzzy bilingual product resolution
- live FastAPI call with deterministic offline fallback
- merchant-language synthesis of units, confidence range, SHAP drivers and restock action
"""
import json
import math
import os
import statistics
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from langchain_core.tools import tool

from apps.ml.src.forecast.mock_store import daily_series
from apps.ml.src.forecast.product_resolver import resolve_product
from packages.database.seed.seed_calendar_events import get_holiday_for

ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8100")
PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "forecast_synthesis_prompt.txt"

FEATURE_LABELS = {
    "sales_lag_7": {"ar": "زخم المبيعات الأسبوعي", "en": "Weekly Momentum"},
    "sales_lag_14": {"ar": "زخم المبيعات نصف الشهري", "en": "Biweekly Momentum"},
    "discount_pct": {"ar": "الخصومات الفعالة", "en": "Active Discounts"},
    "price_change_pct": {"ar": "تغيّر السعر", "en": "Price Changes"},
    "day_of_week": {"ar": "تأثير الويكند", "en": "Weekend Effect"},
    "is_holiday": {"ar": "الموسم / العيد", "en": "Holiday Season"},
    "sales_rolling_std_28": {"ar": "تقلّب الطلب", "en": "Demand Volatility"},
    "stock_level": {"ar": "توفر المخزون", "en": "Stock Availability"},
    "month": {"ar": "الموسمية", "en": "Seasonality"},
    "sales_rolling_mean_7": {"ar": "متوسط المبيعات الأسبوعي", "en": "Weekly Average"},
    "sales_rolling_mean_28": {"ar": "متوسط المبيعات الشهري", "en": "Monthly Average"},
}


def _driver_label(feature: str, language: str) -> str:
    labels = FEATURE_LABELS.get(feature)
    if labels:
        return labels["ar" if language == "ar" else "en"]
    return feature.replace("_", " ").title()


def _mock_payload(product: Dict, horizon_days: int) -> Dict:
    rows = daily_series(product["product_id"], days=180)
    history_rows = rows[-28:]
    units = [float(row["units_sold"]) for row in rows]

    recent = units[-14:] if len(units) >= 14 else units
    previous = units[-28:-14] if len(units) >= 28 else units[: max(1, len(units) // 2)]
    recent_mean = statistics.mean(recent) if recent else 1.0
    previous_mean = statistics.mean(previous) if previous else recent_mean
    trend = min(1.40, max(0.70, recent_mean / max(previous_mean, 0.1)))

    weekday_history: Dict[int, List[float]] = {dow: [] for dow in range(1, 8)}
    for row in history_rows:
        weekday_history[int(row["day_of_week"])].append(float(row["units_sold"]))
    overall_mean = recent_mean

    residuals = []
    for row in history_rows:
        dow = int(row["day_of_week"])
        baseline = statistics.mean(weekday_history[dow]) if weekday_history[dow] else overall_mean
        residuals.append(float(row["units_sold"]) - baseline)
    sigma = statistics.stdev(residuals) if len(residuals) > 2 else max(0.5, overall_mean * 0.2)

    origin = date.fromisoformat(str(rows[-1]["report_date"]))
    forecast = []
    for step in range(1, horizon_days + 1):
        future = origin + timedelta(days=step)
        dow = future.isoweekday()
        base = statistics.mean(weekday_history[dow]) if weekday_history[dow] else overall_mean
        trend_effect = trend ** min(step / 14.0, 1.0)
        holiday = get_holiday_for(future)
        holiday_effect = 1.0 + 0.22 * float(holiday["weight"]) if holiday else 1.0
        yhat = max(0.0, round(base * trend_effect * holiday_effect, 1))
        band = max(0.5, sigma) * 1.645 * math.sqrt(1.0 + step / 30.0)
        forecast.append(
            {
                "report_date": future.isoformat(),
                "yhat": yhat,
                "yhat_lower": max(0.0, round(yhat - band, 1)),
                "yhat_upper": round(yhat + band, 1),
            }
        )

    total_yhat = round(sum(point["yhat"] for point in forecast), 1)
    # The card shows the uncertainty of the horizon *total*; daily errors are
    # roughly independent, so the aggregate band grows with sqrt(horizon).
    sigma_total = statistics.stdev(residuals) if len(residuals) > 2 else max(0.5, overall_mean * 0.2)
    half_width = 1.96 * sigma_total * math.sqrt(max(horizon_days, 1))
    total_lower = max(0.0, round(total_yhat - half_width, 1))
    total_upper = round(total_yhat + half_width, 1)

    last = rows[-1]
    stock = int(product["stock"])
    gap = max(0, int(math.ceil(total_yhat - stock)))
    std_28 = statistics.stdev(units[-28:]) if len(units[-28:]) > 2 else 0.0
    safety = int(math.ceil(std_28 * math.sqrt(7)))
    reorder_level = int(product.get("reorder_level", 0) or 0)
    suggested = int(math.ceil(gap + safety)) if gap > 0 else 0
    if gap > 0 and reorder_level > suggested:
        suggested = reorder_level

    stockout_eta = None
    cumulative = 0.0
    for point in forecast:
        cumulative += point["yhat"]
        if cumulative > stock:
            stockout_eta = point["report_date"]
            break

    first_future = date.fromisoformat(forecast[0]["report_date"])
    discount = float(last["discount_pct"])
    momentum = statistics.mean(units[-7:]) - statistics.mean(units[-28:])
    mean_28 = max(statistics.mean(units[-28:]), 0.5)
    volatility = std_28

    drivers = [
        {"feature": "day_of_week", "impact_pct": round(18.0 if first_future.isoweekday() in (5, 6) else 3.0, 1)},
        {"feature": "discount_pct", "impact_pct": round(min(24.0, discount * 160.0), 1)},
        {"feature": "is_holiday", "impact_pct": round(min(25.0, float(last["holiday_weight"]) * 20.0), 1)},
        {"feature": "sales_rolling_mean_7", "impact_pct": round(max(-15.0, min(15.0, (momentum / mean_28) * 10.0)), 1)},
        {"feature": "sales_rolling_std_28", "impact_pct": round(max(-12.0, min(0.0, -(volatility / mean_28) * 6.0)), 1)},
        {"feature": "stock_level", "impact_pct": round(max(-15.0, min(0.0, -(1.0 - stock / max(total_yhat, 1.0)) * 15.0)), 1)},
    ]
    drivers = [driver for driver in drivers if abs(driver["impact_pct"]) > 0.2]
    drivers.sort(key=lambda driver: abs(driver["impact_pct"]), reverse=True)
    while len(drivers) < 3:
        drivers.append({"feature": "sales_lag_7", "impact_pct": 1.0})

    return {
        "card_type": "sales_forecast",
        "product": {
            "id": product["product_id"],
            "name": product["name"],
            "sku": product["sku"],
            "current_stock": stock,
        },
        "horizon_days": horizon_days,
        "history": [
            {
                "report_date": str(row["report_date"]),
                "units_sold": int(row["units_sold"]),
            }
            for row in rows[-30:]
        ],
        "point_forecast": forecast,
        "totals": {"yhat": total_yhat, "yhat_lower": total_lower, "yhat_upper": total_upper},
        "top_shap_drivers": drivers[:5],
        "restock": {
            "current_stock": stock,
            "predicted_demand": int(round(total_yhat)),
            "gap": gap,
            "safety_stock": safety,
            "reorder_level": reorder_level,
            "stockout_eta": stockout_eta,
            "recommendation": "order_now" if gap > 0 else "sufficient",
            "suggested_order_qty": suggested,
        },
        "model_version": "heuristic-seasonal-v1",
        "source": "mock",
        "latency_ms": 4,
    }


def _call_live_service(product_id: str, horizon_days: int, tenant_id: str) -> Optional[Dict]:
    if os.getenv("FORECAST_LIVE", "1") == "0":
        return None
    try:
        response = httpx.post(
            f"{ML_SERVICE_URL}/ml/v1/forecast/predict",
            json={
                "tenant_id": tenant_id,
                "product_id": product_id,
                "horizon_days": horizon_days,
            },
            timeout=2.0,
        )
        if response.status_code == 200:
            payload = response.json()
            payload["source"] = "live"
            return payload
    except Exception:
        return None
    return None


@tool
def run_sales_forecast(
    product_id_or_name: str,
    horizon_days: int = 30,
    tenant_id: str = "tenant-demo-01",
) -> Dict[str, Any]:
    """
    Forecast product demand for the coming horizon (7, 14 or 30 days).

    Resolves fuzzy Arabic/English product names to a product id, calls the ML
    forecasting service for point + quantile predictions and SHAP drivers, and
    returns a `sales_forecast` GenUI payload with a restock recommendation.

    Read/ML operation — no confirmation or database write required.
    """
    resolved = resolve_product(product_id_or_name, tenant_id=tenant_id)

    if resolved["status"] == "ambiguous":
        return {
            "success": False,
            "error": "ambiguous_product",
            "message": "Multiple products match this reference. Ask the merchant to pick one candidate.",
            "candidates": resolved["candidates"],
        }
    if resolved["status"] == "not_found":
        return {
            "success": False,
            "error": "product_not_found",
            "message": f"No product matches '{product_id_or_name}'.",
            "candidates": [],
        }

    product = resolved["product"]
    horizon = 7 if horizon_days <= 7 else 14 if horizon_days <= 14 else 30

    payload = _call_live_service(product["product_id"], horizon, tenant_id)
    source = "live"
    if payload is None:
        payload = _mock_payload(product, horizon)
        source = "mock"

    return {
        "success": True,
        "source": source,
        "card_type": "sales_forecast",
        "product_id": product["product_id"],
        "payload": payload,
    }


def build_synthesis_prompt(payload: Dict, language: str = "ar") -> str:
    """Render the Forecast Synthesis Prompt for the LLM."""
    template = PROMPT_PATH.read_text(encoding="utf-8")
    instruction = "Respond in Arabic." if language == "ar" else "Respond in English."
    rendered = template.replace("{forecast_json}", json.dumps(payload, ensure_ascii=False, indent=2))
    return f"{instruction}\n\n{rendered}"


def render_forecast_advice(payload: Dict, language: str = "ar") -> str:
    """
    Deterministic natural-language synthesis used as the offline/LLM-free output.

    Always covers the 3 mandatory elements: total + range, top 3 drivers, action.
    """
    totals = payload.get("totals", {})
    drivers = payload.get("top_shap_drivers", [])[:3]
    restock = payload.get("restock", {})
    product = payload.get("product", {})
    horizon = payload.get("horizon_days", 30)

    driver_text = "، ".join(
        f"{'+' if driver['impact_pct'] >= 0 else ''}{driver['impact_pct']}% {_driver_label(driver['feature'], language)}"
        for driver in drivers
    ) or ("لا توجد عوامل بارزة" if language == "ar" else "No dominant drivers")

    if restock.get("recommendation") == "order_now":
        action_ar = (
            f"مخزونك الحالي {restock.get('current_stock', 0)} وحدة فقط، وأنصح بطلب "
            f"{restock.get('suggested_order_qty', 0)} وحدة هذا الأسبوع لتغطية الطلب المتوقع."
        )
        action_en = (
            f"You currently have only {restock.get('current_stock', 0)} units in stock, so I recommend "
            f"ordering {restock.get('suggested_order_qty', 0)} units this week."
        )
    else:
        action_ar = "مخزونك الحالي يكفي حتى نهاية الأفق المتوقع، لا حاجة لطلب عاجل الآن."
        action_en = "Your current stock covers the full horizon, so no urgent order is needed."

    if language == "ar":
        return (
            f"متوقع تبيع حوالي {totals.get('yhat', 0)} وحدة "
            f"[{totals.get('yhat_lower', 0)}–{totals.get('yhat_upper', 0)}] "
            f"من {product.get('name', 'المنتج')} خلال {horizon} يوم.\n"
            f"أبرز العوامل المؤثرة: {driver_text}.\n"
            f"{action_ar}"
        )

    return (
        f"You are projected to sell about {totals.get('yhat', 0)} units "
        f"[{totals.get('yhat_lower', 0)}–{totals.get('yhat_upper', 0)}] "
        f"of {product.get('name', 'this product')} over the next {horizon} days.\n"
        f"Top drivers: {driver_text}.\n"
        f"{action_en}"
    )


FORECAST_TOOLS = [run_sales_forecast]
