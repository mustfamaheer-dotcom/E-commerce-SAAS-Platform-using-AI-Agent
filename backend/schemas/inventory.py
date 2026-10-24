# backend/schemas/inventory.py
"""Inventory, Stockout Alert, and Stock Movement DTO schemas."""
from typing import Optional
from pydantic import BaseModel, Field


class InventoryItemDTO(BaseModel):
    product_id: str
    sku: str
    name_ar: str
    stock_qty: int
    low_stock_threshold: int
    price: float
    cost_price: float
    is_low_stock: bool


class InventoryAdjustDTO(BaseModel):
    stock_qty: int = Field(..., ge=0, description="New absolute quantity available")
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    reason: Optional[str] = Field("manual_adjustment", description="Audit reason for stock change")


class InventoryReservationItem(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)


class StockoutAlertDTO(BaseModel):
    product_id: str
    sku: str
    product_name: str
    current_stock: int
    low_stock_threshold: int
    days_until_stockout: Optional[float] = None
    urgency: str = Field("WARNING", pattern="^(CRITICAL|WARNING|HEALTHY)$")
    daily_profit_at_risk: float = 0.0
    recommended_reorder_qty: int = 0
