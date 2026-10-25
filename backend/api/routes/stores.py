# backend/api/routes/stores.py
import os
import re
import uuid
import json
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from backend.db.database import get_db
from backend.models import Tenant, StoreSettings, ThemeConfig, User
from backend.services.logo_analyzer import analyze_logo_and_generate_theme
from backend.agent.llm_client import get_llm, extract_llm_text
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

router = APIRouter(prefix="/stores", tags=["Store Configuration"])


class OnboardingChatPayload(BaseModel):
    message: str
    step: int = 1
    store_data: Dict[str, Any]
    history: Optional[List[Dict[str, str]]] = None


def fallback_rule_based_onboarding(user_msg: str, curr_step: int, store_data: Dict[str, Any]) -> Dict[str, Any]:
    """Smart fallback state machine when LLM is unavailable or unconfigured."""
    lower = user_msg.lower().strip()
    updated_fields = {}

    if curr_step <= 1:
        # Extract store name and niche
        clean_name = user_msg
        name_match = re.search(r'(?:اسم\s+المتجر|اسمه|سميه|نسميه|اسم)\s*[:=]?\s*([A-Za-z0-9\u0600-\u06FF\s_&-]+)', user_msg)
        if name_match:
            clean_name = name_match.group(1).split(" في مجال")[0].split(" والمجال")[0].strip()
        else:
            prefixes = [r"^(?:عايز|عاوز|حابب|اريد|أريد|نفسي)\s+(?:اعمل|أعمل|انشئ|أنشئ|افتح|أفتح)\s*(?:متجر|ستور)?\s*", r"^(?:متجر|ستور|براند)\s*"]
            for p in prefixes:
                clean_name = re.sub(p, "", clean_name, flags=re.IGNORECASE).strip()

        # Niche detection
        niche = "إلكترونيات واكسسوارات"
        if any(k in lower for k in ["موبايل", "هواتف", "لابتوب", "كمبيوتر", "إلكترون", "سماعات", "شواحن"]):
            niche = "إلكترونيات وهواتف ذكية"
        elif any(k in lower for k in ["ملابس", "أزياء", "فاشون", "كاجوال", "أحذية"]):
            niche = "أزياء وملابس كاجوال"
        elif any(k in lower for k in ["عطور", "تجميل", "ميك اب", "بخور"]):
            niche = "عطور ومستحضرات تجميل"
        elif any(k in lower for k in ["منزل", "ديكور", "أثاث", "مفروشات"]):
            niche = "مستلزمات منزل وديكور"

        final_name = clean_name.split(" في مجال")[0].split(" والمجال")[0].strip() or "متجر التميز"
        updated_fields["storeName"] = final_name
        updated_fields["category"] = niche

        return {
            "status": "success",
            "reply": f"اسم رائع ومميز جداً: **'{final_name}'** في مجال **{niche}**! \n\nيلا ندخل على خطوة الشحن والتوصيل: **حابب نشحن لكافة محافظات مصر عبر بوسطة (Bosta Express) مع توصيل سريع خلال 24-48 ساعة؟**",
            "step": 2,
            "updated_fields": updated_fields,
            "quick_replies": [
                "جميع محافظات مصر عبر بوسطة (24-48 ساعة) ",
                "القاهرة والجيزة والإسكندرية فقط",
                "شحن فوري داخل القاهرة الكبرى ⚡"
            ],
            "show_preview": False
        }

    elif curr_step == 2:
        updated_fields["shippingScope"] = user_msg
        return {
            "status": "success",
            "reply": "تمام يا فندم، تم اعتماد نطاق وتكلفة الشحن بنجاح! \n\nنيجي بقى لبوابات الدفع: **تحب نفعل إيه في متجرك؟** (عندنا دعم مباشر لـ Paymob فيزا/ميزة، تحويل InstaPay فوري، كود فوري، والدفع عند الاستلام COD).",
            "step": 3,
            "updated_fields": updated_fields,
            "quick_replies": [
                "فعل جميع الطرق (Paymob + InstaPay + فوري + COD) ",
                "الدفع عند الاستلام (COD) فقط ",
                "Paymob كروت بنكية و InstaPay اللحظي فقط"
            ],
            "show_preview": False
        }

    elif curr_step == 3:
        if "cod" in lower or "عند الاستلام فقط" in lower:
            gateways = ["الدفع عند الاستلام (COD)"]
        elif "فعل جميع الطرق" in user_msg or "الكل" in user_msg:
            gateways = ["Paymob (فيزا/ميزة)", "InstaPay (تحويل فوري)", "فوري", "الدفع عند الاستلام (COD)"]
        else:
            gateways = ["Paymob (فيزا/ميزة)", "InstaPay (تحويل فوري)", "الدفع عند الاستلام (COD)"]
        updated_fields["paymentGateways"] = gateways
        return {
            "status": "success",
            "reply": "ممتاز جداً!  تم ضبط بوابات الدفع وفقاً لاختيارك.\n\nآخر خطوة سريعة لمظهر متجرك: **تحب الواجهة تكون بالوضع الليلي الفخم (Dark Mode) ولا الوضع النهاري الهادي (Light Mode)؟ ولونك المفضل إيه؟**",
            "step": 4,
            "updated_fields": updated_fields,
            "quick_replies": [
                "وضع ليلي فخم (Dark Mode) مع أزرق تقني ",
                "وضع نهاري هادي (Light Mode) مع بنفسجي عصري ☀️",
                "وضع ليلي (Dark Mode) مع أخضر زمردي "
            ],
            "show_preview": False
        }

    elif curr_step == 4:
        is_dark = "ليلي" in user_msg or "dark" in lower
        color = "#10b981" if "زمردي" in user_msg or "أخضر" in user_msg else ("#8b5cf6" if "بنفسجي" in user_msg else "#0ea5e9")
        updated_fields["themeMode"] = "dark" if is_dark else "light"
        updated_fields["primaryColor"] = color
        return {
            "status": "success",
            "reply": "تسلم يا غالي!  جهزتلك هوية متجرك بالكامل وقاعدة البيانات جاهزة للربط.\n\nراجع بطاقة المتجر أدناه، ودوس على **'إنشاء وإطلاق المتجر الآن'** للبدء فوراً!",
            "step": 5,
            "updated_fields": updated_fields,
            "quick_replies": [],
            "show_preview": True
        }

    return {
        "status": "success",
        "reply": "أنا جاهز دائماً لمساعدتك في تخصيص وتطوير متجرك!",
        "step": curr_step,
        "updated_fields": {},
        "quick_replies": [],
        "show_preview": curr_step >= 5
    }


@router.post("/onboarding/chat")
def onboarding_chat(payload: OnboardingChatPayload):
    """
    Intelligent LLM-powered store onboarding copilot.
    Uses Gemini to comprehend full conversation history, extract entities, answer questions,
    and guide the user through store setup concisely and flexibly.
    """
    user_msg = payload.message.strip()
    curr_step = payload.step
    store_data = payload.store_data or {}
    history = payload.history or []

    llm = get_llm()
    if not llm:
        return fallback_rule_based_onboarding(user_msg, curr_step, store_data)

    sys_prompt = f"""أنت "وكيل تيك زون الذكي لتأسيس المتاجر" (Store Builder Agent).
مهمتك مساعدة التاجر في إنشاء وتخصيص متجره الإلكتروني المصري بطريقة حوارية ذكية ومرنة وبالمصري.

الحالة الحالية لإعدادات المتجر:
- اسم المتجر (storeName): "{store_data.get('storeName', '')}"
- مجال المتجر (category): "{store_data.get('category', '')}"
- نطاق الشحن (shippingScope): "{store_data.get('shippingScope', 'جميع محافظات مصر عبر بوسطة (Bosta)')}"
- بوابات الدفع (paymentGateways): {store_data.get('paymentGateways', ['Paymob', 'InstaPay', 'فوري', 'الدفع عند الاستلام'])}
- مظهر وهوية المتجر (themeMode): "{store_data.get('themeMode', 'dark')}"
- الخطوة الحالية (currentStep): {curr_step} (1=الاسم والمجال, 2=الشحن والتوصيل, 3=بوابات الدفع, 4=المظهر والستايل, 5=المعاينة والإطلاق)

القواعد الإلزامية:
1. اقرأ سجل المحادثة كامل وافهم نية المستخدم بدقة:
   - لو المستخدم في الخطوة 1 وقدم اسم المتجر أو مجاله: استخرج storeName و category وانقله فوراً للخطوة 2 واسأله عن الشحن والتوصيل.
   - لو طلب تعديل الاسم: حدّث storeName واشكره وأكد الاسم الجديد.
   - لو جاوب على الشحن: سجّل shippingScope وانقله للخطوة 3 (الدفع).
   - لو جاوب على الدفع: سجّل paymentGateways وانقله للخطوة 4 (المظهر).
   - لو جاوب على المظهر: سجّل themeMode وانقله للخطوة 5 (المعاينة).
2. اجعل ردك موجزاً، دقيقاً، ومباشراً (1 إلى 2 جملة بحد أقصى) وبلهجة مصرية احترافية ذكية.
3. يجب أن ترد بكائن JSON صالح فقط بدون أي Markdown خارجي أو نصوص زائدة:
{{
  "reply": "الرد المصري الذكي والموجز هنا",
  "next_step": 1 أو 2 أو 3 أو 4 أو 5,
  "updated_fields": {{
     // الحقول التي تم استخراجها أو تعديلها (storeName, category, shippingScope, paymentGateways, themeMode)
  }},
  "quick_replies": ["خيار 1", "خيار 2"],
  "show_preview": true/false
}}"""

    messages = [SystemMessage(content=sys_prompt)]
    for h in history[-8:]:
        role = h.get("sender") or h.get("role")
        content = h.get("text") or h.get("content", "")
        if content:
            if role == "user":
                messages.append(HumanMessage(content=content))
            else:
                messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=user_msg))

    try:
        res = llm.invoke(messages)
        raw_text = extract_llm_text(res)
        clean_json = raw_text.strip()
        if clean_json.startswith("```"):
            clean_json = clean_json.split("\n", 1)[1]
            if clean_json.endswith("```"):
                clean_json = clean_json.rsplit("```", 1)[0]
        parsed = json.loads(clean_json.strip())
        next_step = parsed.get("next_step", curr_step)
        if next_step == curr_step and curr_step < 5:
            next_step = curr_step + 1

        return {
            "status": "success",
            "reply": parsed.get("reply") or "تمام يا فندم معك، ننتقل للخطوة التالية.",
            "step": next_step,
            "updated_fields": parsed.get("updated_fields", {}),
            "quick_replies": parsed.get("quick_replies", []),
            "show_preview": parsed.get("show_preview", next_step >= 5)
        }
    except Exception as e:
        return fallback_rule_based_onboarding(user_msg, curr_step, store_data)


class StoreCreatePayload(BaseModel):
    name: str
    category: Optional[str] = "تجارة عامة وإلكترونيات"
    currency: Optional[str] = "EGP"
    owner_name: Optional[str] = None
    owner_email: str
    phone: Optional[str] = None
    governorate: Optional[str] = "القاهرة"
    theme_mode: Optional[str] = "dark"


class StoreUpdatePayload(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    business_sector: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    phone: Optional[str] = None
    governorate: Optional[str] = None
    shipping_zones: Optional[Dict[str, Any]] = None
    payment_gateways: Optional[Dict[str, Any]] = None
    social_links: Optional[Dict[str, Any]] = None
    socialLinks: Optional[Dict[str, Any]] = None


class ThemeUpdatePayload(BaseModel):
    mode: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None


@router.post("")
def create_store(payload: StoreCreatePayload, db: Session = Depends(get_db)):
    raw_slug = re.sub(r'[^a-zA-Z0-9]+', '-', payload.name.lower()).strip('-')
    if not raw_slug:
        raw_slug = "store"
    unique_suffix = uuid.uuid4().hex[:6]
    slug = f"{raw_slug}-{unique_suffix}"
    tenant_id = f"tenant-{slug}"

    new_tenant = Tenant(
        id=tenant_id,
        slug=slug,
        name=payload.name,
        currency=payload.currency or "EGP",
        theme_config={"mode": payload.theme_mode or "dark"},
    )
    db.add(new_tenant)
    db.flush()

    settings = StoreSettings(
        tenant_id=tenant_id,
        display_name=payload.name,
        currency=payload.currency or "EGP",
        business_sector=payload.category or "electronics",
        contact_email=payload.owner_email.strip().lower(),
        contact_phone=payload.phone or "",
        governorate=payload.governorate or "القاهرة",
        shipping_zones={
            "default_rate": 45,
            "governorate": payload.governorate or "القاهرة",
            "carrier": "بوسطة (Bosta)"
        },
        payment_gateways={
            "cod": {"enabled": True, "name": "الدفع عند الاستلام"},
            "paymob": {"enabled": True, "name": "Paymob (بطاقات بنكية وميزة)"},
            "instapay": {"enabled": True, "name": "InstaPay (تحويل لحظي)"},
            "fawry": {"enabled": True, "name": "Fawry (كود دفع فوري)"},
        }
    )
    db.add(settings)

    theme = ThemeConfig(
        tenant_id=tenant_id,
        mode=payload.theme_mode or "dark",
        primary_color="#0ea5e9",
        secondary_color="#6366f1",
        accent_color="#10b981",
        font_family="Cairo, sans-serif",
    )
    db.add(theme)

    email_clean = payload.owner_email.strip().lower()
    user = db.query(User).filter_by(email=email_clean).first()
    if not user:
        user = User(
            id=f"usr_{tenant_id}_owner",
            tenant_id=tenant_id,
            email=email_clean,
            full_name=payload.owner_name or payload.name,
            phone=payload.phone or "",
            role="owner",
        )
        db.add(user)
    else:
        user.tenant_id = tenant_id

    db.commit()
    db.refresh(new_tenant)

    # Auto-seed the newly created tenant from demo catalog & ERP transactions
    try:
        from backend.services.tenant_seeder import seed_tenant_from_demo
        seed_tenant_from_demo(db, target_tenant_id=tenant_id, source_tenant_id="tenant-moustafa-tech")
    except Exception as exc:
        print(f"Warning: Auto-seeding tenant '{tenant_id}' failed: {exc}")

    return {
        "status": "success",
        "message": f"تم إنشاء المتجر '{new_tenant.name}' بنجاح",
        "store": {
            "id": new_tenant.id,
            "slug": new_tenant.slug,
            "name": new_tenant.name,
            "category": payload.category or "تجارة عامة",
            "currency": new_tenant.currency,
            "themeMode": payload.theme_mode or "dark",
            "createdAt": new_tenant.created_at.isoformat() if new_tenant.created_at else None,
            "adminUrl": f"/admin/{new_tenant.slug}",
            "storefrontUrl": f"/store/{new_tenant.slug}",
            "logoUrl": new_tenant.logo_url,
        },
    }


@router.get("")
def list_stores(owner_email: Optional[str] = None, db: Session = Depends(get_db)):
    if owner_email:
        email_clean = owner_email.strip().lower()
        if email_clean in ["owner@moustafatech.eg", "owner.1.1@-moustafa-tech--102.eg"]:
            tenants = db.query(Tenant).filter_by(id="tenant-moustafa-tech").all()
        else:
            setting_tenant_ids = [
                s.tenant_id
                for s in db.query(StoreSettings).filter(StoreSettings.contact_email.ilike(email_clean)).all()
            ]
            user_tenant_ids = [
                u.tenant_id
                for u in db.query(User).filter(User.email.ilike(email_clean)).all()
                if u.tenant_id
            ]
            allowed_ids = set(setting_tenant_ids + user_tenant_ids)
            if allowed_ids:
                tenants = db.query(Tenant).filter(Tenant.id.in_(allowed_ids)).all()
            else:
                tenants = []
    else:
        tenants = db.query(Tenant).filter_by(id="tenant-moustafa-tech").all()

    return [
        {
            "id": t.id,
            "slug": t.slug,
            "name": t.name,
            "category": "بيع أجهزة وإلكترونيات",
            "currency": t.currency or "EGP",
            "themeMode": "dark",
            "createdAt": t.created_at.isoformat() if t.created_at else None,
            "adminUrl": f"/admin/{t.slug}",
            "storefrontUrl": f"/store/{t.slug}",
            "logoUrl": t.logo_url,
        }
        for t in tenants
    ]


@router.get("/me")
def get_current_store(
    tenant_id: Optional[str] = "tenant-moustafa-tech",
    x_tenant_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    tid = x_tenant_id or tenant_id or "tenant-moustafa-tech"
    if tid == "all":
        tid = "tenant-moustafa-tech"

    tenant = db.query(Tenant).filter_by(id=tid).first()
    if not tenant:
        tenant = db.query(Tenant).filter_by(id="tenant-moustafa-tech").first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")

    settings = db.query(StoreSettings).filter_by(tenant_id=tenant.id).first()
    theme = db.query(ThemeConfig).filter_by(tenant_id=tenant.id).first()

    default_payment_gateways = {
        "cod": {"enabled": True, "name": "الدفع عند الاستلام"},
        "paymob": {"enabled": True, "name": "Paymob (بطاقات بنكية وميزة)"},
        "instapay": {"enabled": True, "name": "InstaPay (تحويل لحظي)"},
        "fawry": {"enabled": True, "name": "Fawry (كود دفع فوري)"},
    }

    return {
        "tenant": {
            "id": tenant.id,
            "slug": tenant.slug,
            "name": tenant.name,
            "currency": tenant.currency,
            "logoUrl": tenant.logo_url,
        },
        "settings": {
            "displayName": settings.display_name if settings else tenant.name,
            "currency": settings.currency if settings else "EGP",
            "businessSector": settings.business_sector if settings else "electronics",
            "contactEmail": settings.contact_email if settings else "",
            "contactPhone": settings.contact_phone if settings else "",
            "governorate": getattr(settings, "governorate", None) or (settings.shipping_zones.get("governorate") if settings and settings.shipping_zones else "القاهرة"),
            "shippingZones": settings.shipping_zones if settings else {"default_rate": 45, "governorate": "القاهرة"},
            "paymentGateways": settings.payment_gateways if (settings and settings.payment_gateways) else default_payment_gateways,
            "socialLinks": getattr(settings, "social_links", None) or {},
        },
        "theme": {
            "mode": theme.mode if theme else "dark",
            "primaryColor": theme.primary_color if theme else "#0ea5e9",
            "secondaryColor": theme.secondary_color if theme else "#6366f1",
            "accentColor": theme.accent_color if theme else "#10b981",
            "fontFamily": theme.font_family if theme else "Cairo, sans-serif",
            "logoUrl": theme.logo_url if theme else tenant.logo_url,
        },
    }


@router.put("/me")
def update_current_store(
    payload: StoreUpdatePayload,
    tenant_id: Optional[str] = "tenant-moustafa-tech",
    x_tenant_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    tid = x_tenant_id or tenant_id or "tenant-moustafa-tech"
    tenant = db.query(Tenant).filter_by(id=tid).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")

    settings = db.query(StoreSettings).filter_by(tenant_id=tid).first()
    if not settings:
        settings = StoreSettings(tenant_id=tid, display_name=tenant.name)
        db.add(settings)

    if payload.name:
        tenant.name = payload.name
        settings.display_name = payload.name
    if payload.currency:
        tenant.currency = payload.currency
        settings.currency = payload.currency
    if payload.business_sector:
        settings.business_sector = payload.business_sector
    if payload.contact_email:
        settings.contact_email = payload.contact_email
    phone_val = payload.phone or payload.contact_phone
    if phone_val is not None:
        settings.contact_phone = phone_val
    if payload.governorate:
        settings.governorate = payload.governorate
    if payload.shipping_zones:
        current_zones = dict(settings.shipping_zones or {})
        current_zones.update(payload.shipping_zones)
        if payload.governorate:
            current_zones["governorate"] = payload.governorate
        settings.shipping_zones = current_zones
    if payload.payment_gateways:
        settings.payment_gateways = payload.payment_gateways
    socials_data = payload.social_links if payload.social_links is not None else payload.socialLinks
    if socials_data is not None:
        settings.social_links = socials_data

    db.commit()
    return {
        "status": "success",
        "message": "تم تحديث إعدادات المتجر بنجاح",
        "store": {
            "name": tenant.name,
            "governorate": settings.governorate,
            "phone": settings.contact_phone,
        }
    }


@router.post("/me/logo")
async def upload_logo_and_generate_theme(
    file: UploadFile = File(...),
    tenant_id: Optional[str] = Query(None),
    x_tenant_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Analyzes uploaded logo, generates brand color palette, and persists to DB.
    """
    effective_tid = tenant_id or x_tenant_id or "tenant-moustafa-tech"

    allowed_types = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}
    content_type = file.content_type or ""
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="نوع الملف غير مدعوم. يرجى رفع ملف صورة PNG أو JPEG أو WebP فقط."
        )

    MAX_FILE_SIZE = 5 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="حجم الملف يتجاوز الحد الأقصى المسموح به (5 ميجابايت)."
        )

    theme_data = analyze_logo_and_generate_theme(contents)

    upload_dir = os.path.join(os.getcwd(), "backend", "static", "uploads", "logos")
    os.makedirs(upload_dir, exist_ok=True)
    safe_ext = allowed_types[content_type]
    safe_filename = f"{effective_tid}_{uuid.uuid4().hex[:8]}{safe_ext}"
    file_path = os.path.join(upload_dir, safe_filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    logo_url = f"/uploads/logos/{safe_filename}"

    theme = db.query(ThemeConfig).filter_by(tenant_id=effective_tid).first()
    if not theme:
        theme = ThemeConfig(tenant_id=effective_tid)
        db.add(theme)

    theme.primary_color = theme_data["primaryColor"]
    theme.secondary_color = theme_data["secondaryColor"]
    theme.accent_color = theme_data["accentColor"]
    theme.mode = theme_data["mode"]
    theme.logo_url = logo_url

    tenant = db.query(Tenant).filter_by(id=effective_tid).first()
    if tenant:
        tenant.logo_url = logo_url

    db.commit()

    return {
        "status": "success",
        "message": "تم تحليل الشعار بنجاح وتوليد لوحة ألوان الهوية البصرية.",
        "theme": {
            **theme_data,
            "logoUrl": logo_url,
        },
    }


@router.get("/me/theme")
def get_store_theme(
    tenant_id: Optional[str] = "tenant-moustafa-tech",
    x_tenant_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    tid = x_tenant_id or tenant_id or "tenant-moustafa-tech"
    if tid == "all":
        tid = "tenant-moustafa-tech"
    theme = db.query(ThemeConfig).filter_by(tenant_id=tid).first()
    if not theme:
        return {
            "mode": "dark",
            "primaryColor": "#0ea5e9",
            "secondaryColor": "#6366f1",
            "accentColor": "#10b981",
            "fontFamily": "Cairo, sans-serif",
            "logoUrl": None,
        }
    return {
        "mode": theme.mode,
        "primaryColor": theme.primary_color,
        "secondaryColor": theme.secondary_color,
        "accentColor": theme.accent_color,
        "fontFamily": theme.font_family,
        "logoUrl": theme.logo_url,
    }


@router.put("/me/theme")
def update_store_theme(
    payload: ThemeUpdatePayload,
    tenant_id: Optional[str] = "tenant-moustafa-tech",
    x_tenant_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    tid = x_tenant_id or tenant_id or "tenant-moustafa-tech"
    theme = db.query(ThemeConfig).filter_by(tenant_id=tid).first()
    if not theme:
        theme = ThemeConfig(tenant_id=tid)
        db.add(theme)

    if payload.mode:
        theme.mode = payload.mode
    if payload.primary_color:
        theme.primary_color = payload.primary_color
    if payload.secondary_color:
        theme.secondary_color = payload.secondary_color
    if payload.accent_color:
        theme.accent_color = payload.accent_color
    if payload.font_family:
        theme.font_family = payload.font_family

    db.commit()
    return {"status": "success", "message": "تم حفظ مظهر المتجر والخطوط بنجاح"}
