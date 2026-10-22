# backend/api/routes/inventory.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.db.database import get_db
from backend.models import Product

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])


class StockAdjustPayload(BaseModel):
    stock_qty: int
    low_stock_threshold: int = 5


from typing import Optional

@router.get("")
def get_inventory(
    tenant_id: Optional[str] = "tenant-moustafa-tech",
    limit: Optional[int] = 300,
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if tenant_id and tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    query = query.order_by(Product.stock_qty.asc())
    if limit:
        query = query.limit(limit)
    products = query.all()
    return [
        {
            "id": p.id,
            "sku": p.sku,
            "name": p.name_ar,
            "stock": p.stock_qty,
            "threshold": p.low_stock_threshold,
            "price": p.price,
            "costPrice": p.cost_price,
            "isLowStock": p.stock_qty <= p.low_stock_threshold,
        }
        for p in products
    ]


@router.put("/{product_id}")
def update_stock(
    product_id: str,
    payload: StockAdjustPayload,
    tenant_id: Optional[str] = "tenant-moustafa-tech",
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter_by(id=product_id)
    if tenant_id and tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    prod = query.first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    prod.stock_qty = payload.stock_qty
    prod.low_stock_threshold = payload.low_stock_threshold
    db.commit()

    return {
        "status": "success",
        "message": f"تم تحديث مخزون '{prod.name_ar}' ليصبح {prod.stock_qty} قطعة.",
    }
