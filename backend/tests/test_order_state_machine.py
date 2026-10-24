# backend/tests/test_order_state_machine.py
"""Test Suite for Order Lifecycle, State Transitions, and Atomic Stock Reservation."""
import uuid
import pytest
from backend.db.database import SessionLocal
from backend.models.tenant import Tenant
from backend.models.product import Product
from backend.models.order import Order
from backend.services.order_service import OrderService
from backend.schemas.order import OrderCreateDTO, OrderItemDTO, ShippingAddressDTO, OrderStatusUpdateDTO
from backend.core.errors import InvalidOrderStateTransitionException, InsufficientStockException


@pytest.fixture
def db_session():
    db = SessionLocal()
    tenant_id = f"tenant_order_test_{uuid.uuid4().hex[:6]}"
    tenant = Tenant(id=tenant_id, name="متجر فحص الطلبات", slug=f"order-test-{uuid.uuid4().hex[:4]}")
    db.add(tenant)
    db.commit()

    # Create sample product with stock 10
    product_id = f"prod_order_test_{uuid.uuid4().hex[:6]}"
    prod = Product(
        id=product_id,
        tenant_id=tenant_id,
        name_ar="سماعة اختبار",
        slug=f"headphone-{uuid.uuid4().hex[:4]}",
        price=1000.0,
        cost_price=700.0,
        sku=f"SKU-TEST-{uuid.uuid4().hex[:4]}",
        stock_qty=10,
        low_stock_threshold=3,
        is_active=True,
    )
    db.add(prod)
    db.commit()

    yield db, tenant_id, product_id

    # Cleanup
    db.query(Order).filter(Order.tenant_id == tenant_id).delete(synchronize_session=False)
    db.query(Product).filter(Product.tenant_id == tenant_id).delete(synchronize_session=False)
    db.query(Tenant).filter(Tenant.id == tenant_id).delete(synchronize_session=False)
    db.commit()
    db.close()


def test_place_order_reserves_stock_and_creates_logs(db_session):
    db, tenant_id, product_id = db_session
    service = OrderService(db)

    create_dto = OrderCreateDTO(
        items=[
            OrderItemDTO(
                product_id=product_id,
                name="سماعة اختبار",
                price=1000.0,
                quantity=3,
                total=3000.0,
            )
        ],
        shipping_address=ShippingAddressDTO(
            full_name="عميل تجريبي",
            phone="01012345678",
            city="Cairo",
            governorate="Cairo",
            address="شارع التحرير، الدقي",
        ),
        payment_method="COD",
    )

    order = service.place_order(tenant_id=tenant_id, dto=create_dto)

    assert order.id.startswith("ord_")
    assert order.status == "CONFIRMED"
    assert order.subtotal == 3000.0
    assert order.shipping_cost == 45.0
    assert order.total == 3045.0

    # Verify inventory was decremented from 10 to 7
    prod = db.query(Product).filter_by(id=product_id).first()
    assert prod.stock_qty == 7


def test_insufficient_stock_prevents_order_creation(db_session):
    db, tenant_id, product_id = db_session
    service = OrderService(db)

    create_dto = OrderCreateDTO(
        items=[
            OrderItemDTO(
                product_id=product_id,
                name="سماعة اختبار",
                price=1000.0,
                quantity=999,  # Far exceeds available 10
                total=999000.0,
            )
        ],
        shipping_address=ShippingAddressDTO(
            full_name="عميل تجريبي",
            phone="01012345678",
            city="Cairo",
            governorate="Cairo",
            address="شارع التحرير، الدقي",
        ),
        payment_method="COD",
    )

    with pytest.raises(InsufficientStockException):
        service.place_order(tenant_id=tenant_id, dto=create_dto)

    # Verify inventory remains untouched at 10
    prod = db.query(Product).filter_by(id=product_id).first()
    assert prod.stock_qty == 10


def test_valid_order_state_transitions(db_session):
    db, tenant_id, product_id = db_session
    service = OrderService(db)

    create_dto = OrderCreateDTO(
        items=[
            OrderItemDTO(
                product_id=product_id,
                name="سماعة اختبار",
                price=1000.0,
                quantity=1,
                total=1000.0,
            )
        ],
        shipping_address=ShippingAddressDTO(
            full_name="عميل تجريبي",
            phone="01012345678",
            city="Cairo",
            governorate="Cairo",
            address="شارع التحرير، الدقي",
        ),
        payment_method="CARD",
    )

    # Initial CARD order is PENDING
    order = service.place_order(tenant_id=tenant_id, dto=create_dto)
    assert order.status == "PENDING"

    # PENDING -> CONFIRMED
    service.update_order_status(tenant_id, order.id, OrderStatusUpdateDTO(status="CONFIRMED"))
    assert order.status == "CONFIRMED"

    # CONFIRMED -> PROCESSING
    service.update_order_status(tenant_id, order.id, OrderStatusUpdateDTO(status="PROCESSING"))
    assert order.status == "PROCESSING"

    # PROCESSING -> SHIPPED
    service.update_order_status(tenant_id, order.id, OrderStatusUpdateDTO(status="SHIPPED"))
    assert order.status == "SHIPPED"

    # SHIPPED -> DELIVERED
    service.update_order_status(tenant_id, order.id, OrderStatusUpdateDTO(status="DELIVERED"))
    assert order.status == "DELIVERED"


def test_invalid_order_state_transition_raises_error(db_session):
    db, tenant_id, product_id = db_session
    service = OrderService(db)

    create_dto = OrderCreateDTO(
        items=[
            OrderItemDTO(
                product_id=product_id,
                name="سماعة اختبار",
                price=1000.0,
                quantity=1,
                total=1000.0,
            )
        ],
        shipping_address=ShippingAddressDTO(
            full_name="عميل تجريبي",
            phone="01012345678",
            city="Cairo",
            governorate="Cairo",
            address="شارع التحرير، الدقي",
        ),
        payment_method="CARD",
    )

    order = service.place_order(tenant_id=tenant_id, dto=create_dto)
    assert order.status == "PENDING"

    # Invalid: PENDING cannot directly transition to DELIVERED
    with pytest.raises(InvalidOrderStateTransitionException):
        service.update_order_status(tenant_id, order.id, OrderStatusUpdateDTO(status="DELIVERED"))


def test_order_cancellation_releases_stock_back(db_session):
    db, tenant_id, product_id = db_session
    service = OrderService(db)

    create_dto = OrderCreateDTO(
        items=[
            OrderItemDTO(
                product_id=product_id,
                name="سماعة اختبار",
                price=1000.0,
                quantity=4,
                total=4000.0,
            )
        ],
        shipping_address=ShippingAddressDTO(
            full_name="عميل تجريبي",
            phone="01012345678",
            city="Cairo",
            governorate="Cairo",
            address="شارع التحرير، الدقي",
        ),
        payment_method="CARD",
    )

    order = service.place_order(tenant_id=tenant_id, dto=create_dto)
    prod = db.query(Product).filter_by(id=product_id).first()
    assert prod.stock_qty == 6  # 10 - 4

    # Cancel order -> stock must be released back
    service.update_order_status(tenant_id, order.id, OrderStatusUpdateDTO(status="CANCELLED", note="Customer requested cancellation"))
    assert order.status == "CANCELLED"

    db.refresh(prod)
    assert prod.stock_qty == 10
