# backend/services/cart_service.py
"""Cart calculation and checkout pricing service."""
from typing import List, Optional
from sqlalchemy.orm import Session

from backend.models.product import Product
from backend.models.tenant import StoreSettings
from backend.schemas.cart import CartDTO, CartItemDTO
from backend.services.coupon_service import CouponService
from backend.core.errors import EntityNotFoundException


class CartService:
    def __init__(self, db: Session):
        self.db = db
        self.coupon_service = CouponService(db)

    def calculate_cart(
        self,
        tenant_id: str,
        items: List[CartItemDTO],
        coupon_code: Optional[str] = None,
        city: Optional[str] = "Cairo",
    ) -> CartDTO:
        """
        Validates product prices and stock, calculates subtotal, discount,
        governorate shipping fees, and grand total.
        """
        calculated_items: List[CartItemDTO] = []
        subtotal = 0.0

        for item in items:
            prod = self.db.query(Product).filter_by(tenant_id=tenant_id, id=item.product_id).first()
            if not prod or not prod.is_active:
                raise EntityNotFoundException("Product in cart", item.product_id)

            item_price = float(prod.price)
            line_total = round(item_price * item.quantity, 2)
            subtotal += line_total

            calculated_items.append(
                CartItemDTO(
                    product_id=prod.id,
                    variant_id=item.variant_id,
                    name=prod.name_ar,
                    price=item_price,
                    quantity=item.quantity,
                    sku=prod.sku,
                    image_url=prod.images[0] if prod.images else None,
                    total=line_total,
                )
            )

        # Shipping Calculation from Store Settings
        settings = self.db.query(StoreSettings).filter_by(tenant_id=tenant_id).first()
        shipping_zones = settings.shipping_zones if settings and settings.shipping_zones else {}
        cairo_rate = float(shipping_zones.get("cairo_giza", 45.0))
        gov_rate = float(shipping_zones.get("governorates", 65.0))

        if city and city.strip().lower() in ["cairo", "giza", "القاهرة", "الجيزة"]:
            shipping_cost = cairo_rate
        else:
            shipping_cost = gov_rate

        # Discount Calculation
        discount = 0.0
        applied_code = None
        if coupon_code:
            is_valid, disc_amt, _ = self.coupon_service.validate_coupon(
                tenant_id=tenant_id, code=coupon_code, subtotal=subtotal
            )
            if is_valid:
                discount = disc_amt
                applied_code = coupon_code.upper().strip()

        total = max(0.0, round(subtotal - discount + shipping_cost, 2))

        return CartDTO(
            items=calculated_items,
            subtotal=round(subtotal, 2),
            discount=round(discount, 2),
            shipping_cost=shipping_cost,
            tax=0.0,
            total=total,
            applied_coupon=applied_code,
            currency="EGP",
        )
