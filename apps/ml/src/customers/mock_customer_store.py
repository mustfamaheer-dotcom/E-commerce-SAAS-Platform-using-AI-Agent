# apps/ml/src/customers/mock_customer_store.py
"""Mock store providing tenant-scoped customer and order data for RFM segmentation."""
from typing import Dict, List, Optional
from packages.database.seed.seed_customers_rfm import generate_rfm_customer_pool

_MEM_STORE: Dict[str, Dict[str, List[Dict]]] = {}


def _get_tenant_data(tenant_id: str) -> Dict[str, List[Dict]]:
    if tenant_id not in _MEM_STORE:
        custs, ords, items = generate_rfm_customer_pool(tenant_id=tenant_id, customer_count=50)
        _MEM_STORE[tenant_id] = {
            "customers": custs,
            "orders": ords,
            "items": items,
        }
    return _MEM_STORE[tenant_id]


def list_tenant_customers(tenant_id: str) -> List[Dict]:
    return _get_tenant_data(tenant_id)["customers"]


def list_tenant_orders(tenant_id: str, status: Optional[str] = "PAID") -> List[Dict]:
    orders = _get_tenant_data(tenant_id)["orders"]
    if status:
        return [o for o in orders if o.get("status") == status]
    return orders
