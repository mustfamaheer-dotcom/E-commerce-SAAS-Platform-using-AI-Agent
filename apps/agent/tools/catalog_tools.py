# apps/agent/tools/catalog_tools.py
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
import uuid

# --- Pydantic Schemas for Tool Inputs & Outputs ---

class SearchProductsInput(BaseModel):
    query: str = Field(..., description="Search keyword or product name (e.g. 'سماعات', 'charger', 'JBL')")
    category: Optional[str] = Field(None, description="Optional category filter (e.g. 'Speakers', 'Accessories')")
    min_stock: Optional[int] = Field(None, description="Minimum stock level in inventory")
    max_price: Optional[float] = Field(None, description="Maximum price filter in EGP/USD")


class InventoryAlertsInput(BaseModel):
    urgency_filter: Optional[Literal["CRITICAL", "WARNING", "ALL"]] = Field(
        "ALL", description="Filter by urgency level"
    )


class ProductUpdatePatch(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    stock_quantity: Optional[int] = None
    is_active: Optional[bool] = None


class UpdateProductInput(BaseModel):
    product_id: str = Field(..., description="UUID of the target product")
    fields: ProductUpdatePatch = Field(..., description="Fields to update on the product")


class CatalogFilter(BaseModel):
    category: Optional[str] = Field(None, description="Category filter (e.g. 'Speakers')")
    min_stock: Optional[int] = Field(None, description="Minimum inventory quantity filter (e.g. 50)")
    min_price: Optional[float] = Field(None, description="Minimum price filter")
    max_price: Optional[float] = Field(None, description="Maximum price filter")


class BulkUpdatePricesInput(BaseModel):
    category: Optional[str] = Field(None, description="Target category (e.g. 'Speakers', 'Accessories')")
    min_stock: Optional[int] = Field(None, description="Minimum stock threshold (e.g. 50)")
    discount_pct: float = Field(..., description="Percentage discount to apply (e.g. 15.0 for 15%)")


# --- In-Memory / Test Mock Catalog Store for Isolated & Integration Runs ---
MOCK_PRODUCTS_DB = [
    {
        "id": "prod_101",
        "sku": "SPK-JBL-01",
        "name": "JBL Flip 6 Waterproof Speaker",
        "category": "Speakers",
        "price": 5000.0,
        "cost": 3800.0,
        "stock": 72,
        "is_active": True,
    },
    {
        "id": "prod_102",
        "sku": "SPK-ANKER-02",
        "name": "Anker Soundcore Motion+ Bluetooth Speaker",
        "category": "Speakers",
        "price": 3200.0,
        "cost": 2100.0,
        "stock": 58,
        "is_active": True,
    },
    {
        "id": "prod_109",
        "sku": "SPK-MINI-09",
        "name": "Mini Bluetooth Pocket Speaker",
        "category": "Speakers",
        "price": 500.0,
        "cost": 450.0,  # At 15% discount -> 425 < 450 (Triggers Margin Safety Floor Warning!)
        "stock": 64,
        "is_active": True,
    },
    {
        "id": "prod_115",
        "sku": "CHG-65W-GAN",
        "name": "65W GaN Fast Wall Charger",
        "category": "Chargers",
        "price": 850.0,
        "cost": 400.0,
        "stock": 12,
        "is_active": True,
    },
    {
        "id": "prod_120",
        "sku": "CAB-USBC-2M",
        "name": "Braided USB-C to USB-C Cable 2M",
        "category": "Cables",
        "price": 250.0,
        "cost": 90.0,
        "stock": 4,  # Critical low stock!
        "is_active": True,
    },
]


BILINGUAL_SYNONYMS = {
    "سماعات": ["speakers", "speaker", "headphone", "headphones"],
    "سماعة": ["speaker", "speakers", "headphone"],
    "speakers": ["سماعات", "سماعة"],
    "speaker": ["سماعات", "سماعة"],
    "شاحن": ["charger", "chargers"],
    "شواحن": ["chargers", "charger"],
    "charger": ["شاحن", "شواحن"],
    "كابل": ["cable", "cables"],
    "سلك": ["cable", "cables"],
    "cable": ["كابل", "سلك"],
    "جراب": ["case", "cover"],
    "case": ["جراب", "كفر"],
}


def search_products_tool(
    query: str,
    category: Optional[str] = None,
    min_stock: Optional[int] = None,
    max_price: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """
    Search and filter products in the catalog without making modifications.
    Read-only operation: No Human-In-The-Loop approval needed.
    Supports MeiliSearch bilingual Arabic/English synonym expansion.
    """
    query_lower = query.lower().strip()
    synonyms = [query_lower]
    for k, v in BILINGUAL_SYNONYMS.items():
        if k in query_lower or query_lower in k:
            synonyms.extend([s.lower() for s in v])
    synonyms = list(set(synonyms))

    results = []
    for p in MOCK_PRODUCTS_DB:
        if not p["is_active"]:
            continue

        if query:
            p_text = f"{p['name']} {p['sku']} {p['category']}".lower()
            matched = any(syn in p_text for syn in synonyms)
            if not matched:
                continue

        if category and category.lower() not in p["category"].lower():
            continue
        if min_stock is not None and p["stock"] < min_stock:
            continue
        if max_price is not None and p["price"] > max_price:
            continue
        results.append(p)
    return results


def get_inventory_alerts_tool(urgency_filter: Optional[str] = "ALL") -> List[Dict[str, Any]]:
    """
    Retrieves inventory items requiring attention due to low stock, high stockout probability,
    or approaching reorder point.
    Read-only ML operation: No Human-In-The-Loop approval needed.
    """
    alerts = []
    for p in MOCK_PRODUCTS_DB:
        stock = p["stock"]
        unit_margin = max(0.0, p["price"] - p["cost"])
        daily_demand = 2.5
        dus = round(stock / daily_demand, 1)

        if stock <= 5:
            urgency = "CRITICAL"
        elif stock <= 20:
            urgency = "WARNING"
        else:
            urgency = "HEALTHY"

        if urgency_filter and urgency_filter != "ALL" and urgency != urgency_filter:
            continue

        if urgency in ("CRITICAL", "WARNING"):
            alerts.append({
                "sku": p["sku"],
                "product_name": p["name"],
                "category": p["category"],
                "current_stock": stock,
                "days_until_stockout": dus,
                "urgency": urgency,
                "daily_profit_at_risk": round(daily_demand * unit_margin, 2),
                "recommended_reorder_qty": max(30, int(daily_demand * 30 - stock)),
            })
    alerts.sort(key=lambda x: x["daily_profit_at_risk"], reverse=True)
    return alerts


def update_product_dry_run(product_id: str, fields: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepares a single product update diff for Human-In-The-Loop confirmation.
    """
    prod = next((p for p in MOCK_PRODUCTS_DB if p["id"] == product_id or p["sku"] == product_id), None)
    if not prod:
        return {"error": f"Product {product_id} not found"}

    before = dict(prod)
    after = dict(prod)
    for k, v in fields.items():
        if v is not None:
            after[k] = v

    new_price = float(after.get("price", prod["price"]))
    cost = float(after.get("cost", prod["cost"]))
    margin_warning = new_price < cost

    action_id = f"act_{uuid.uuid4()}"
    return {
        "actionId": action_id,
        "type": "SINGLE_PRODUCT_UPDATE",
        "productId": prod["id"],
        "sku": prod["sku"],
        "before": before,
        "after": after,
        "marginWarning": margin_warning,
        "status": "PENDING_CONFIRMATION",
    }


def bulk_update_prices_dry_run(
    category: Optional[str] = None,
    min_stock: Optional[int] = None,
    discount_pct: float = 0.0,
) -> Dict[str, Any]:
    """
    Dry-run computation for bulk discount.
    Returns structured diff table without committing changes to DB.
    """
    matching = []
    for p in MOCK_PRODUCTS_DB:
        if not p["is_active"]:
            continue
        if category and category.lower() not in p["category"].lower():
            continue
        if min_stock is not None and p["stock"] < min_stock:
            continue
        matching.append(p)

    preview_rows = []
    total_margin_before = 0.0
    total_margin_after = 0.0
    negative_margin_count = 0

    for p in matching:
        current_price = float(p["price"])
        cost = float(p["cost"])
        proposed_price = round(current_price * (1 - discount_pct / 100), 2)
        new_profit = round(proposed_price - cost, 2)
        margin_before = ((current_price - cost) / current_price) * 100 if current_price > 0 else 0
        new_margin = round(((proposed_price - cost) / proposed_price) * 100, 2) if proposed_price > 0 else 0
        margin_warning = proposed_price < cost

        total_margin_before += margin_before
        total_margin_after += new_margin
        if margin_warning:
            negative_margin_count += 1

        preview_rows.append({
            "productId": p["id"],
            "sku": p["sku"],
            "name": p["name"],
            "quantity": p["stock"],
            "cost": cost,
            "currentPrice": current_price,
            "proposedPrice": proposed_price,
            "newNetProfitPerUnit": new_profit,
            "newMarginPct": new_margin,
            "marginWarning": margin_warning,
        })

    total_skus = len(preview_rows)
    action_id = f"act_{uuid.uuid4()}"

    return {
        "actionId": action_id,
        "status": "PENDING_CONFIRMATION",
        "filterCriteria": {
            "category": category,
            "minStock": min_stock,
            "discountPct": discount_pct,
        },
        "summary": {
            "totalAffectedSkus": total_skus,
            "averageMarginBeforePct": round(total_margin_before / total_skus, 2) if total_skus else 0,
            "averageMarginAfterPct": round(total_margin_after / total_skus, 2) if total_skus else 0,
            "negativeMarginCount": negative_margin_count,
        },
        "previewRows": preview_rows,
    }
