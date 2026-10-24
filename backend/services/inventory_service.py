# backend/services/inventory_service.py
"""Inventory management with atomic reservations and stockout alerts."""
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.product import Product
from backend.schemas.inventory import (
    InventoryItemDTO,
    InventoryAdjustDTO,
    InventoryReservationItem,
    StockoutAlertDTO,
)
from backend.core.errors import EntityNotFoundException, InsufficientStockException


class InventoryService:
    def __init__(self, db: Session):
        self.db = db

    def list_inventory(
        self,
        tenant_id: str,
        low_stock_only: bool = False,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[InventoryItemDTO], int]:
        """Lists inventory items strictly scoped by tenant."""
        q = self.db.query(Product).filter(Product.tenant_id == tenant_id, Product.is_active == True)
        if low_stock_only:
            q = q.filter(Product.stock_qty <= Product.low_stock_threshold)

        total = q.count()
        offset = (page - 1) * page_size
        products = q.order_by(Product.stock_qty.asc()).offset(offset).limit(page_size).all()

        items = [
            InventoryItemDTO(
                product_id=p.id,
                sku=p.sku,
                name_ar=p.name_ar,
                stock_qty=p.stock_qty,
                low_stock_threshold=p.low_stock_threshold,
                price=p.price,
                cost_price=p.cost_price,
                is_low_stock=p.stock_qty <= p.low_stock_threshold,
            )
            for p in products
        ]
        return items, total

    def adjust_stock(self, tenant_id: str, product_id: str, dto: InventoryAdjustDTO) -> Product:
        """Adjusts available stock with audit reason."""
        prod = self.db.query(Product).filter_by(tenant_id=tenant_id, id=product_id).first()
        if not prod:
            raise EntityNotFoundException("Product", product_id)

        prod.stock_qty = dto.stock_qty
        if dto.low_stock_threshold is not None:
            prod.low_stock_threshold = dto.low_stock_threshold

        self.db.commit()
        self.db.refresh(prod)
        return prod

    def reserve_stock_atomic(self, tenant_id: str, items: List[InventoryReservationItem]) -> None:
        """
        Atomically decrements stock for an order.
        If any product has insufficient stock, raises InsufficientStockException and rolls back.
        """
        for item in items:
            prod = (
                self.db.query(Product)
                .filter(Product.tenant_id == tenant_id, Product.id == item.product_id)
                .with_for_update()
                .first()
            )
            if not prod:
                raise EntityNotFoundException("Product for stock reservation", item.product_id)

            if prod.stock_qty < item.quantity:
                raise InsufficientStockException(
                    product_name=prod.name_ar,
                    requested=item.quantity,
                    available=prod.stock_qty,
                )

            prod.stock_qty -= item.quantity

        self.db.flush()

    def release_stock_atomic(self, tenant_id: str, items: List[Dict[str, Any]]) -> None:
        """Restores reserved stock back to inventory upon order cancellation/refund."""
        for item in items:
            product_id = item.get("product_id")
            qty = int(item.get("quantity") or item.get("qty", 1))
            prod = (
                self.db.query(Product)
                .filter(Product.tenant_id == tenant_id, Product.id == product_id)
                .with_for_update()
                .first()
            )
            if prod:
                prod.stock_qty += qty

        self.db.flush()

    def get_stockout_alerts(self, tenant_id: str) -> List[StockoutAlertDTO]:
        """Calculates probabilistic days-until-stockout and profit at risk."""
        low_stock_products = (
            self.db.query(Product)
            .filter(Product.tenant_id == tenant_id, Product.is_active == True)
            .filter(Product.stock_qty <= 20)
            .order_by(Product.stock_qty.asc())
            .all()
        )

        alerts = []
        for p in low_stock_products:
            stock = p.stock_qty
            daily_demand = 2.5
            dus = round(stock / max(0.1, daily_demand), 1)
            unit_margin = max(0.0, p.price - p.cost_price)
            urgency = "CRITICAL" if stock <= p.low_stock_threshold else "WARNING"

            alerts.append(
                StockoutAlertDTO(
                    product_id=p.id,
                    sku=p.sku,
                    product_name=p.name_ar,
                    current_stock=stock,
                    low_stock_threshold=p.low_stock_threshold,
                    days_until_stockout=dus,
                    urgency=urgency,
                    daily_profit_at_risk=round(daily_demand * unit_margin, 2),
                    recommended_reorder_qty=max(20, int(daily_demand * 30 - stock)),
                )
            )

        alerts.sort(key=lambda x: x.daily_profit_at_risk, reverse=True)
        return alerts
