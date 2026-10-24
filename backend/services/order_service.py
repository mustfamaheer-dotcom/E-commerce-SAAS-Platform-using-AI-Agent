# backend/services/order_service.py
"""Order lifecycle, state machine transitions, and transactional inventory reservations."""
import uuid
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session

from backend.models.order import Order, OrderStatusLog
from backend.models.customer import Customer
from backend.schemas.order import OrderCreateDTO, OrderDTO, OrderStatusUpdateDTO, OrderFilterParams
from backend.schemas.inventory import InventoryReservationItem
from backend.services.inventory_service import InventoryService
from backend.services.cart_service import CartService
from backend.services.coupon_service import CouponService
from backend.core.errors import (
    EntityNotFoundException,
    InvalidOrderStateTransitionException,
    PlatformException,
)

# Robust state machine transition map
VALID_ORDER_TRANSITIONS = {
    "PENDING": ["CONFIRMED", "CANCELLED"],
    "CONFIRMED": ["PROCESSING", "CANCELLED"],
    "PROCESSING": ["SHIPPED", "CANCELLED"],
    "SHIPPED": ["DELIVERED", "RETURNED"],
    "DELIVERED": ["REFUNDED", "RETURNED"],
    "CANCELLED": [],
    "REFUNDED": [],
    "RETURNED": ["REFUNDED"],
}


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.inventory_service = InventoryService(db)
        self.cart_service = CartService(db)
        self.coupon_service = CouponService(db)

    def get_by_id(self, tenant_id: str, order_id: str) -> Order:
        order = self.db.query(Order).filter_by(tenant_id=tenant_id, id=order_id).first()
        if not order:
            raise EntityNotFoundException("Order", order_id)
        return order

    def list_orders(
        self,
        tenant_id: str,
        filters: Optional[OrderFilterParams] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[Order], int]:
        q = self.db.query(Order).filter(Order.tenant_id == tenant_id)

        if filters:
            if filters.status and filters.status != "ALL":
                q = q.filter(Order.status == filters.status.upper())
            if filters.payment_status:
                q = q.filter(Order.payment_status == filters.payment_status.upper())
            if filters.from_date:
                q = q.filter(Order.created_at >= filters.from_date)
            if filters.to_date:
                q = q.filter(Order.created_at <= filters.to_date)

        total = q.count()
        offset = (page - 1) * page_size
        orders = q.order_by(Order.created_at.desc()).offset(offset).limit(page_size).all()
        return orders, total

    def place_order(self, tenant_id: str, dto: OrderCreateDTO, user_id: Optional[str] = None) -> Order:
        """
        Transactional order placement:
        1. Atomically reserves product stock (prevents overselling).
        2. Calculates pricing, shipping, and validates/consumes promo code.
        3. Creates Order and initial OrderStatusLog.
        4. Updates or creates Customer CRM profile.
        """
        reservation_items = [
            InventoryReservationItem(product_id=item.product_id, quantity=item.quantity)
            for item in dto.items
        ]

        # 1. Atomic stock reservation
        self.inventory_service.reserve_stock_atomic(tenant_id=tenant_id, items=reservation_items)

        # 2. Pricing and Coupon
        subtotal = sum(float(item.price) * item.quantity for item in dto.items)
        shipping_cost = 45.0 if dto.shipping_address.city in ["Cairo", "Giza", "القاهرة", "الجيزة"] else 65.0

        discount = 0.0
        if dto.promo_code:
            try:
                discount = self.coupon_service.apply_and_consume(
                    tenant_id=tenant_id, code=dto.promo_code, subtotal=subtotal
                )
            except Exception:
                # If invalid promo code, proceed without discount
                discount = 0.0

        total = max(0.0, round(subtotal - discount + shipping_cost, 2))
        order_id = f"ord_{uuid.uuid4().hex[:10]}"
        initial_status = "CONFIRMED" if dto.payment_method == "COD" else "PENDING"
        payment_status = "UNPAID"

        serialized_items = [item.model_dump() for item in dto.items]
        serialized_address = dto.shipping_address.model_dump()

        order = Order(
            id=order_id,
            tenant_id=tenant_id,
            user_id=user_id,
            status=initial_status,
            items=serialized_items,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            discount=discount,
            total=total,
            payment_method=dto.payment_method,
            payment_status=payment_status,
            shipping_address=serialized_address,
        )
        self.db.add(order)

        # Order Status Audit Log
        status_log = OrderStatusLog(
            id=f"log_{uuid.uuid4().hex[:8]}",
            order_id=order_id,
            status=initial_status,
            note="Order placed successfully.",
            created_by=user_id or "customer",
        )
        self.db.add(status_log)

        # Update / Record Customer CRM
        phone = dto.shipping_address.phone
        if phone:
            customer = self.db.query(Customer).filter_by(tenant_id=tenant_id, phone=phone).first()
            if not customer:
                customer = Customer(
                    id=f"cust_{uuid.uuid4().hex[:10]}",
                    tenant_id=tenant_id,
                    name=dto.shipping_address.full_name,
                    phone=phone,
                    email=str(dto.shipping_address.email) if dto.shipping_address.email else None,
                    city=dto.shipping_address.city,
                    governorate=dto.shipping_address.governorate,
                    address=dto.shipping_address.address,
                    total_orders=1,
                    total_spent=total,
                )
                self.db.add(customer)
            else:
                customer.total_orders += 1
                customer.total_spent += total
                customer.city = dto.shipping_address.city

        self.db.commit()
        self.db.refresh(order)
        return order

    def update_order_status(
        self, tenant_id: str, order_id: str, dto: OrderStatusUpdateDTO, updated_by: Optional[str] = None
    ) -> Order:
        """
        Validates state machine transitions, releases stock if cancelled/refunded,
        and records audit log.
        """
        order = self.get_by_id(tenant_id, order_id)
        current = order.status.upper()
        target = dto.status.upper()

        if target == current:
            return order

        allowed_targets = VALID_ORDER_TRANSITIONS.get(current, [])
        if target not in allowed_targets:
            raise InvalidOrderStateTransitionException(current_status=current, target_status=target)

        # If order is cancelled or refunded, restore stock back to catalog
        if target in ("CANCELLED", "REFUNDED") and current not in ("CANCELLED", "REFUNDED"):
            self.inventory_service.release_stock_atomic(tenant_id=tenant_id, items=order.items)

        order.status = target
        if target == "DELIVERED" and order.payment_method == "COD":
            order.payment_status = "PAID"

        log = OrderStatusLog(
            id=f"log_{uuid.uuid4().hex[:8]}",
            order_id=order.id,
            status=target,
            note=dto.note or f"Status changed from {current} to {target}",
            created_by=updated_by or "admin",
        )
        self.db.add(log)

        self.db.commit()
        self.db.refresh(order)
        return order
