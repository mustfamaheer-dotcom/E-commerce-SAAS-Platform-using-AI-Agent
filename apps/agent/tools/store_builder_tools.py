# apps/agent/tools/store_builder_tools.py
import os
import re
import httpx
from typing import Dict, Any, List
from langchain_core.tools import tool

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "techzone-internal-service-secret")


def slugify(text: str) -> str:
    """Convert store name to safe URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or "store-online"


@tool
def create_store_tenant(
    name: str,
    currency: str = "EGP",
    theme: Dict[str, Any] = None,
    payment_methods: List[str] = None,
    shipping_policy: str = None,
    owner_email: str = "owner@techzone.eg",
) -> Dict[str, Any]:
    """
    Create a new isolated multi-tenant store in PostgreSQL with Row-Level Security.
    Requires Human-in-the-Loop (HITL) merchant approval before committing.

    Args:
        name: Name of the store (e.g. 'TechZone Accessories')
        currency: Store currency code (EGP, USD, SAR)
        theme: Dict with theme mode (dark/light), primaryColor hex, backgroundColor
        payment_methods: List of enabled gateways (e.g. ['cod', 'card', 'instapay'])
        shipping_policy: Store delivery policy description
        owner_email: Merchant admin email
    """
    slug = slugify(name)
    payload = {
        "slug": slug,
        "name": name,
        "currency": currency,
        "theme": theme or {
            "mode": "light",
            "primaryColor": "#4F46E5",
            "backgroundColor": "#F8FAFC",
        },
        "paymentMethods": payment_methods or ["cod", "card"],
        "shippingPolicy": shipping_policy or "Delivery to all regions within 3-5 business days.",
        "ownerEmail": owner_email,
    }

    try:
        response = httpx.post(
            f"{BACKEND_URL}/api/v1/tenants/provision",
            json=payload,
            headers={
                "Authorization": f"Bearer {SERVICE_TOKEN}",
                "x-tenant-id": "system-provisioning",
            },
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        return {
            "status": "error",
            "message": f"Backend rejected provisioning: {e.response.text}",
            "statusCode": e.response.status_code,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Network or provisioning connection failed: {str(e)}",
        }
