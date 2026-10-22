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


@router.get("")
def get_inventory(tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    products = db.query(Product).filter_by(tenant_id=tenant_id).order_by(Product.stock_qty.asc()).all()
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
    tenant_id: str = "tenant-moustafa-tech",
    db: Session = Depends(get_db),
):
    prod = db.query(Product).filter_by(tenant_id=tenant_id, id=product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    prod.stock_qty = payload.stock_qty
    prod.low_stock_threshold = payload.low_stock_threshold
    db.commit()

    return {
        "status": "success",
        "message": f"تم تحديث مخزون '{prod.name_ar}' ليصبح {prod.stock_qty} قطعة.",
    }
