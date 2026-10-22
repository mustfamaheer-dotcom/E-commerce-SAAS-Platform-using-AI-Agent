# backend/api/routes/customers.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from backend.db.database import get_db
from backend.models import Customer, Order

router = APIRouter(prefix="/customers", tags=["Customer CRM"])


@router.get("")
def list_customers(
    tenant_id: Optional[str] = "tenant-moustafa-tech",
    limit: Optional[int] = 300,
    db: Session = Depends(get_db),
):
    query = db.query(Customer)
    if tenant_id and tenant_id != "all":
        query = query.filter_by(tenant_id=tenant_id)
    query = query.order_by(Customer.total_spent.desc())
    if limit:
        query = query.limit(limit)
    customers = query.all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "email": c.email,
            "governorate": c.governorate,
            "city": c.city,
            "address": c.address,
            "totalOrders": c.total_orders,
            "totalSpent": c.total_spent,
        }
        for c in customers
    ]


@router.get("/{customer_id}")
def get_customer(customer_id: str, tenant_id: Optional[str] = "tenant-moustafa-tech", db: Session = Depends(get_db)):
    q = db.query(Customer).filter_by(id=customer_id)
    if tenant_id and tenant_id != "all":
        q = q.filter_by(tenant_id=tenant_id)
    cust = q.first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    oq = db.query(Order)
    if tenant_id and tenant_id != "all":
        oq = oq.filter_by(tenant_id=tenant_id)
    orders = oq.filter(Order.shipping_address["phone"].astext == cust.phone).all() if cust.phone else []
    return {
        "id": cust.id,
        "name": cust.name,
        "phone": cust.phone,
        "email": cust.email,
        "governorate": cust.governorate,
        "city": cust.city,
        "address": cust.address,
        "totalOrders": cust.total_orders,
        "totalSpent": cust.total_spent,
        "orders": [
            {"id": o.id, "total": o.total, "status": o.status, "createdAt": o.created_at.isoformat() if o.created_at else None}
            for o in orders
        ],
    }
