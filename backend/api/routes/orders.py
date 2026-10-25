# backend/api/routes/orders.py
from fastapi import APIRouter, Depends, HTTPException, Header, Query
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
    tenant_id: Optional[str] = None


class OrderStatusUpdatePayload(BaseModel):
    status: str
    note: Optional[str] = None


@router.get("")
def list_orders(
    tenant_id: Optional[str] = Query(None),
    x_tenant_id: Optional[str] = Header(None),
    status: Optional[str] = None,
    limit: Optional[int] = 300,
    db: Session = Depends(get_db),
):
    effective_tid = tenant_id or x_tenant_id or "tenant-moustafa-tech"
    q = db.query(Order)
    if effective_tid and effective_tid != "all":
        q = q.filter_by(tenant_id=effective_tid)
    if status and status != "ALL":
        q = q.filter_by(status=status.upper())
    q = q.order_by(Order.created_at.desc())
    if limit:
        q = q.limit(limit)
    orders = q.all()
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
    tenant_id: Optional[str] = Query(None),
    x_tenant_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    effective_tid = payload.tenant_id or tenant_id or x_tenant_id or "tenant-moustafa-tech"

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
        tenant_id=effective_tid,
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

    # Update or add Customer record (Guest or registered)
    name = payload.shipping_address.get("name") or "عميل زائر"
    phone = payload.shipping_address.get("phone")
    email = payload.shipping_address.get("email")
    if name:
        cust = None
        if phone:
            cust = db.query(Customer).filter_by(tenant_id=effective_tid, phone=phone).first()
        if not cust and email:
            cust = db.query(Customer).filter_by(tenant_id=effective_tid, email=email).first()

        if not cust:
            cust = Customer(
                id=f"cust_{uuid.uuid4().hex[:8]}",
                tenant_id=effective_tid,
                name=name,
                phone=phone or "+20 100 000 0000",
                email=email or f"guest_{uuid.uuid4().hex[:6]}@store.eg",
                governorate=payload.shipping_address.get("city", "Cairo"),
                city=payload.shipping_address.get("city", "Cairo"),
                address=payload.shipping_address.get("address", ""),
                total_orders=1,
                total_spent=total,
            )
            db.add(cust)
        else:
            cust.total_orders = (cust.total_orders or 0) + 1
            cust.total_spent = float(cust.total_spent or 0.0) + total

    # Deduct stock
    for item in payload.items:
        pid = item.get("id") or item.get("productId")
        if pid:
            prod = db.query(Product).filter_by(tenant_id=effective_tid, id=pid).first()
            if prod:
                prod.stock_qty = max(0, prod.stock_qty - int(item.get("quantity", 1)))

    db.commit()

    return {
        "status": "success",
        "orderId": order_id,
        "shippingAwb": bosta_awb,
        "paymentRef": payment_ref,
        "total": total,
        "tenantId": effective_tid,
    }


@router.get("/{order_id}")
def get_order(
    order_id: str,
    tenant_id: Optional[str] = Query(None),
    x_tenant_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    effective_tid = tenant_id or x_tenant_id or "tenant-moustafa-tech"
    query = db.query(Order).filter_by(id=order_id)
    if effective_tid and effective_tid != "all":
        query = query.filter_by(tenant_id=effective_tid)
    order = query.first()
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")

    logs = (
        db.query(OrderStatusLog)
        .filter_by(order_id=order.id)
        .order_by(OrderStatusLog.created_at.asc())
        .all()
    )

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
        "trackingNumber": order.bosta_tracking_number,
        "shippingAddress": order.shipping_address,
        "createdAt": order.created_at.isoformat() if order.created_at else None,
        "timeline": [
            {
                "id": l.id,
                "status": l.status,
                "note": l.note,
                "createdAt": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ],
    }


@router.put("/{order_id}/status")
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdatePayload,
    tenant_id: Optional[str] = Query(None),
    x_tenant_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    effective_tid = tenant_id or x_tenant_id or "tenant-moustafa-tech"
    query = db.query(Order).filter_by(id=order_id)
    if effective_tid and effective_tid != "all":
        query = query.filter_by(tenant_id=effective_tid)
    order = query.first()
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")

    valid_statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]
    next_st = payload.status.upper()
    if next_st not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"حالة الطلب غير صالحة. الحالات المقبولة: {valid_statuses}")

    order.status = next_st
    if next_st == "DELIVERED":
        order.payment_status = "PAID"

    log = OrderStatusLog(
        id=f"log_{uuid.uuid4().hex[:8]}",
        order_id=order.id,
        status=next_st,
        note=payload.note or f"Updated status to {next_st}",
        created_by="merchant_admin",
    )
    db.add(log)
    db.commit()

    return {"status": "success", "message": f"تم تحديث حالة الطلب إلى {next_st}", "orderId": order.id, "newStatus": next_st}
