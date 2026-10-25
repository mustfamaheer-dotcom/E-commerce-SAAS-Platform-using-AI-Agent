# backend/agent/training_dataset.py
"""
Curated In-Context Few-Shot Training Dataset for TechZone E-Commerce & ERP AI Agents.
Provides grounded, real-world conversational examples in Egyptian Arabic and English
across both Merchant Admin (ERP) and Customer Storefront domains.
"""
from typing import List, Dict, Any

MERCHANT_TRAINING_EXAMPLES: List[Dict[str, Any]] = [
    {
        "user_query": "سجللي كيبورد وايرلس ميكانيكال بـ 1200 جنيه وفيه منه 30 حبة في المخزن",
        "intent": "add_product",
        "slots": {
            "name": "كيبورد وايرلس ميكانيكال",
            "price": 1200.0,
            "stock": 30
        },
        "ideal_response": "يا فندم سجلت كيبورد وايرلس ميكانيكال بنجاح بسعر 1,200.00 ج.م وكمية 30 حبة في المخزن. تحب نفعّل له كود خصم ترويجي لإطلاقه ولا نعدل صورته؟",
        "suggested_actions": ["عمل كود خصم", "تعديل صورة المنتج", "جرد النواقص"]
    },
    {
        "user_query": "ضيف قسم جديد اسمه إلكترونيات سيارات",
        "intent": "add_category",
        "slots": {
            "name": "إلكترونيات سيارات"
        },
        "ideal_response": "تمام يا فندم! أضفت قسم 'إلكترونيات سيارات' للكتالوج بنجاح. تقدر دلوقتي تضيف منتجات تحته مباشرة.",
        "suggested_actions": ["إضافة منتج للقسم", "عرض كل الأقسام"]
    },
    {
        "user_query": "عدل سعر ماوس خليه 280 جنيه",
        "intent": "update_price",
        "slots": {
            "name_or_sku": "ماوس",
            "price": 280.0
        },
        "ideal_response": "تم تعديل سعر 'ماوس' في الكتالوج بنجاح إلى 280.00 ج.م بدلاً من السعر السابق. المتجر تم تحديثه فوراً.",
        "suggested_actions": ["معاينة صفحة المتجر", "تقرير المبيعات"]
    },
    {
        "user_query": "اعمل خصم 15% على كل السماعات بس متخليش هامش الربح يقل عن 12%",
        "intent": "bulk_price",
        "slots": {
            "percent": -15.0,
            "category": "سماعات",
            "min_margin": 12.0
        },
        "ideal_response": "حسبتلك أثر الخصم (15% تخفيض): عدد المنتجات المتأثرة 14 منتجاً، ومتوسط هامش الربح بعد الخصم آمن بنسبة 18.5%. جهزتلك كارت المعاينة للاعتماد الفوري.",
        "suggested_actions": ["اعتماد الخصم", "إلغاء التعديل"]
    },
    {
        "user_query": "ايه النواقص اللي عندي في المخزن؟",
        "intent": "inventory_alerts",
        "slots": {},
        "ideal_response": "فحصت المستودع حالياً: عندك 3 منتجات وصلت للحد الأدنى (أقل من 5 قطع). أنصح بالتواصل مع المورد لإعادة الطلب فوراً لتجنب ضياع المبيعات.",
        "suggested_actions": ["طلب توريد جديد", "تعديل حد الأمان للمخزون"]
    },
    {
        "user_query": "اعمل كوبون خصم 50 جنيه اسمه SAVE50 للطلبات فوق 500",
        "intent": "create_coupon",
        "slots": {
            "code": "SAVE50",
            "type": "fixed",
            "value": 50.0,
            "min_order": 500.0
        },
        "ideal_response": "ألف مبروك! كوبون 'SAVE50' بقيمة خصم 50 ج.م على الطلبات من 500 ج.م فأكثر اتفعل وجاهز للاستخدام من عملائك في صفحة الدفع.",
        "suggested_actions": ["مشاركة الكوبون", "تحليل استخدام الكوبونات"]
    },
    {
        "user_query": "ايه اكتر منتج بيتباع عندي وبنكسب منه كام؟",
        "intent": "top_products",
        "slots": {},
        "ideal_response": "المنتج الأقوى مبيعاً عندك هو 'Asus TUF Gaming A15' بإجمالي مبيعات تتصدر الكتالوج، يليه لابتوب 'Asus Zenbook 14 OLED'. جهزتلك بطاقة التحليلات بالأرقام التفصيلية.",
        "suggested_actions": ["تقرير الأرباح الشامل", "توقع مبيعات الشهر القادم"]
    }
]

CUSTOMER_TRAINING_EXAMPLES: List[Dict[str, Any]] = [
    {
        "user_query": "عايز كيبورد وماوس مع بعض في حدود 700 جنيه",
        "intent": "search_products",
        "slots": {
            "keywords": ["كيبورد", "ماوس"],
            "max_price": 700.0
        },
        "ideal_response": "منور يا فندم! رشحتلك باقة متكاملة ممتازة: كيبورد إنجليزي (350 ج.م) + ماوس عالي الدقة (300 ج.م) بإجمالي 650 ج.م ومتاحين للشحن فوراً. تحب أضيفهالك للسلة؟",
        "suggested_actions": ["إضافة الباقة للسلة", "معرفة تفاصيل الشحن"]
    },
    {
        "user_query": "عندكم شاحن سريع للايفون؟",
        "intent": "search_products",
        "slots": {
            "keywords": ["شاحن", "ايفون"]
        },
        "ideal_response": "أهلاً بيك! متوفر عندنا شاحن Anker 735 GaN 65W معتمد وسريع جداً بضمان محلي. تحب تطلبه يوصلك خلال 24-48 ساعة؟",
        "suggested_actions": ["إضافة للسلة", "كابلات شحن متوافقة"]
    },
    {
        "user_query": "كام مصاريف الشحن للإسكندرية وهيوصل امتى؟",
        "intent": "shipping_policy",
        "slots": {
            "city": "الإسكندرية"
        },
        "ideal_response": "الشحن للإسكندرية وباقي المحافظات بـ 65 ج.م بس عبر بوسطة اكسبريس وبيوصل خلال 2 إلى 3 أيام عمل، ولو طلبك عدى 1,000 ج.م الشحن بيكون مجاناً تماماً!",
        "suggested_actions": ["تصفح المنتجات", "تتبع شحنة سابقة"]
    },
    {
        "user_query": "فين طلبي ord_88192a؟",
        "intent": "track_order",
        "slots": {
            "order_id": "ord_88192a"
        },
        "ideal_response": "طلبك رقم ord_88192a تم تأكيده وجاري تجهيزه للشحن مع مندوب بوسطة. هتوصلك رسالة SMS ببوليصة التتبع فور انطلاق الشحنة.",
        "suggested_actions": ["تتبع بوليصة الشحن", "تعديل عنوان التوصيل"]
    },
    {
        "user_query": "لو المنتج طلع فيه عيب صناعة ايه موقفي؟",
        "intent": "return_policy",
        "slots": {},
        "ideal_response": "حقك مضمون 100% طبقاً لقانون حماية المستهلك المصري: استبدال مجاني فوري لأي عيب صناعة خلال 30 يوماً، أو استرجاع كامل المبلغ خلال 14 يوماً بدون أي مصاريف.",
        "suggested_actions": ["فتح طلب استبدال", "محادثة الدعم الفني"]
    }
]

def format_few_shot_prompt(role: str = "customer", limit: int = 3) -> str:
    """Formats relevant few-shot examples for system prompt augmentation."""
    if role not in ["customer", "merchant", "admin"]:
        return ""
    examples = CUSTOMER_TRAINING_EXAMPLES if role == "customer" else MERCHANT_TRAINING_EXAMPLES
    selected = examples[:limit]
    
    formatted = "## 💡 أمثلة تدريبية لطريقة الفهم والصياغة الذكية (Few-Shot Demonstrations):\n"
    for idx, ex in enumerate(selected, 1):
        formatted += (
            f"مثال {idx}:\n"
            f"- استفسار المستخدم: \"{ex['user_query']}\"\n"
            f"- طريقة الرد المثالية: \"{ex['ideal_response']}\"\n"
        )
    return formatted

def get_training_dataset(role: str = "all") -> Dict[str, Any]:
    """Retrieves full training dataset and metadata."""
    if role == "merchant":
        return {"role": "merchant", "count": len(MERCHANT_TRAINING_EXAMPLES), "examples": MERCHANT_TRAINING_EXAMPLES}
    elif role == "customer":
        return {"role": "customer", "count": len(CUSTOMER_TRAINING_EXAMPLES), "examples": CUSTOMER_TRAINING_EXAMPLES}
    return {
        "role": "all",
        "total_count": len(MERCHANT_TRAINING_EXAMPLES) + len(CUSTOMER_TRAINING_EXAMPLES),
        "merchant_count": len(MERCHANT_TRAINING_EXAMPLES),
        "customer_count": len(CUSTOMER_TRAINING_EXAMPLES),
        "merchant_examples": MERCHANT_TRAINING_EXAMPLES,
        "customer_examples": CUSTOMER_TRAINING_EXAMPLES,
    }

def add_training_example(role: str, user_query: str, ideal_response: str, intent: str = "general", slots: Dict[str, Any] = None) -> Dict[str, Any]:
    """Adds a new in-context training example dynamically."""
    new_ex = {
        "user_query": user_query.strip(),
        "intent": intent.strip(),
        "slots": slots or {},
        "ideal_response": ideal_response.strip(),
        "suggested_actions": ["إجراء مقترح"],
    }
    if role == "customer":
        CUSTOMER_TRAINING_EXAMPLES.insert(0, new_ex)
    else:
        MERCHANT_TRAINING_EXAMPLES.insert(0, new_ex)
    return {"status": "success", "role": role, "example": new_ex}

def get_training_stats() -> Dict[str, Any]:
    """Returns metadata and statistics on active few-shot training."""
    import os
    return {
        "active_model": os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest"),
        "training_strategy": "In-Context Few-Shot Alignment & LLM Multi-Slot Extraction",
        "dialect": "Egyptian Arabic (Cairene/Alexandrian commerce conventions) + English",
        "merchant_examples_count": len(MERCHANT_TRAINING_EXAMPLES),
        "customer_examples_count": len(CUSTOMER_TRAINING_EXAMPLES),
        "total_active_examples": len(MERCHANT_TRAINING_EXAMPLES) + len(CUSTOMER_TRAINING_EXAMPLES),
        "supported_intents": [
            "add_product", "add_category", "update_price", "bulk_price",
            "inventory_alerts", "create_coupon", "top_products",
            "search_products", "track_order", "shipping_policy", "return_policy"
        ],
        "status": "ready",
    }

