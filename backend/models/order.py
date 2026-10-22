# backend/models/order.py
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, JSON, Index
from backend.db.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(32), default="PENDING", index=True)  # PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    items = Column(JSON, nullable=False)  # [{product_id, name, price, qty, total}]
    subtotal = Column(Float, nullable=False)
    shipping_cost = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    payment_method = Column(String(32), default="CARD")  # CARD, INSTAPAY, FAWRY, COD
    payment_status = Column(String(32), default="UNPAID")  # UNPAID, PAID, REFUNDED
    payment_ref = Column(String(128), nullable=True)
    bosta_tracking_number = Column(String(128), nullable=True)
    shipping_address = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_orders_tenant_created", "tenant_id", "created_at"),
        Index("idx_orders_tenant_status", "tenant_id", "status"),
    )


class OrderStatusLog(Base):
    __tablename__ = "order_status_log"

    id = Column(String(64), primary_key=True, index=True)
    order_id = Column(String(64), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(32), nullable=False)
    note = Column(Text, nullable=True)
    created_by = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
