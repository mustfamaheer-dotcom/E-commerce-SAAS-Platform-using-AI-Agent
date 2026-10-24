# backend/tests/test_auth.py
"""Comprehensive Test Suite for JWT Authentication & RBAC."""
import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.db.database import SessionLocal
from backend.models.user import User
from backend.models.tenant import Tenant
from backend.core.security import decode_access_token

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_register_and_jwt_issuance(client):
    test_email = f"merchant_{uuid.uuid4().hex[:6]}@techzone.eg"
    test_password = "SecurePassword@123"
    test_name = "عادل أحمد"
    test_store = "متجر عادل للإلكترونيات"

    resp = client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": test_password,
        "full_name": test_name,
        "phone": "+20 100 999 8888",
        "store_name": test_store,
        "business_type": "electronics",
    })

    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_email
    assert data["user"]["role"] == "owner"
    assert data["store"]["name"] == test_store

    # Verify JWT claims
    token = data["access_token"]
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == data["user"]["id"]
    assert payload["email"] == test_email
    assert payload["tenant_id"] == data["store"]["id"]
    assert payload["role"] == "owner"

    # Verify password was hashed and not saved in plaintext in DB
    db = SessionLocal()
    user_in_db = db.query(User).filter(User.email == test_email).first()
    assert user_in_db is not None
    assert user_in_db.password_hash != test_password
    assert user_in_db.password_hash.startswith("$2b$")
    db.close()


def test_register_duplicate_email_fails(client):
    test_email = f"dup_{uuid.uuid4().hex[:6]}@techzone.eg"
    payload = {
        "email": test_email,
        "password": "Password123!",
        "full_name": "مستخدم مكرر",
    }
    # First registration
    resp1 = client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    # Second registration should fail
    resp2 = client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 400
    assert "مسجل بالفعل" in resp2.json()["detail"]


def test_login_success_and_invalid_credentials(client):
    test_email = f"login_test_{uuid.uuid4().hex[:6]}@techzone.eg"
    test_password = "RealPassword#456"

    # Register
    client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": test_password,
        "full_name": "سارة ماهر",
    })

    # Test invalid password
    bad_resp = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "WrongPassword!",
    })
    assert bad_resp.status_code == 401

    # Test valid login
    good_resp = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": test_password,
    })
    assert good_resp.status_code == 200
    data = good_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_email


def test_get_current_user_me_endpoint(client):
    test_email = f"me_test_{uuid.uuid4().hex[:6]}@techzone.eg"
    test_password = "ValidPassword@789"

    reg_resp = client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": test_password,
        "full_name": "كريم فؤاد",
        "store_name": "متجر كريم",
    })
    token = reg_resp.json()["access_token"]

    # Request without token -> 401 Unauthorized
    resp_unauth = client.get("/api/v1/auth/me")
    assert resp_unauth.status_code == 401

    # Request with valid Bearer token -> 200 OK
    resp_auth = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp_auth.status_code == 200
    user_data = resp_auth.json()
    assert user_data["user"]["email"] == test_email
    assert user_data["store"]["name"] == "متجر كريم"

