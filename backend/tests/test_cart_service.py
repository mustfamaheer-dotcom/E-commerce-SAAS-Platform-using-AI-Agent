# backend/tests/test_cart_service.py
"""Test Suite for Cart Pricing, Coupon Application, and Governorate Shipping Calculations."""
import uuid
import pytest
from backend.db.database import SessionLocal
from backend.models.tenant import Tenant, StoreSettings
from backend.models.product import Product
from backend.models.coupon import Coupon
from backend.services.cart_service import CartService
from backend.schemas.cart import CartItemDTO


@pytest.fixture
def cart_setup():
    db = SessionLocal()
    tenant_id = f"tenant_cart_test_{uuid.uuid4().hex[:6]}"
    tenant = Tenant(id=tenant_id, name="متجر فحص السلة", slug=f"cart-test-{uuid.uuid4().hex[:4]}")
    db.add(tenant)
    db.flush()

    settings = StoreSettings(
        tenant_id=tenant_id,
        display_name="متجر فحص السلة",
        shipping_zones={"cairo_giza": 45.0, "governorates": 65.0},
    )
    db.add(settings)
    db.flush()

    prod1_id = f"prod_cart_1_{uuid.uuid4().hex[:6]}"
    prod1 = Product(
        id=prod1_id,
        tenant_id=tenant_id,
        name_ar="ماوس لاسلكي",
        slug=f"mouse-{uuid.uuid4().hex[:4]}",
        price=500.0,
        cost_price=300.0,
        sku=f"SKU-MOUSE-{uuid.uuid4().hex[:4]}",
        stock_qty=50,
        is_active=True,
    )
    db.add(prod1)
    db.flush()

    # 20% coupon
    coupon = Coupon(
        id=f"coup_test_{uuid.uuid4().hex[:6]}",
        tenant_id=tenant_id,
        code="SAVE20",
        type="percent",
        value=20.0,
        min_order=200.0,
        max_uses=100,
        is_active=True,
    )
    db.add(coupon)
    db.commit()

    yield db, tenant_id, prod1_id

    # Cleanup
    db.query(Coupon).filter(Coupon.tenant_id == tenant_id).delete(synchronize_session=False)
    db.query(Product).filter(Product.tenant_id == tenant_id).delete(synchronize_session=False)
    db.query(StoreSettings).filter(StoreSettings.tenant_id == tenant_id).delete(synchronize_session=False)
    db.query(Tenant).filter(Tenant.id == tenant_id).delete(synchronize_session=False)
    db.commit()
    db.close()


def test_cart_calculation_without_coupon(cart_setup):
    db, tenant_id, prod_id = cart_setup
    service = CartService(db)

    items = [CartItemDTO(product_id=prod_id, name="ماوس لاسلكي", price=500.0, quantity=2, total=1000.0)]
    cart = service.calculate_cart(tenant_id=tenant_id, items=items, city="Cairo")

    assert cart.subtotal == 1000.0
    assert cart.discount == 0.0
    assert cart.shipping_cost == 45.0
    assert cart.total == 1045.0


def test_cart_calculation_with_valid_percent_coupon(cart_setup):
    db, tenant_id, prod_id = cart_setup
    service = CartService(db)

    items = [CartItemDTO(product_id=prod_id, name="ماوس لاسلكي", price=500.0, quantity=2, total=1000.0)]
    cart = service.calculate_cart(tenant_id=tenant_id, items=items, coupon_code="SAVE20", city="Alexandria")

    assert cart.subtotal == 1000.0
    assert cart.discount == 200.0  # 20% of 1000
    assert cart.shipping_cost == 65.0  # Governorates rate
    assert cart.total == 865.0  # 1000 - 200 + 65
    assert cart.applied_coupon == "SAVE20"


def test_cart_calculation_with_invalid_coupon(cart_setup):
    db, tenant_id, prod_id = cart_setup
    service = CartService(db)

    items = [CartItemDTO(product_id=prod_id, name="ماوس لاسلكي", price=500.0, quantity=1, total=500.0)]
    cart = service.calculate_cart(tenant_id=tenant_id, items=items, coupon_code="NONEXISTENT")

    assert cart.subtotal == 500.0
    assert cart.discount == 0.0
    assert cart.applied_coupon is None
