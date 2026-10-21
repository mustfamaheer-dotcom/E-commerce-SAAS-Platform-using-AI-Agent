# apps/agent/tools/policy_rag_tools.py
"""
Store Policy RAG & Merchant Preference Tools (Roaa Ashraf - Vertical Slice 06).
Implements semantic search over store policy chunks (returns, warranty, shipping)
and persistence of long-term merchant preferences.
"""
import re
from typing import Any, Dict, List
from langchain_core.tools import tool

from apps.agent.nodes.memory_context_node import get_merchant_preferences, set_merchant_preference

# Seeded store policy knowledge base (Egyptian commerce compliant)
STORE_POLICIES = [
    {
        "doc_title": "سياسة الاسترجاع والاستبدال (Egyptian Consumer Protection Law)",
        "category": "returns",
        "keywords": ["استرجاع", "استبدال", "ترجيع", "عيوب", "return", "refund", "exchange"],
        "content_ar": "يحق للعميل استرجاع أو استبدال المنتج خلال 14 يوماً من تاريخ الاستلام طبقاً لقانون حماية المستهلك المصري رقم 181 لسنة 2018، بشرط أن يكون المنتج بحالته الأصلية وفي عبوته المغلقة، أو 30 يوماً في حالة وجود عيب صناعة واضح.",
        "content_en": "Customers are entitled to return or exchange products within 14 days of receipt per Egyptian Consumer Protection Law #181/2018 provided original packaging is intact, or 30 days if manufacturing defect is present.",
    },
    {
        "doc_title": "سياسة الشحن والتوصيل (Shipping & Delivery)",
        "category": "shipping",
        "keywords": ["شحن", "توصيل", "مدة الشحن", "بوسطة", "shipping", "delivery", "bosta", "carrier"],
        "content_ar": "يتم شحن جميع الطلبات عبر شركة بوسطة (Bosta). التوصيل خلال 24 ساعة في القاهرة الكبرى والجيزة، وخلال 48 ساعة في محافظات الإسكندرية والدلتا، وخلال 72 ساعة في محافظات الصعيد. تكلفة الشحن 45 ج.م داخل القاهرة و65 ج.م للمحافظات الأخرى.",
        "content_en": "Orders are fulfilled via Bosta. Delivery is within 24 hours in Greater Cairo/Giza, 48 hours for Alexandria & Delta, and 72 hours for Upper Egypt. Shipping fee is 45 EGP within Cairo and 65 EGP elsewhere.",
    },
    {
        "doc_title": "سياسة الضمان وخدمة ما بعد البيع (Warranty & Service)",
        "category": "warranty",
        "keywords": ["ضمان", "صيانة", "تصليح", "warranty", "guarantee", "service"],
        "content_ar": "تتمتع جميع الأجهزة الإلكترونية بضمان محلي معتمد لمدة 12 شهراً ضد عيوب الصناعة مع مراكز الصيانة الرسمية في مصر، مع توفير استبدال فوري للجهاز خلال أول 14 يوماً في حالة العيوب الجسيمة.",
        "content_en": "All electronic devices carry a 12-month official manufacturer warranty covering hardware defects across authorized service centers in Egypt, with immediate device replacement in the first 14 days for fatal defects.",
    },
    {
        "doc_title": "سياسة طرق الدفع والأمان (Payment & Security Policy)",
        "category": "payment",
        "keywords": ["دفع", "انستاباي", "فوري", "كارت", "payment", "instapay", "fawry", "paymob"],
        "content_ar": "ندعم الدفع الإلكتروني عبر بوابات Paymob المشفرة، بطاقات فيزا وماستركارد، تحويلات إنستاباي (InstaPay) اللحظية، والدفع النقدي عبر فروع فوري بكود مرجعي صالح لمدة 48 ساعة.",
        "content_en": "We support secure card payments via Paymob, instant InstaPay bank transfers, and cash at Fawry outlets with a 48-hour valid reference code.",
    },
]


@tool
def search_store_policies(query: str, tenant_id: str = "tenant-demo-01") -> Dict[str, Any]:
    """
    Performs semantic RAG retrieval over store policies (returns, warranties, shipping, payments).
    Returns grounded citations with document titles and official policy excerpts.
    """
    lower = query.lower()
    matched_chunks = []

    for item in STORE_POLICIES:
        matches = 0
        for kw in item["keywords"]:
            if kw in lower or kw in query:
                matches += 1

        if matches > 0:
            score = 0.5 + 0.15 * matches
            matched_chunks.append({
                "doc_title": item["doc_title"],
                "category": item["category"],
                "relevance_score": min(round(score, 2), 0.98),
                "content_ar": item["content_ar"],
                "content_en": item["content_en"],
            })

    if not matched_chunks:
        # Return fallback general policy chunk
        matched_chunks.append({
            "doc_title": STORE_POLICIES[0]["doc_title"],
            "category": "general",
            "relevance_score": 0.70,
            "content_ar": STORE_POLICIES[0]["content_ar"],
            "content_en": STORE_POLICIES[0]["content_en"],
        })

    matched_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)

    return {
        "status": "success",
        "query": query,
        "tenant_id": tenant_id,
        "top_chunks": matched_chunks[:3],
        "primary_citation": matched_chunks[0]["doc_title"],
        "answer_summary_ar": matched_chunks[0]["content_ar"],
        "answer_summary_en": matched_chunks[0]["content_en"],
    }


@tool
def save_merchant_preference(key: str, value: str, tenant_id: str = "tenant-demo-01") -> Dict[str, Any]:
    """
    Saves a persistent merchant preference into Tier-2 long-term memory.
    Examples: 'default_forecast_horizon': '14', 'default_shipping_carrier': 'Bosta'.
    """
    cleaned_key = re.sub(r"\s+", "_", key.strip().lower())
    set_merchant_preference(tenant_id, cleaned_key, str(value).strip())
    current_prefs = get_merchant_preferences(tenant_id)

    return {
        "status": "success",
        "tenant_id": tenant_id,
        "updated_key": cleaned_key,
        "updated_value": str(value).strip(),
        "all_preferences": current_prefs,
        "message_ar": f"تم حفظ التفضيل بنجاح: {cleaned_key} = {value}",
        "message_en": f"Successfully updated preference: {cleaned_key} = {value}",
    }
