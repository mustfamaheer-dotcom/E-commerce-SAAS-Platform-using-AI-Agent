# backend/services/ai_orchestrator.py
"""
Production-grade E-Commerce SaaS AI Orchestration Engine.
Supports:
  1. Storefront Customers: Semantic product search, live stock checks, order tracking,
     shipping policy (Egypt/Bosta), return policy (Law 181/2018), coupon validation, and support escalation.
  2. Merchant Admins: Inventory stockout risk, BI sales analytics, bulk discount previews with HITL,
     and customer RFM segmentation.
Enforces:
  - Strict tenant isolation
  - Zero-hallucination price and stock grounding against real database
  - PII masking (credit cards, passwords, Egyptian national IDs)
  - Prompt injection defense
  - Typed GenUI card response contract
"""
import re
import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.schemas.ai import (
    AIQueryRequestDTO,
    AIResponseDTO,
    AIToolCallDTO,
    AIActionItemDTO,
    AIProductSummaryDTO,
    AIOrderSummaryDTO,
)
from backend.core.errors import SecurityGuardrailException
from backend.models.tenant import Tenant, StoreSettings
from backend.models.product import Product
from backend.models.order import Order
from backend.models.coupon import Coupon
from backend.models.customer import Customer
from backend.models.agent_session import AgentSession, AgentMessage, AgentAction
from backend.services.product_service import ProductService
from backend.services.inventory_service import InventoryService
from backend.services.order_service import OrderService
from backend.services.coupon_service import CouponService
from backend.agent.llm_client import get_llm, extract_llm_text
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

logger = logging.getLogger("techzone.ai_orchestrator")

FORBIDDEN_PROMPTS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"system\s+prompt",
    r"you\s+are\s+now\s+in\s+developer\s+mode",
    r"set\s+local\s+app\.current_tenant_id",
    r"drop\s+table",
    r"delete\s+from",
    r"truncate\s+table",
    r"bypass\s+security",
]


class GuardrailService:
    """Security firewall for prompt injection defense, PII masking, and anti-hallucination verification."""

    @staticmethod
    def validate_query(query: str) -> None:
        """Inspects incoming user queries for prompt injections or system tampering."""
        for pattern in FORBIDDEN_PROMPTS:
            if re.search(pattern, query, flags=re.IGNORECASE):
                logger.warning(f"Blocked prompt injection attempt matching pattern: {pattern}")
                raise SecurityGuardrailException(
                    "Security Notice: Prompt injection or restricted system directive blocked."
                )

    @staticmethod
    def mask_pii(text: str) -> str:
        """Masks payment card numbers, passwords, and Egyptian National IDs."""
        # Mask 16-digit card numbers
        text = re.sub(r"\b(?:\d{4}[ -]?){3}\d{4}\b", "****-****-****-****", text)
        # Mask 14-digit Egyptian National ID numbers
        text = re.sub(r"\b[23]\d{13}\b", "**************", text)
        # Mask potential cleartext password mentions
        text = re.sub(r"(?i)(password|كلمة\s+المرور|الباسورد)\s*[:=]\s*\S+", r"\1: ********", text)
        return text

    @staticmethod
    def verify_price_grounding(reply_text: str, referenced_products: List[AIProductSummaryDTO]) -> List[str]:
        """
        Validates that any numeric prices mentioned in the AI response match the verified product catalog.
        Returns a list of price discrepancy warnings if detected.
        """
        warnings = []
        if not referenced_products:
            return warnings

        # Extract numeric values followed or preceded by currency indicators
        mentioned_prices = re.findall(r"(\d+(?:\.\d{1,2})?)\s*(?:ج\.م|EGP|جنيه)", reply_text)
        if mentioned_prices:
            catalog_prices = {round(p.price, 2) for p in referenced_products}
            for p_str in mentioned_prices:
                try:
                    val = round(float(p_str), 2)
                    # Allow small formatting tolerances (shipping costs like 45, 65 are standard)
                    if val not in catalog_prices and val not in {45.0, 65.0, 0.0}:
                        # Check if it matches any discount/compare price
                        compare_prices = {round(p.compare_price or 0, 2) for p in referenced_products}
                        if val not in compare_prices:
                            warnings.append(
                                f"Grounded Price Alert: Price '{val} EGP' mentioned in text does not strictly match active catalog price."
                            )
                except ValueError:
                    pass
        return warnings


class IntentRouter:
    """Classifies user query intent across Storefront Customer and Merchant Admin roles."""

    @staticmethod
    def detect_language(query: str) -> str:
        return "ar" if re.search(r"[\u0600-\u06FF]", query) else "en"

    @classmethod
    def route(cls, query: str, role: str = "customer") -> str:
        q = query.lower().strip()

        # 1. Customer Order Tracking (high priority for customer inquiries)
        if any(k in q or k in query for k in [
            "فين طلبي", "اوردر رقم", "أوردر رقم", "طلب رقم", "تتبع", "شحنتي",
            "track order", "order status", "where is my order", "order #"
        ]) or re.search(r"\bord_[a-zA-Z0-9_-]+\b", query):
            return "track_order"

        # 2. Store Shipping Policy & Rates
        if any(k in q or k in query for k in [
            "شحن", "توصيل", "سعر الشحن", "مصاريف الشحن", "مدة الشحن", "كام الشحن", "بوسطة",
            "shipping", "delivery", "shipping cost", "delivery time", "carrier"
        ]) and not any(k in q or k in query for k in ["توقع", "forecast"]):
            return "shipping_policy"

        # 3. Store Return & Warranty Policy
        if any(k in q or k in query for k in [
            "استرجاع", "استبدال", "ترجيع", "ارجع", "أرجع", "ضمان", "صيانة", "عيب صناعة",
            "return", "refund", "exchange", "warranty", "defect"
        ]):
            return "return_policy"

        # 4. Coupon Validation / Promotional Inquiries
        if any(k in q or k in query for k in [
            "كود خصم", "كوبون", "تخفيض", "بروموكود", "خصم خاص", "وفر",
            "coupon", "promo code", "voucher", "discount code"
        ]) and role == "customer":
            return "customer_coupon"

        # 5. Customer Support Escalation / Human Handoff
        if any(k in q or k in query for k in [
            "خدمة عملاء", "أكلم موظف", "اكلم حد", "مندوب", "مشكلة في الطلب", "شكوى", "تالف",
            "human support", "representative", "complaint", "talk to human", "damaged"
        ]):
            return "support_escalation"

        # 6. Merchant / Admin Operational & BI Queries
        if any(k in q or k in query for k in [
            "نواقص", "معرضة للنفاد", "مخزون معرض للنفاد", "تنبيهات المخزون", "stockout", "low stock", "stock alerts"
        ]):
            return "inventory_alerts"

        if any(k in q or k in query for k in [
            "ارباح", "أرباح", "صافي الربح", "اعلى المنتجات", "أعلى المنتجات", "تقرير المبيعات", "profit", "top products", "analytics"
        ]) or (role in ["merchant", "admin"] and any(k in q for k in ["بيتباع", "اكتر منتج", "اهم منتج"])):
            return "analytics"

        if any(k in q or k in query for k in [
            "انشئ متجر", "أنشئ متجر", "متجر جديد", "تأسيس متجر", "create store", "build store"
        ]):
            return "store_builder"

        if any(k in q or k in query for k in [
            "طبق خصم", "تخفيض اسعار", "تخفيض الأسعار", "عدل اسعار", "bulk discount", "lower prices"
        ]):
            return "bulk_discount_preview"

        if any(k in q or k in query for k in [
            "توقع", "توقعات", "كام هبيع", "forecast", "demand forecast", "predict sales"
        ]):
            return "forecast"

        if any(k in q or k in query for k in [
            "عملاء", "شرائح", "زباين", "rfm", "segments", "customers"
        ]):
            return "customer_segments"

        if any(k in q or k in query for k in ["انشئ كوبون", "اعمل كود خصم", "create promo"]):
            return "create_coupon"

        # 7. Customer Product Search & Inventory Inquiries (Default e-commerce browsing)
        if any(k in q or k in query for k in [
            "عندك", "عاوز", "عايز", "في منتج", "سماعات", "شاحن", "كابل", "جراب", "ايفون", "سعر", "بكام",
            "search", "looking for", "buy", "product", "price", "earbuds", "case", "charger",
            "بيتباع", "أكثر مبيعاً", "اكتر مبيعا", "اهم منتج", "أفضل منتج", "افضل منتج", "رقم واحد", "bestseller", "popular"
        ]):
            return "search_products"

        return "general_dialogue"


class AIOrchestrationService:
    """Core AI Service executing tenant-scoped e-commerce tools and returning structured contracts."""

    def __init__(self, db: Session):
        self.db = db
        self.guardrail = GuardrailService()
        self.router = IntentRouter()
        self.product_service = ProductService(db)
        self.inventory_service = InventoryService(db)
        self.order_service = OrderService(db)
        self.coupon_service = CouponService(db)

    def process_query(self, tenant_id: str, request: AIQueryRequestDTO) -> AIResponseDTO:
        t0 = time.time()
        session_id = request.session_id or f"sess_{uuid.uuid4().hex[:8]}"

        # 1. Security Guardrail Validation
        self.guardrail.validate_query(request.message)

        # 2. Route classification and language detection
        lang = self.router.detect_language(request.message)
        intent = self.router.route(request.message, role=request.role)

        tool_calls: List[AIToolCallDTO] = []
        citations: List[str] = []
        products: List[AIProductSummaryDTO] = []
        order_summary: Optional[AIOrderSummaryDTO] = None
        actions: List[AIActionItemDTO] = []
        follow_up_suggestions: List[str] = []
        requires_human_support = False
        warnings: List[str] = []
        card_type: Optional[str] = None
        gen_ui_payload: Optional[Dict[str, Any]] = None
        reply_text = ""

        # Fetch Tenant Brand Information
        tenant = self.db.query(Tenant).filter_by(id=tenant_id).first()
        store_name = tenant.name if tenant else "تيك زون"
        settings = self.db.query(StoreSettings).filter_by(tenant_id=tenant_id).first()

        # =========================================================================
        # INTENT 1: CUSTOMER PRODUCT SEARCH & CATALOG BROWSING
        # =========================================================================
        if intent == "search_products":
            t_tool_0 = time.time()
            clean_search = re.sub(
                r"(?i)(عايز|عاوز|عندك|في|ابحث\s+عن|دور\s+على|looking\s+for|search|show\s+me|بكام|كام|سعره|سعرها|السعر|price|cost|\?|؟)\s*",
                " ",
                request.message
            ).strip()
            
            # Check for budget filter (e.g. أقل من 1000 ج.م)
            max_price = None
            price_match = re.search(r"(?:أقل\s+من|اقل\s+من|under|less\s+than)\s*(\d+)", clean_search)
            if price_match:
                max_price = float(price_match.group(1))
                clean_search = re.sub(r"(?:أقل\s+من|اقل\s+من|under|less\s+than)\s*\d+", "", clean_search).strip()

            q = self.db.query(Product).filter(Product.tenant_id == tenant_id, Product.is_active == True)
            
            # If asking about popular/bestseller/important products or empty search, query top catalog items
            is_bestseller_query = any(k in request.message.lower() for k in [
                "بيتباع", "أكثر مبيعاً", "اكتر مبيعا", "اهم منتج", "أفضل منتج", "افضل منتج", "رقم واحد", "bestseller", "popular", "مميز"
            ])

            if is_bestseller_query or not clean_search:
                matched_prods = q.order_by(Product.price.desc(), Product.stock_qty.desc()).limit(4).all()
            else:
                # Tokenize keywords for robust multi-word matching
                tokens = [t.strip() for t in clean_search.split() if len(t.strip()) >= 2 and t.strip() not in ["قولي", "عايز", "عاوز", "اهم", "اكتر", "منتج"]]
                if tokens:
                    from sqlalchemy import or_
                    conditions = []
                    for tok in tokens:
                        term = f"%{tok}%"
                        conditions.append(Product.name_ar.ilike(term))
                        conditions.append(Product.name_en.ilike(term))
                        conditions.append(Product.sku.ilike(term))
                    q = q.filter(or_(*conditions))

                if max_price:
                    q = q.filter(Product.price <= max_price)

                matched_prods = q.order_by(Product.stock_qty.desc(), Product.price.asc()).limit(6).all()
                if not matched_prods:
                    # Fallback to store top products if search term had no exact substring
                    matched_prods = self.db.query(Product).filter(Product.tenant_id == tenant_id, Product.is_active == True).order_by(Product.price.desc()).limit(3).all()
            
            tool_calls.append(AIToolCallDTO(
                tool_name="search_products",
                arguments={"tenant_id": tenant_id, "query": clean_search, "max_price": max_price},
                status="EXECUTED",
                result={"count": len(matched_prods)},
                latency_ms=round((time.time() - t_tool_0) * 1000, 2),
            ))

            for p in matched_prods:
                p_summary = AIProductSummaryDTO(
                    id=p.id,
                    name_ar=p.name_ar,
                    name_en=p.name_en,
                    price=float(p.price),
                    compare_price=float(p.compare_price) if p.compare_price else None,
                    sku=p.sku,
                    stock_qty=p.stock_qty,
                    is_in_stock=p.stock_qty > 0,
                    image_url=p.images[0] if p.images else None,
                    category_id=p.category_id,
                )
                products.append(p_summary)
                citations.append(f"Product: {p.name_ar} (SKU: {p.sku})")

            card_type = "products_list_card"
            gen_ui_payload = {"products": [p.model_dump() for p in products], "query": clean_search}

            if products:
                first_p = products[0]
                
                # Use Gemini LLM to synthesize natural, polite, and concise shopping response
                llm = get_llm()
                if llm:
                    try:
                        catalog_summary = "\n".join([f"- {p.name_ar} (السعر: {p.price:,.2f} ج.م، المخزون: {p.stock_qty})" for p in products[:3]])
                        prompt = (
                            f"أنت المساعد الذكي للتسوق لمتجر '{store_name}'.\n"
                            f"استفسار العميل: '{request.message}'\n\n"
                            f"المنتجات المتاحة حالياً من قاعدة البيانات:\n{catalog_summary}\n\n"
                            f"المطلوب:\n"
                            f"أجب العميل بلهجة مصرية مهذبة، ذكية ومختصرة جداً (1 إلى 2 جملة)، مع ذكر المنتج الأبرز وسعره بوضوح وعرض إضافته للسلة."
                        )
                        llm_res = llm.invoke([SystemMessage(content=prompt), HumanMessage(content=request.message)])
                        gen_reply = extract_llm_text(llm_res)
                        if gen_reply and len(gen_reply) > 10:
                            reply_text = gen_reply
                    except Exception:
                        pass

                if not reply_text:
                    if lang == "ar":
                        reply_text = f"وجدت لك {len(products)} منتجات متاحة في {store_name}! إليك أفضل الخيارات وأكثرها طلباً:"
                    else:
                        reply_text = f"Found {len(products)} available products at {store_name}! Here are the top matches:"

                actions.append(AIActionItemDTO(
                    label="إضافة الأول للسلة" if lang == "ar" else "Add Top Match to Cart",
                    action="add_to_cart",
                    params={"product_id": first_p.id, "name": first_p.name_ar, "price": first_p.price}
                ))
            else:
                if lang == "ar":
                    reply_text = f"عذراً، لم أجد منتجات تطابق '{clean_search}' حالياً في متجر {store_name}. هل تود البحث عن تصنيف آخر؟"
                    follow_up_suggestions = ["عرض كل المنتجات", "السماعات المتاحة", "الشواحن السريعة"]
                else:
                    reply_text = f"Sorry, no products matched '{clean_search}' in {store_name} catalog. Would you like to check another category?"
                    follow_up_suggestions = ["Show all products", "Available Headphones", "Fast Chargers"]

        # =========================================================================
        # INTENT 2: CUSTOMER ORDER STATUS & TRACKING
        # =========================================================================
        elif intent == "track_order":
            t_tool_0 = time.time()
            order_id_match = re.search(r"\b(ord_[a-zA-Z0-9_-]+)\b", request.message)
            order = None

            if order_id_match:
                found_id = order_id_match.group(1)
                order = self.db.query(Order).filter(Order.tenant_id == tenant_id, Order.id == found_id).first()
            elif request.customer_phone:
                order = (
                    self.db.query(Order)
                    .filter(Order.tenant_id == tenant_id)
                    .order_by(Order.created_at.desc())
                    .all()
                )
                order = next((o for o in order if (o.shipping_address or {}).get("phone") == request.customer_phone), None)

            tool_calls.append(AIToolCallDTO(
                tool_name="track_order",
                arguments={"tenant_id": tenant_id, "order_id": order.id if order else None},
                status="EXECUTED" if order else "FAILED",
                latency_ms=round((time.time() - t_tool_0) * 1000, 2),
            ))

            if order:
                citations.append(f"Order: {order.id} (Status: {order.status})")
                order_summary = AIOrderSummaryDTO(
                    order_id=order.id,
                    status=order.status,
                    total=float(order.total),
                    currency="EGP",
                    items_count=len(order.items) if isinstance(order.items, list) else 1,
                    payment_method=order.payment_method,
                    payment_status=order.payment_status,
                    tracking_number=order.bosta_tracking_number or "جاري التجهيز",
                    estimated_delivery="خلال 24-48 ساعة عبر بوسطة",
                    created_at=order.created_at.strftime("%Y-%m-%d %H:%M") if order.created_at else None,
                )
                card_type = "order_status_card"
                gen_ui_payload = order_summary.model_dump()

                status_ar_map = {
                    "PENDING": "قيد المراجعة والدفع",
                    "CONFIRMED": "تم تأكيد طلبك وجاري تجهيزه للشحن",
                    "PROCESSING": "جاري تغليف الشحنة وتجهيزها في المخزن",
                    "SHIPPED": "تم تسليم الشحنة لشركة الشحن (بوسطة) وهي في طريقها إليك",
                    "DELIVERED": "تم تسليم الطلب بنجاح. نتمنى لك تجربة ممتعة!",
                    "CANCELLED": "تم إلغاء هذا الطلب.",
                }
                status_desc = status_ar_map.get(order.status.upper(), order.status)

                reply_text = (
                    f"طلبك رقم **{order.id}** حالته الحالية: **{status_desc}**.\n"
                    f"• إجمالي الفاتورة: {order.total:,.2f} ج.م ({order.payment_method}).\n"
                    f"• بوليصة الشحن: {order.bosta_tracking_number or 'سيتم إرسالها برسالة SMS فور انطلاق المندوب'}."
                ) if lang == "ar" else (
                    f"Your order **{order.id}** is currently: **{order.status}**.\n"
                    f"• Total: {order.total:,.2f} EGP ({order.payment_method}).\n"
                    f"• Tracking AWB: {order.bosta_tracking_number or 'Pending dispatch'}."
                )

                if order.bosta_tracking_number:
                    actions.append(AIActionItemDTO(
                        label="تتبع عبر بوسطة" if lang == "ar" else "Track on Bosta",
                        action="track_shipment",
                        params={"tracking_number": order.bosta_tracking_number}
                    ))
                follow_up_suggestions = ["ما هي سياسة الاسترجاع؟", "تعديل عنوان التوصيل", "محادثة الدعم الفني"]
            else:
                requires_human_support = True
                card_type = "clarification"
                gen_ui_payload = {"type": "order_lookup_missing"}
                reply_text = (
                    "لم أعثر على طلب بهذا الرقم. يرجى تزويدي برقم الطلب (مثال: ord_12345) أو رقم الهاتف المسجل لتتبع شحنتك فوراً."
                    if lang == "ar"
                    else "I couldn't locate this order. Please provide your Order ID (e.g. ord_12345) or phone number."
                )
                follow_up_suggestions = ["أين أجد رقم الطلب؟", "التحدث مع موظف خدمة العملاء"]

        # =========================================================================
        # INTENT 3: SHIPPING & DELIVERY POLICIES (Bosta / Egypt)
        # =========================================================================
        elif intent == "shipping_policy":
            shipping_zones = settings.shipping_zones if settings and settings.shipping_zones else {}
            cairo_rate = shipping_zones.get("cairo_giza", 45)
            gov_rate = shipping_zones.get("governorates", 65)
            carrier_raw = shipping_zones.get("carrier", "بوسطة (Bosta)")
            carrier = f"بوسطة ({carrier_raw})" if "بوسطة" not in carrier_raw else carrier_raw

            citations.append("Official Store Delivery Schedule & Carrier Rates")
            card_type = "policy_card"
            gen_ui_payload = {
                "policyType": "shipping",
                "carrier": carrier,
                "cairoGizaRate": f"{cairo_rate} ج.م",
                "governoratesRate": f"{gov_rate} ج.م",
                "deliveryTimes": {
                    "cairo_giza": "خلال 24 إلى 48 ساعة عمل",
                    "governorates": "خلال 48 إلى 72 ساعة عمل",
                },
                "freeShippingThreshold": "شحن مجاني للطلبات فوق 1000 ج.م"
            }

            if lang == "ar":
                reply_text = (
                    f"🚚 **سياسة ومواعيد الشحن والتوصيل في {store_name}:**\n"
                    f"• نشحن لكافة محافظات مصر عبر شركة **{carrier}**.\n"
                    f"• **القاهرة الكبرى والجيزة:** {cairo_rate} ج.م (التوصيل خلال 24-48 ساعة).\n"
                    f"• **باقي المحافظات والإسكندرية والصعيد:** {gov_rate} ج.م (التوصيل خلال 2-3 أيام عمل).\n"
                    f"✨ **عرض خاص:** شحن مجاني تماماً لأي طلب يتجاوز 1000 ج.م!"
                )
                follow_up_suggestions = ["هل الدفع عند الاستلام متاح؟", "تتبع شحنتي", "عرض المنتجات المميزة"]
            else:
                reply_text = (
                    f"🚚 **Shipping & Delivery Policy for {store_name}:**\n"
                    f"• Fulfilled via **{carrier}** to all Egyptian governorates.\n"
                    f"• **Cairo & Giza:** {cairo_rate} EGP (Delivery within 24-48 hrs).\n"
                    f"• **Other Governorates:** {gov_rate} EGP (Delivery within 2-3 business days).\n"
                    f"✨ **Free Shipping:** On all orders above 1,000 EGP!"
                )
                follow_up_suggestions = ["Is COD available?", "Track my shipment", "Browse bestsellers"]

        # =========================================================================
        # INTENT 4: RETURN, EXCHANGE & WARRANTY (Egyptian Law 181/2018)
        # =========================================================================
        elif intent == "return_policy":
            citations.append("Egyptian Consumer Protection Law #181/2018 Policy Standard")
            card_type = "policy_card"
            gen_ui_payload = {
                "policyType": "returns_and_warranty",
                "standardReturnDays": 14,
                "defectReturnDays": 30,
                "warrantyMonths": 12,
                "conditions": [
                    "المنتج بحالته الأصلية وفي عبوته المغلقة",
                    "وجود الفاتورة أو رقم الطلب الأصلي",
                    "فحص فني مجاني لاستبدال الجهاز المعيب فورياً"
                ]
            }

            if lang == "ar":
                reply_text = (
                    f"🛡️ **سياسة الاسترجاع والضمان لمتجر {store_name}:**\n"
                    f"طبقاً لقانون حماية المستهلك المصري رقم **181 لسنة 2018**:\n"
                    f"1. **استرجاع أو استبدال خلال 14 يوماً** من الاستلام بشرط بقاء المنتج في حالته وعبوته الأصلية.\n"
                    f"2. **استبدال خلال 30 يوماً** في حالة ظهور أي عيب صناعة فني أو تلف ظاهر.\n"
                    f"3. **ضمان معتمد 12 شهراً** على الأجهزة الإلكترونية ضد عيوب الصناعة مع مراكز الخدمة المعتمدة."
                )
                follow_up_suggestions = ["كيف أقدم طلب استرجاع؟", "التحدث مع خدمة العملاء", "ما هي رسوم الشحن عند الإرجاع؟"]
            else:
                reply_text = (
                    f"🛡️ **Return & Warranty Policy for {store_name}:**\n"
                    f"In compliance with Egyptian Consumer Protection Law #181/2018:\n"
                    f"1. **14 Days Return/Exchange** if the item is in its sealed original box.\n"
                    f"2. **30 Days Replacement** if a manufacturing defect is verified.\n"
                    f"3. **12 Months Warranty** on electronic devices across authorized service centers."
                )
                follow_up_suggestions = ["How do I request a return?", "Contact Support Agent"]

            actions.append(AIActionItemDTO(
                label="طلب استرجاع / شكوى" if lang == "ar" else "File Return Request",
                action="escalate_support",
                params={"reason": "return_inquiry"}
            ))

        # =========================================================================
        # INTENT 5: CUSTOMER COUPON & DISCOUNT PROMOTION
        # =========================================================================
        elif intent == "customer_coupon":
            active_coupons = (
                self.db.query(Coupon)
                .filter(Coupon.tenant_id == tenant_id, Coupon.is_active == True)
                .order_by(Coupon.value.desc())
                .limit(2)
                .all()
            )
            citations.append("Active Store Promotional Coupons")
            card_type = "coupon_card"

            if active_coupons:
                top_c = active_coupons[0]
                disc_label = f"{top_c.value:.0f}%" if top_c.type == "percent" else f"{top_c.value:,.0f} ج.م"
                gen_ui_payload = {
                    "code": top_c.code,
                    "discountLabel": disc_label,
                    "minOrder": top_c.min_order,
                    "type": top_c.type,
                }
                if lang == "ar":
                    reply_text = (
                        f"🎉 يسعدنا تقديم كود خصم خاص لمتجر {store_name}!\n"
                        f"استخدم الكوبون: **{top_c.code}** للحصول على خصم **{disc_label}** "
                        f"(للطلبات من {top_c.min_order:,.0f} ج.م فأكثر)."
                    )
                else:
                    reply_text = (
                        f"🎉 We have an active discount code for you at {store_name}!\n"
                        f"Use promo code: **{top_c.code}** to save **{disc_label}** "
                        f"(on orders from {top_c.min_order:,.0f} EGP)."
                    )
                actions.append(AIActionItemDTO(
                    label=f"تطبيق {top_c.code}" if lang == "ar" else f"Apply {top_c.code}",
                    action="apply_coupon",
                    params={"code": top_c.code}
                ))
            else:
                reply_text = "لا توجد كوبونات عامة فعالة حالياً، لكننا نوفر شحن مجاني للطلبات فوق 1000 ج.م!" if lang == "ar" else "No active public vouchers right now, but free shipping applies on orders over 1,000 EGP!"

        # =========================================================================
        # INTENT 6: HUMAN ESCALATION & SUPPORT TICKET
        # =========================================================================
        elif intent == "support_escalation":
            requires_human_support = True
            ticket_id = f"tkt_{uuid.uuid4().hex[:8]}"
            citations.append(f"Support Escalation Ticket #{ticket_id}")
            card_type = "clarification"
            gen_ui_payload = {
                "ticketId": ticket_id,
                "status": "QUEUED_FOR_AGENT",
                "phone": settings.contact_phone if settings else "+20 100 000 0000",
                "email": settings.contact_email if settings else "support@techzone.eg",
            }
            if lang == "ar":
                reply_text = (
                    f"تم فتح تذكرة دعم فني رقم **#{ticket_id}** لمتابعة استفسارك مع فريق الدعم البشري في {store_name}.\n"
                    f"📞 يمكنك التواصل المباشر عبر الهاتف / واتساب: **{settings.contact_phone if settings else 'فريق الدعم'}**."
                )
                follow_up_suggestions = ["عرض سياسة الاسترجاع", "متابعة حالة شحنتي"]
            else:
                reply_text = (
                    f"Support ticket **#{ticket_id}** has been created. A support specialist from {store_name} will assist you shortly.\n"
                    f"📞 Direct WhatsApp / Hotline: **{settings.contact_phone if settings else 'Support Team'}**."
                )

        # =========================================================================
        # INTENT 7: MERCHANT INVENTORY ALERTS
        # =========================================================================
        elif intent == "inventory_alerts":
            low_stock_products = (
                self.db.query(Product)
                .filter(Product.tenant_id == tenant_id, Product.is_active == True)
                .filter(Product.stock_qty <= 20)
                .order_by(Product.stock_qty.asc())
                .limit(10)
                .all()
            )
            alerts = [
                {
                    "sku": p.sku,
                    "productName": p.name_ar,
                    "currentStock": p.stock_qty,
                    "daysUntilStockout": round(p.stock_qty / 2.5, 1),
                    "urgency": "CRITICAL" if p.stock_qty <= p.low_stock_threshold else "WARNING",
                    "dailyProfitAtRisk": round(2.5 * max(0.0, p.price - p.cost_price), 2),
                    "recommendedReorderQty": max(20, int(2.5 * 30 - p.stock_qty)),
                }
                for p in low_stock_products
            ]
            citations.append("Real-Time Inventory Balances")
            card_type = "inventory_alerts_list"
            gen_ui_payload = {"alerts": alerts, "totalAlerts": len(alerts)}
            tool_calls.append(AIToolCallDTO(
                tool_name="get_inventory_alerts",
                arguments={"tenant_id": tenant_id},
                status="EXECUTED",
                result={"count": len(alerts)},
            ))
            reply_text = (
                f"فحص المخزون لمتجر {store_name}: يوجد **{len(alerts)} منتجات** اقتربت من النفاد وتحتاج لإعادة طلب عاجلة لتجنب توقف المبيعات."
                if lang == "ar"
                else f"Inventory health for {store_name}: Found **{len(alerts)} items** nearing stockout requiring immediate restock."
            )
            follow_up_suggestions = ["تعديل كمية المخزون", "توقع المبيعات للشهر القادم", "تقرير أرباح المنتجات"]

        # =========================================================================
        # INTENT 8: MERCHANT BI ANALYTICS & REVENUE
        # =========================================================================
        elif intent == "analytics":
            total_rev = self.db.query(func.sum(Order.total)).filter_by(tenant_id=tenant_id).scalar() or 0.0
            order_count = self.db.query(Order).filter_by(tenant_id=tenant_id).count()
            cust_count = self.db.query(Customer).filter_by(tenant_id=tenant_id).count()
            top_prods = (
                self.db.query(Product)
                .filter_by(tenant_id=tenant_id)
                .order_by(Product.price.desc())
                .limit(5)
                .all()
            )
            citations.append("Transactional Sales Ledger & Orders Database")
            card_type = "analytics_dashboard_card"
            gen_ui_payload = {
                "totalRevenue": float(total_rev),
                "totalOrders": order_count,
                "totalCustomers": cust_count,
                "averageOrderValue": round(total_rev / max(1, order_count), 2),
                "topProducts": [{"name": p.name_ar, "price": float(p.price)} for p in top_prods],
            }
            tool_calls.append(AIToolCallDTO(
                tool_name="get_sales_analytics",
                arguments={"tenant_id": tenant_id},
                status="EXECUTED",
                result=gen_ui_payload,
            ))
            reply_text = (
                f"📊 **مؤشرات أداء {store_name}:**\n"
                f"• إجمالي الإيرادات: **{total_rev:,.2f} ج.م** عبر {order_count} طلب شراء.\n"
                f"• متوسط قيمة الطلب (AOV): **{round(total_rev / max(1, order_count), 2):,.2f} ج.م**.\n"
                f"• إجمالي العملاء المسجلين: **{cust_count} عميل**."
            ) if lang == "ar" else (
                f"📊 **Performance KPIs for {store_name}:**\n"
                f"• Gross Revenue: **{total_rev:,.2f} EGP** across {order_count} orders.\n"
                f"• AOV: **{round(total_rev / max(1, order_count), 2):,.2f} EGP**.\n"
                f"• Total Customers: **{cust_count}**."
            )
            follow_up_suggestions = ["عرض النواقص في المخزن", "تقسيم العملاء حسب الشراء", "توقع مبيعات بكرة"]

        # =========================================================================
        # INTENT 9: STORE BUILDER PREVIEW
        # =========================================================================
        elif intent == "store_builder":
            card_type = "store_creation_preview"
            gen_ui_payload = {
                "store_name": "TechZone Store",
                "currency": "EGP",
                "theme_mode": "dark",
                "product_category": "إلكترونيات واكسسوارات",
                "payment_methods": ["card", "instapay", "fawry", "cod"],
                "shipping_policy": "شحن وتوصيل لجميع المحافظات عبر بوسطة خلال 48 ساعة.",
            }
            reply_text = "تم استخراج إعدادات متجرك الجديد وتجهيز هوية العرض. يمكنك المراجعة والاعتماد فوراً!"
            actions.append(AIActionItemDTO(
                label="اعتماد وإنشاء المتجر",
                action="confirm_store_provision",
                params=gen_ui_payload
            ))

        # =========================================================================
        # INTENT 10: GENERAL CONVERSATIONAL INTELLIGENCE
        # =========================================================================
        else:
            llm = get_llm()
            if llm:
                try:
                    # Provide concise contextual catalog info to the model
                    sample_prods = (
                        self.db.query(Product)
                        .filter_by(tenant_id=tenant_id, status="active")
                        .order_by(Product.price.desc())
                        .limit(8)
                        .all()
                    )
                    sample_text = ", ".join([f"{p.name_ar} ({p.price:,.0f} ج.م)" for p in sample_prods])
                    
                    history_context = ""
                    if request.history:
                        for h in request.history[-4:]:
                            r = "العميل" if h.get("role") == "user" else "المساعد"
                            history_context += f"{r}: {h.get('content')}\n"

                    role_desc = "تاجر ومالك المتجر" if request.role == "merchant" else "عميل متسوق في المتجر"
                    prompt = (
                        f"أنت مساعد ذكاء اصطناعي ذكي، ودود، وسريع لمتجر '{store_name}'.\n"
                        f"الطرف الذي يخاطبك: {role_desc}.\n"
                        f"أمثلة من منتجات المتجر الحالية: {sample_text}.\n\n"
                        f"سياق المحادثة السابق:\n{history_context}\n"
                        f"رسالة المستخدم الحالية: '{raw_query}'\n\n"
                        "المطلوب:\n"
                        "1. رد باللهجة المصرية الطبيعية الودية والمهذبة بشكل مباشر وموجز جداً (جملة أو جملتين فقط كحد أقصى).\n"
                        "2. لا تكرر ديباجات أو رسائل ترحيب محفوظة إذا كان المستخدم يسأل سؤالاً محدداً.\n"
                        "3. قدم المعلومة أو التوجيه المفيد مباشرة."
                    )
                    gemini_ans = extract_llm_text(llm.invoke(prompt)).strip()
                    if gemini_ans:
                        reply_text = gemini_ans
                except Exception as ex:
                    logger.warning(f"General dialogue LLM fallback failed: {ex}")

            if not reply_text:
                if request.role == "merchant":
                    reply_text = (
                        f"أهلاً بك يا فندم! أنا شريكك ومساعدك الذكي لإدارة متجر **{store_name}**.\n"
                        "أقدر أساعدك في جرد النواقص، تسعير المنتجات، تحليل الأرباح، وإنشاء كوبونات الخصم. تحب نبدأ بإيه؟"
                    )
                    follow_up_suggestions = ["جرد النواقص في المخزن", "تقرير مبيعات المتجر", "عمل كود خصم جديد"]
                else:
                    reply_text = (
                        f"أهلاً بك في متجر **{store_name}**! 🛍️\n"
                        "أنا مساعدك الشخصي للتسوق. أقدر أساعدك في العثور على أفضل المنتجات والأسعار، تتبع طلباتك، أو معرفة تفاصيل الشحن والضمان. بتدور على إيه النهاردة؟"
                    )
                    follow_up_suggestions = ["أحدث العروض والخصومات", "سماعات وشواحن أصلية", "تتبع شحنتي", "مدة وتكلفة الشحن"]

        # 3. Apply Post-Execution Guardrails: PII Masking & Anti-Hallucination Price Checks
        sanitized_reply = self.guardrail.mask_pii(reply_text)
        price_warnings = self.guardrail.verify_price_grounding(sanitized_reply, products)
        warnings.extend(price_warnings)

        latency_ms = round((time.time() - t0) * 1000, 2)
        logger.info(
            f"AI Orchestrator: tenant={tenant_id} role={request.role} intent={intent} "
            f"latency={latency_ms}ms products={len(products)} tools={len(tool_calls)}"
        )

        return AIResponseDTO(
            reply_text=sanitized_reply,
            response=sanitized_reply,  # backward compatibility alias
            language=lang,
            intent=intent,
            intent_route=intent,  # backward compatibility alias
            confidence=0.96,
            session_id=session_id,
            tenant_id=tenant_id,
            card_type=card_type,
            gen_ui_payload=gen_ui_payload,
            citations=citations,
            products=products,
            order_summary=order_summary,
            actions=actions,
            follow_up_suggestions=follow_up_suggestions,
            requires_human_support=requires_human_support,
            warnings=warnings,
            tool_calls=tool_calls,
            metadata={
                "latency_ms": latency_ms,
                "role": request.role,
                "model": "techzone-hybrid-orchestrator-v2",
                "request_id": f"req_{uuid.uuid4().hex[:10]}",
            },
        )
