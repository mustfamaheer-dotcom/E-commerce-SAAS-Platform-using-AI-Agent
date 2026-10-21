# apps/ml/src/forecast/mock_store.py
"""
Deterministic offline time-series store for the forecasting slice.

Mirrors the shape of `v_daily_product_timeseries` so the FastAPI service, the
LangGraph tool and the tests can run without PostgreSQL while remaining
feature-identical with the production SQL pipeline.
"""
from datetime import date, timedelta
from typing import Dict, List, Optional
import math

from packages.database.seed.seed_calendar_events import get_holiday_for

DEMO_TENANT_ID = "tenant-demo-01"

PRODUCTS: List[Dict] = [
    {
        "product_id": "prod_101",
        "sku": "SPK-JBL-01",
        "name": "JBL Flip 6 Waterproof Speaker",
        "category": "Speakers",
        "price": 5000.0,
        "cost": 3800.0,
        "stock": 80,
        "base_daily_demand": 4.0,
        "reorder_level": 85,
    },
    {
        "product_id": "prod_102",
        "sku": "SPK-ANKER-02",
        "name": "Anker Soundcore Motion+ Bluetooth Speaker",
        "category": "Speakers",
        "price": 3200.0,
        "cost": 2100.0,
        "stock": 58,
        "base_daily_demand": 2.6,
        "reorder_level": 60,
    },
    {
        "product_id": "prod_103",
        "sku": "HP-SONY-XM5",
        "name": "Sony WH-1000XM5 Wireless Headphones",
        "category": "Headphones",
        "price": 14500.0,
        "cost": 10500.0,
        "stock": 24,
        "base_daily_demand": 1.2,
        "reorder_level": 25,
    },
    {
        "product_id": "prod_104",
        "sku": "EAR-APPLE-APP2",
        "name": "Apple AirPods Pro 2nd Gen",
        "category": "Earbuds",
        "price": 9800.0,
        "cost": 7400.0,
        "stock": 40,
        "base_daily_demand": 1.9,
        "reorder_level": 45,
    },
    {
        "product_id": "prod_115",
        "sku": "CHG-65W-GAN",
        "name": "Anker 65W GaN Fast Charger",
        "category": "Chargers",
        "price": 850.0,
        "cost": 420.0,
        "stock": 12,
        "base_daily_demand": 3.1,
        "reorder_level": 55,
    },
    {
        "product_id": "prod_116",
        "sku": "CHG-SAM-45W",
        "name": "Samsung 45W USB-C Super Fast Charger",
        "category": "Chargers",
        "price": 650.0,
        "cost": 340.0,
        "stock": 65,
        "base_daily_demand": 4.2,
        "reorder_level": 75,
    },
    {
        "product_id": "prod_120",
        "sku": "CAB-USBC-2M",
        "name": "Baseus 100W Fast Charging Cable 2M",
        "category": "Cables",
        "price": 280.0,
        "cost": 110.0,
        "stock": 4,
        "base_daily_demand": 6.0,
        "reorder_level": 95,
    },
    {
        "product_id": "prod_121",
        "sku": "CAS-SPIGEN-IP15",
        "name": "Spigen Tough Armor Case iPhone 15",
        "category": "Cases",
        "price": 600.0,
        "cost": 220.0,
        "stock": 33,
        "base_daily_demand": 2.4,
        "reorder_level": 45,
    },
    {
        "product_id": "prod_130",
        "sku": "PWB-JOYROOM-10K",
        "name": "Joyroom Magnetic Power Bank 10000mAh",
        "category": "Power Banks",
        "price": 1200.0,
        "cost": 650.0,
        "stock": 51,
        "base_daily_demand": 2.1,
        "reorder_level": 50,
    },
]

# Every seeded product belongs to the demo tenant; the ML service rejects any
# product_id that is requested under a different tenant (RLS-style guard).
for _product in PRODUCTS:
    _product.setdefault("tenant_id", DEMO_TENANT_ID)


def list_products() -> List[Dict]:
    return [dict(p) for p in PRODUCTS]

def get_product(product_id: Optional[str] = None, sku: Optional[str] = None) -> Optional[Dict]:
    for product in PRODUCTS:
        if product_id and product["product_id"].lower() == str(product_id).lower():
            return dict(product)
        if sku and product["sku"].lower() == str(sku).lower():
            return dict(product)
    return None


def current_stock(product_id: str) -> int:
    product = get_product(product_id)
    return int(product["stock"]) if product else 0


def _weekday_multiplier(day: date) -> float:
    iso = day.isoweekday()
    if iso == 5:
        return 1.32
    if iso == 6:
        return 1.22
    if iso == 7:
        return 1.08
    return 1.0


def _season_multiplier(day: date, product_index: int) -> float:
    ordinal = day.toordinal()
    yearly = 1.0 + 0.10 * math.sin(2 * math.pi * ordinal / 365.0)
    weekly = 1.0 + 0.06 * math.cos(2 * math.pi * (ordinal + product_index * 3) / 7.0)
    return yearly * weekly


def _holiday_multiplier(day: date) -> float:
    holiday = get_holiday_for(day)
    if not holiday:
        return 1.0
    return 1.0 + 0.22 * float(holiday["weight"])


def _promo_discount(day: date) -> float:
    holiday = get_holiday_for(day)
    if holiday and holiday["event_name"] == "white_friday":
        return 0.20
    if holiday and holiday["event_name"] == "ramadan_season":
        return 0.10
    return 0.0


def _units_for(product: Dict, index: int, day: date) -> int:
    ordinal = day.toordinal()
    noise = 1.0 + 0.16 * math.sin(ordinal * 1.7 + index * 2.3) + 0.08 * math.cos(ordinal * 0.7 + index)
    demand = (
        float(product["base_daily_demand"])
        * _weekday_multiplier(day)
        * _season_multiplier(day, index)
        * _holiday_multiplier(day)
        * noise
    )
    return max(0, int(round(demand)))


def daily_series(product_id: str, days: int = 180, end_date: Optional[date] = None) -> List[Dict]:
    """
    Gapless daily rows for one product, ordered oldest -> newest.

    `stock_level` is reconstructed backwards from the live inventory snapshot,
    exactly like the SQL view: stock(t) = current_qty + units sold after t.
    """
    product = get_product(product_id)
    if not product:
        return []

    index = next(i for i, p in enumerate(PRODUCTS) if p["product_id"] == product["product_id"])
    end = end_date or date.today()
    start = end - timedelta(days=days - 1)
    window = [start + timedelta(days=offset) for offset in range(days)]

    units = [_units_for(product, index, day) for day in window]
    rows: List[Dict] = []
    stock = int(product["stock"])
    suffix_units = sum(units)
    for day, sold in zip(window, units):
        suffix_units -= sold
        holiday = get_holiday_for(day)
        discount = _promo_discount(day)
        rows.append(
            {
                "tenant_id": DEMO_TENANT_ID,
                "product_id": product["product_id"],
                "sku": product["sku"],
                "product_name": product["name"],
                "report_date": day,
                "units_sold": sold,
                "discount_pct": discount,
                "avg_unit_price": round(float(product["price"]) * (1 - discount), 2),
                "stock_level": max(0, stock + suffix_units),
                "is_holiday": bool(holiday),
                "holiday_weight": float(holiday["weight"]) if holiday else 0.0,
                "holiday_name": holiday["event_name"] if holiday else None,
                "day_of_week": day.isoweekday(),
                "month": day.month,
            }
        )
    return rows
