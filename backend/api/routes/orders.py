# backend/api/routes/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid

from backend.db.database import get_db
from backend.models import Order, OrderStatusLog, Customer, Product

router = APIRouter(prefix="/orders", tags=["Orders & Fulfillment"])


class OrderCreatePayload(BaseModel):
    items: List[Dict[str, Any]]
    shipping_address: Dict[str, Any]
    payment_method: str = "CARD"
    promo_code: Optional[str] = None


class OrderStatusUpdatePayload(BaseModel):
    status: str
    note: Optional[str] = None


@router.get("")
def list_orders(
    tenant_id: str = "tenant-moustafa-tech",
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Order).filter_by(tenant_id=tenant_id)
    if status:
        q = q.filter_by(status=status.upper())
    orders = q.order_by(Order.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "status": o.status,
            "items": o.items,
            "subtotal": o.subtotal,
            "shippingCost": o.shipping_cost,
            "discount": o.discount,
            "total": o.total,
            "paymentMethod": o.payment_method,
            "paymentStatus": o.payment_status,
            "paymentRef": o.payment_ref,
            "trackingNumber": o.bosta_tracking_number,
            "shippingAddress": o.shipping_address,
            "createdAt": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


@router.post("")
def place_order(
    payload: OrderCreatePayload,
    tenant_id: str = "tenant-moustafa-tech",
    db: Session = Depends(get_db),
):
    subtotal = sum(float(item.get("price", 0)) * int(item.get("quantity", 1)) for item in payload.items)
    shipping_cost = 45.0 if payload.shipping_address.get("city") in ["Cairo", "Giza"] else 65.0
    discount = 0.0

    if payload.promo_code and payload.promo_code.upper() in ["WELCOME10", "SAVE20"]:
        pct = 0.10 if payload.promo_code.upper() == "WELCOME10" else 0.20
        discount = round(subtotal * pct, 2)

    total = max(0.0, subtotal - discount + shipping_cost)
    order_id = f"ord_eg_{uuid.uuid4().hex[:6]}"
    bosta_awb = f"BOSTA-AWB-{uuid.uuid4().hex[:7].upper()}"
    payment_ref = f"PAYMOB-{uuid.uuid4().hex[:6].upper()}"

    order = Order(
        id=order_id,
        tenant_id=tenant_id,
        status="CONFIRMED",
        items=payload.items,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        discount=discount,
        total=total,
        payment_method=payload.payment_method.upper(),
        payment_status="PAID" if payload.payment_method.upper() != "COD" else "UNPAID",
        payment_ref=payment_ref,
        bosta_tracking_number=bosta_awb,
        shipping_address=payload.shipping_address,
    )
    db.add(order)

    # Log initial status
    log = OrderStatusLog(
        id=f"log_{uuid.uuid4().hex[:8]}",
        order_id=order_id,
        status="CONFIRMED",
        note="Order confirmed and queued for fulfillment.",
        created_by="system",
    )
    db.add(log)

    # Update or add Customer
    name = payload.shipping_address.get("name")
    phone = payload.shipping_address.get("phone")
    email = payload.shipping_address.get("email")
    if name:
        cust = db.query(Customer).filter_by(tenant_id=tenant_id, phone=phone).first() if phone else None
        if not cust:
            cust = Customer(
                id=f"cust_{uuid.uuid4().hex[:8]}",
                tenant_id=tenant_id,
                name=name,
                phone=phone,
                email=email,
                governorate=payload.shipping_address.get("city", "Cairo"),
                city=payload.shipping_address.get("city", "Cairo"),
                address=payload.shipping_address.get("address", ""),
                total_orders=1,
                total_spent=total,
            )
            db.add(cust)
        else:
            cust.total_orders += 1
            cust.total_spent += total

    # Deduct stock
    for item in payload.items:
        pid = item.get("id") or item.get("productId")
        if pid:
            prod = db.query(Product).filter_by(tenant_id=tenant_id, id=pid).first()
            if prod:
                prod.stock_qty = max(0, prod.stock_qty - int(item.get("quantity", 1)))

    db.commit()

    return {
        "status": "success",
        "orderId": order_id,
        "shippingAwb": bosta_awb,
        "paymentRef": payment_ref,
        "total": total,
    }


@router.get("/{order_id}")
def get_order(order_id: str, tenant_id: str = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    order = db.query(Order).filter_by(tenant_id=tenant_id, id=order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    logs = db.query(OrderStatusLog).filter_by(order_id=order_id).order_by(OrderStatusLog.created_at.asc()).all()
    return {
        "id": order.id,
        "status": order.status,
        "items": order.items,
        "subtotal": order.subtotal,
        "shippingCost": order.shipping_cost,
        "discount": order.discount,
        "total": order.total,
        "paymentMethod": order.payment_method,
        "paymentStatus": order.payment_status,
        "paymentRef": order.payment_ref,
        "trackingNumber": order.bosta_tracking_number,
        "shippingAddress": order.shipping_address,
        "createdAt": order.created_at.isoformat() if order.created_at else None,
        "timeline": [
            {"status": l.status, "note": l.note, "createdAt": l.created_at.isoformat() if l.created_at else None}
            for l in logs
        ],
    }


@router.put("/{order_id}/status")
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdatePayload,
    tenant_id: str = "tenant-moustafa-tech",
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter_by(tenant_id=tenant_id, id=order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status.upper()
    log = OrderStatusLog(
        id=f"log_{uuid.uuid4().hex[:8]}",
        order_id=order_id,
        status=payload.status.upper(),
        note=payload.note or f"Order status changed to {payload.status.upper()}",
        created_by="staff",
    )
    db.add(log)
    db.commit()
    return {"status": "success", "message": f"تم تحديث حالة الطلب إلى {payload.status.upper()}"}
