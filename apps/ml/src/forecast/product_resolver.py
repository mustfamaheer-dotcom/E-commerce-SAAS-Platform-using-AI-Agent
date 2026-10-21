# apps/ml/src/forecast/product_resolver.py
"""Bilingual fuzzy product resolution for the forecasting tool and ML service."""
import re
from typing import Dict, List, Optional

from apps.ml.src.forecast.mock_store import PRODUCTS, get_product

SYNONYMS = {
    "سماعة": ["speaker"],
    "سماعات": ["speakers", "speaker", "headphone", "headphones"],
    "هيدفون": ["headphone", "headphones"],
    "ايربودز": ["airpods", "earbuds"],
    "بلوتوث": ["bluetooth"],
    "شاحن": ["charger"],
    "شواحن": ["chargers", "charger"],
    "كابل": ["cable"],
    "سلك": ["cable"],
    "جراب": ["case"],
    "كفر": ["case", "cover"],
    "باور": ["power", "bank"],
    "بانك": ["bank", "power"],
    "باوربانك": ["power", "bank"],
    "speaker": ["سماعة", "سماعات"],
    "speakers": ["سماعات"],
    "headphones": ["سماعات", "هيدفون"],
    "headphone": ["سماعة", "هيدفون"],
    "charger": ["شاحن"],
    "chargers": ["شواحن"],
    "cable": ["كابل", "سلك"],
    "case": ["جراب", "كفر"],
    "power": ["باور"],
    "bank": ["بانك"],
}

STOPWORDS = {
    "في", "من", "على", "عن", "هو", "هي", "كام", "كم", "وحدة", "وحدات", "الشهر", "الجاي",
    "الجديدة", "الجديد", "توقع", "متوقع", "مبيعات", "بيع", "هبيع", "المخزون", "مخزون",
    "the", "for", "of", "and", "how", "many", "units", "will", "sell", "sold", "next",
    "month", "week", "forecast", "sales", "stock", "inventory", "please",
}


def _normalize(text: str) -> str:
    text = str(text).lower().strip()
    text = text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = text.replace("ة", "ه").replace("ى", "ي")
    text = re.sub(r"[^\w\u0600-\u06FF]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _expanded_tokens(query: str) -> List[str]:
    tokens: List[str] = []
    normalized_synonyms = {_normalize(key): [_normalize(value) for value in values] for key, values in SYNONYMS.items()}
    for token in _normalize(query).split():
        if token in STOPWORDS:
            continue
        tokens.append(token)
        tokens.extend(normalized_synonyms.get(token, []))
    return tokens


def _token_matches(token: str, name_tokens: List[str]) -> bool:
    if token in name_tokens:
        return True
    if len(token) < 4:
        return False
    return any(name_token.startswith(token) or token.startswith(name_token) for name_token in name_tokens)


def _score_product(query: str, query_tokens: List[str], product: Dict) -> float:
    product_id = str(product["product_id"]).lower()
    sku = str(product["sku"]).lower()
    name = _normalize(product["name"])
    name_tokens = name.split()

    if _normalize(query) in (product_id, sku):
        return 1.0
    if _normalize(query) and _normalize(query) in name:
        return 0.9 + min(0.09, len(_normalize(query)) / max(len(name), 1) * 0.1)

    if not query_tokens:
        return 0.0

    matched = sum(1 for token in set(query_tokens) if _token_matches(token, name_tokens))
    coverage = matched / max(len(set(query_tokens)), 1)

    category = _normalize(product.get("category", ""))
    category_bonus = 0.15 if category and category in query_tokens else 0.0
    brand_bonus = 0.05 if any(brand in name for brand in ("jbl", "anker", "sony", "apple", "samsung", "baseus", "spigen", "joyroom")) and any(
        brand in query_tokens for brand in ("jbl", "anker", "sony", "apple", "samsung", "baseus", "spigen", "joyroom")
    ) else 0.0

    return min(0.98, coverage * 0.95 + category_bonus + brand_bonus)


def resolve_product(query: str, tenant_id: str = "tenant-demo-01") -> Dict:
    """
    Resolve a product reference to an id.

    Returns {"status": "resolved" | "ambiguous" | "not_found", "product": {...} | None,
    "candidates": [...]}.
    """
    direct = get_product(product_id=str(query).strip(), sku=str(query).strip())
    if direct:
        return {"status": "resolved", "product": direct, "candidates": [], "tenant_id": tenant_id}

    query_tokens = _expanded_tokens(query)
    scored = []
    for product in PRODUCTS:
        score = _score_product(query, query_tokens, product)
        if score > 0:
            scored.append((score, product))

    scored.sort(key=lambda item: item[0], reverse=True)
    candidates = [
        {
            "product_id": product["product_id"],
            "sku": product["sku"],
            "name": product["name"],
            "score": round(score, 3),
        }
        for score, product in scored[:5]
        if score >= 0.30
    ]

    if not candidates:
        return {"status": "not_found", "product": None, "candidates": [], "tenant_id": tenant_id}

    top_score = scored[0][0]
    second_score = scored[1][0] if len(scored) > 1 else 0.0
    if top_score < 0.55 or (top_score - second_score) < 0.08:
        return {"status": "ambiguous", "product": None, "candidates": candidates[:3], "tenant_id": tenant_id}

    best = get_product(product_id=scored[0][1]["product_id"])
    return {"status": "resolved", "product": best, "candidates": candidates[:3], "tenant_id": tenant_id}


def find_products(query: str) -> List[Dict]:
    query_tokens = _expanded_tokens(query)
    matches = [(product, _score_product(query, query_tokens, product)) for product in PRODUCTS]
    matches = [(product, score) for product, score in matches if score >= 0.30]
    matches.sort(key=lambda item: item[1], reverse=True)
    return [product for product, _ in matches]
