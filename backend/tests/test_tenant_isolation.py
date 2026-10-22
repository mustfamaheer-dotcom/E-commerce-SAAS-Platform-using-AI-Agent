# backend/tests/test_tenant_isolation.py
"""Multi-tenant isolation integration test suite based on python-testing-patterns."""
import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.db.database import get_db, SessionLocal
from backend.models import Tenant, AgentSession, AgentMessage, Product, Order

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def sample_tenants():
    db = SessionLocal()
    tenant_a_id = f"tenant-test-a-{uuid.uuid4().hex[:6]}"
    tenant_b_id = f"tenant-test-b-{uuid.uuid4().hex[:6]}"

    ta = Tenant(id=tenant_a_id, name="متجر ألفا", slug=f"alpha-{uuid.uuid4().hex[:4]}")
    tb = Tenant(id=tenant_b_id, name="متجر بيتا", slug=f"beta-{uuid.uuid4().hex[:4]}")
    db.add_all([ta, tb])
    db.commit()

    yield {"tenant_a": tenant_a_id, "tenant_b": tenant_b_id}

    # Cleanup
    db.query(AgentMessage).filter(AgentMessage.session_id.like("sess_test_%")).delete(synchronize_session=False)
    db.query(AgentSession).filter(AgentSession.tenant_id.in_([tenant_a_id, tenant_b_id])).delete(synchronize_session=False)
    db.query(Product).filter(Product.tenant_id.in_([tenant_a_id, tenant_b_id])).delete(synchronize_session=False)
    db.query(Order).filter(Order.tenant_id.in_([tenant_a_id, tenant_b_id])).delete(synchronize_session=False)
    db.query(Tenant).filter(Tenant.id.in_([tenant_a_id, tenant_b_id])).delete(synchronize_session=False)
    db.commit()
    db.close()


def test_agent_sessions_isolation(client, sample_tenants):
    tid_a = sample_tenants["tenant_a"]
    tid_b = sample_tenants["tenant_b"]

    # Store A creates a session
    resp_create = client.post("/api/v1/agent/sessions", json={
        "title": "جلسة سرية لمتجر ألفا",
        "tenant_id": tid_a
    })
    assert resp_create.status_code == 200
    sess_a_id = resp_create.json()["id"]

    # Store B lists sessions - should NOT contain Store A's session
    resp_list_b = client.get(f"/api/v1/agent/sessions?tenant_id={tid_b}")
    assert resp_list_b.status_code == 200
    sessions_b = resp_list_b.json()
    assert not any(s["id"] == sess_a_id for s in sessions_b)

    # Store A lists sessions - MUST contain Store A's session
    resp_list_a = client.get(f"/api/v1/agent/sessions?tenant_id={tid_a}")
    assert resp_list_a.status_code == 200
    sessions_a = resp_list_a.json()
    assert any(s["id"] == sess_a_id for s in sessions_a)

    # Store B attempts to fetch Store A's session history directly
    resp_detail_cross = client.get(f"/api/v1/agent/sessions/{sess_a_id}?tenant_id={tid_b}")
    assert resp_detail_cross.status_code == 200
    data = resp_detail_cross.json()
    # It must return empty isolated messages, not leaking Store A's data
    assert data["messages"] == []


def test_products_tenant_isolation(client, sample_tenants):
    tid_a = sample_tenants["tenant_a"]
    tid_b = sample_tenants["tenant_b"]
    prod_id = f"prod_test_{uuid.uuid4().hex[:8]}"

    # Create product for Tenant A
    db = SessionLocal()
    prod_a = Product(
        id=prod_id,
        tenant_id=tid_a,
        name_ar="منتج حصري لمتجر ألفا",
        slug=f"slug-prod-{uuid.uuid4().hex[:4]}",
        price=500.0,
        sku=f"SKU-A-{uuid.uuid4().hex[:4]}",
        stock_qty=10,
        is_active=True
    )
    db.add(prod_a)
    db.commit()
    db.close()

    # Query products for Tenant B
    resp_b = client.get(f"/api/v1/products?tenant_id={tid_b}")
    assert resp_b.status_code == 200
    products_b = resp_b.json()
    assert not any(p["id"] == prod_id for p in products_b)

    # Query products for Tenant A
    resp_a = client.get(f"/api/v1/products?tenant_id={tid_a}")
    assert resp_a.status_code == 200
    products_a = resp_a.json()
    assert any(p["id"] == prod_id for p in products_a)


def test_analytics_isolation(client, sample_tenants):
    tid_b = sample_tenants["tenant_b"]
    # Tenant B has no orders/products, summary should be clean zeroes
    resp = client.get(f"/api/v1/analytics/summary?tenant_id={tid_b}")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("total_orders", 0) == 0
    assert data.get("total_revenue", 0) == 0
