# apps/ml/src/inventory/stockout_optimizer.py
import math
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from scipy import stats
from pydantic import BaseModel, Field

# Constants per System Design & Mathematical Formulation
DEFAULT_SERVICE_LEVEL = 0.95
Z_SCORE_95 = 1.645  # stats.norm.ppf(0.95) ≈ 1.64485
DEFAULT_LEAD_TIME_DAYS = 5
EPSILON = 1e-4


class SKUInventoryRiskProfile(BaseModel):
    sku: str
    product_name: str
    category: Optional[str] = None
    current_stock: int
    unit_cost: float
    unit_price: float
    unit_margin: float
    mean_daily_demand: float
    ewma_velocity: float
    demand_std_dev: float
    safety_stock: int
    reorder_point: int
    days_until_stockout: float
    daily_profit_at_risk: float
    urgency_level: str  # "CRITICAL" | "HIGH" | "MEDIUM" | "HEALTHY"
    recommended_order_quantity: int


class InventoryRiskAnalysisResult(BaseModel):
    total_skus_evaluated: int
    skus_at_risk_count: int
    total_daily_profit_at_risk: float
    ranked_risk_profiles: List[SKUInventoryRiskProfile]


def compute_safety_stock(
    demand_std_dev: float,
    lead_time_days: int = DEFAULT_LEAD_TIME_DAYS,
    service_level: float = DEFAULT_SERVICE_LEVEL,
) -> int:
    """
    Computes Safety Stock (SS) = Z_{alpha} * sigma_d * sqrt(L).
    """
    if demand_std_dev <= 0 or lead_time_days <= 0:
        return 0
    z_score = float(stats.norm.ppf(service_level))
    ss = z_score * demand_std_dev * math.sqrt(lead_time_days)
    return int(math.ceil(ss))


def compute_reorder_point(
    mean_daily_demand: float,
    safety_stock: int,
    lead_time_days: int = DEFAULT_LEAD_TIME_DAYS,
) -> int:
    """
    Computes Reorder Point (ROP) = (mu_d * L) + SS.
    """
    cycle_demand = mean_daily_demand * lead_time_days
    return int(math.ceil(cycle_demand + safety_stock))


def compute_days_until_stockout(current_stock: int, demand_velocity: float) -> float:
    """
    Computes DUS = Q_current / max(EWMA_d, epsilon).
    """
    effective_velocity = max(demand_velocity, EPSILON)
    dus = max(0.0, current_stock / effective_velocity)
    return round(dus, 2)


def compute_daily_profit_at_risk(demand_velocity: float, unit_price: float, unit_cost: float) -> float:
    """
    Computes Daily Profit at Risk = EWMA_d * max(0, price - cost).
    """
    net_margin = max(0.0, unit_price - unit_cost)
    return round(demand_velocity * net_margin, 2)


def analyze_inventory_risk(
    items: List[Dict[str, Any]],
    lead_time_days: int = DEFAULT_LEAD_TIME_DAYS,
    service_level: float = DEFAULT_SERVICE_LEVEL,
) -> InventoryRiskAnalysisResult:
    """
    Analyzes SKU demand velocity, volatility (sigma_d), calculates ROP & DUS,
    and returns ranked risk profiles prioritizing maximum lost net profit.
    """
    profiles: List[SKUInventoryRiskProfile] = []
    total_profit_at_risk = 0.0

    for item in items:
        sku = item.get("sku", "UNKNOWN")
        name = item.get("name") or item.get("product_name", "Product")
        category = item.get("category", "General")
        current_stock = int(item.get("current_stock") or item.get("quantity") or 0)
        unit_cost = float(item.get("cost") or item.get("unit_cost") or 0.0)
        unit_price = float(item.get("price") or item.get("unit_price") or 0.0)
        unit_margin = max(0.0, unit_price - unit_cost)

        # Historical daily demand series (e.g. past 7-30 days)
        demand_history = item.get("demand_history")
        if demand_history and len(demand_history) > 0:
            demand_series = pd.Series(demand_history, dtype=float)
            mean_demand = float(demand_series.mean())
            std_dev = float(demand_series.std(ddof=1)) if len(demand_series) > 1 else float(demand_series.std())
            if np.isnan(std_dev):
                std_dev = mean_demand * 0.25
            # Exponentially Weighted Moving Average (alpha=0.3)
            ewma_vel = float(demand_series.ewm(alpha=0.3, adjust=False).mean().iloc[-1])
        else:
            # Fallback to provided velocity or defaults
            mean_demand = float(item.get("mean_daily_demand", 3.0))
            std_dev = float(item.get("demand_std_dev", mean_demand * 0.35))
            ewma_vel = float(item.get("ewma_velocity", mean_demand))

        # Mathematical calculations
        ss = compute_safety_stock(std_dev, lead_time_days, service_level)
        rop = compute_reorder_point(mean_demand, ss, lead_time_days)
        dus = compute_days_until_stockout(current_stock, ewma_vel)
        daily_loss = compute_daily_profit_at_risk(ewma_vel, unit_price, unit_cost)

        # Classify Urgency Level
        if current_stock <= 0 or dus <= 1.0:
            urgency = "CRITICAL"
        elif current_stock <= rop or dus <= float(lead_time_days):
            urgency = "HIGH"
        elif dus <= float(lead_time_days * 2):
            urgency = "MEDIUM"
        else:
            urgency = "HEALTHY"

        # Recommended order quantity (covers lead time + 30 days cycle stock + safety stock)
        recommended_qty = max(
            int(math.ceil(mean_demand * (lead_time_days + 30) + ss - current_stock)),
            10,
        )

        if urgency in ("CRITICAL", "HIGH", "MEDIUM"):
            total_profit_at_risk += daily_loss

        profiles.append(
            SKUInventoryRiskProfile(
                sku=sku,
                product_name=name,
                category=category,
                current_stock=current_stock,
                unit_cost=unit_cost,
                unit_price=unit_price,
                unit_margin=round(unit_margin, 2),
                mean_daily_demand=round(mean_demand, 2),
                ewma_velocity=round(ewma_vel, 2),
                demand_std_dev=round(std_dev, 2),
                safety_stock=ss,
                reorder_point=rop,
                days_until_stockout=dus,
                daily_profit_at_risk=daily_loss,
                urgency_level=urgency,
                recommended_order_quantity=recommended_qty,
            )
        )

    # Sort: prioritize items where current_stock <= rop, sorted by daily_profit_at_risk descending
    def risk_sort_key(p: SKUInventoryRiskProfile):
        urgency_rank = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1, "HEALTHY": 0}.get(p.urgency_level, 0)
        return (urgency_rank, p.daily_profit_at_risk)

    profiles.sort(key=risk_sort_key, reverse=True)

    skus_at_risk = [p for p in profiles if p.urgency_level in ("CRITICAL", "HIGH")]

    return InventoryRiskAnalysisResult(
        total_skus_evaluated=len(profiles),
        skus_at_risk_count=len(skus_at_risk),
        total_daily_profit_at_risk=round(total_profit_at_risk, 2),
        ranked_risk_profiles=profiles,
    )
