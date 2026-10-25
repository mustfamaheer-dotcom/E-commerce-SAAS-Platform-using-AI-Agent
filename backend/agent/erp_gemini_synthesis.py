import sys
import json
import re
from typing import Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from backend.agent.llm_client import get_llm, extract_llm_text
from backend.agent.training_dataset import format_few_shot_prompt

def extract_product_slots_with_gemini(raw_query: str) -> Optional[Dict[str, Any]]:
    llm = get_llm()
    if not llm:
        return None
    try:
        sys_prompt = (
            "أنت وكيل ذكي لإدارة الكتالوج ونظام الـ ERP.\n"
            "مهمتك استخراج بيانات إضافة المنتج بدقة من رسالة التاجر وإرجاع JSON صالح فقط بدون markdown:\n"
            "{\n"
            '  "name": "اسم المنتج الصافي والصحيح بدون كلمات مثل السعر أو الكمية أو الاسم",\n'
            '  "price": (السعر كرقم عشري أو صحيح),\n'
            '  "stock": (الكمية بالمخزن كرقم صحيح أو 20 إن لم تذكر),\n'
            '  "category": "اسم القسم أو null",\n'
            '  "image_url": "رابط الصورة أو null"\n'
            "}\n\n"
            "أمثلة:\n"
            "- 'السعر 300 الاسم ماوس الكميه 400 في قسم إكسسوارات' -> {\"name\": \"ماوس\", \"price\": 300, \"stock\": 400, \"category\": \"إكسسوارات\", \"image_url\": null}\n"
            "- 'سجللي كيبورد وايرلس بـ 1200 جنيه وفيه منه 30 حبة' -> {\"name\": \"كيبورد وايرلس\", \"price\": 1200, \"stock\": 30, \"category\": null, \"image_url\": null}"
        )
        resp = llm.invoke([SystemMessage(content=sys_prompt), HumanMessage(content=raw_query)])
        raw_text = extract_llm_text(resp).strip()
        if "```" in raw_text:
            m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
            if m:
                raw_text = m.group(1).strip()
        data = json.loads(raw_text)
        if data.get("name") and data.get("price") is not None:
            return {
                "name": str(data["name"]).strip(),
                "price": float(data["price"]),
                "stock": int(data.get("stock", 20)),
                "category": str(data["category"]).strip() if data.get("category") else None,
                "image_url": str(data["image_url"]).strip() if data.get("image_url") else None,
            }
    except Exception as ex:
        pass
    return None

def extract_category_slots_with_gemini(raw_query: str) -> Optional[Dict[str, Any]]:
    llm = get_llm()
    if not llm:
        return None
    try:
        sys_prompt = (
            "استخرج اسم القسم أو التصنيف التجاري من رسالة التاجر في JSON صالح فقط:\n"
            "{\"name\": \"اسم القسم الصافي بدون كلمات مثل قسم أو جديد أو تصنيف\"}"
        )
        resp = llm.invoke([SystemMessage(content=sys_prompt), HumanMessage(content=raw_query)])
        raw_text = extract_llm_text(resp).strip()
        if "```" in raw_text:
            m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
            if m:
                raw_text = m.group(1).strip()
        data = json.loads(raw_text)
        if data.get("name"):
            return {"name": str(data["name"]).strip()}
    except Exception:
        pass
    return None

def extract_price_update_slots_with_gemini(raw_query: str) -> Optional[Dict[str, Any]]:
    llm = get_llm()
    if not llm:
        return None
    try:
        sys_prompt = (
            "استخرج اسم المنتج أو كود الـ SKU والسعر الجديد من رسالة التاجر في JSON صالح:\n"
            "{\"name_or_sku\": \"اسم المنتج أو الكود\", \"price\": (السعر الجديد كرقم)}"
        )
        resp = llm.invoke([SystemMessage(content=sys_prompt), HumanMessage(content=raw_query)])
        raw_text = extract_llm_text(resp).strip()
        if "```" in raw_text:
            m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
            if m:
                raw_text = m.group(1).strip()
        data = json.loads(raw_text)
        if data.get("name_or_sku") and data.get("price") is not None:
            return {"name_or_sku": str(data["name_or_sku"]).strip(), "price": float(data["price"])}
    except Exception:
        pass
    return None

def extract_coupon_slots_with_gemini(raw_query: str) -> Optional[Dict[str, Any]]:
    llm = get_llm()
    if not llm:
        return None
    try:
        sys_prompt = (
            "استخرج بيانات إنشاء الكوبون الترويجي في JSON صالح:\n"
            "{\n"
            '  "code": "كود الكوبون بالإنجليزية أو العربية (مثل SAVE50 أو EID10)",\n'
            '  "type": "percent أو fixed",\n'
            '  "value": (قيمة الخصم كالنسبة المئوية أو المبلغ),\n'
            '  "min_order": (الحد الأدنى للطلب بالأرقام أو 0)\n'
            "}"
        )
        resp = llm.invoke([SystemMessage(content=sys_prompt), HumanMessage(content=raw_query)])
        raw_text = extract_llm_text(resp).strip()
        if "```" in raw_text:
            m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
            if m:
                raw_text = m.group(1).strip()
        data = json.loads(raw_text)
        val = data.get("value") if data.get("value") is not None else data.get("discount", data.get("discount_value"))
        if data.get("code") and val is not None:
            return {
                "code": str(data["code"]).strip().upper(),
                "type": "percentage" if str(data.get("type", "")).lower() in ["percentage", "percent"] else "fixed",
                "value": float(val),
                "min_order": float(data.get("min_order", data.get("min_order_amount", 0.0))),
            }
    except Exception:
        pass
    return None

def synthesize_erp_action_with_gemini(
    action_type: str,
    action_data: Dict[str, Any],
    user_query: str,
    store_name: str = "متجرك",
) -> Optional[str]:
    llm = get_llm()
    if not llm:
        return None
    try:
        few_shots = format_few_shot_prompt(role="merchant", limit=2)
        prompt = (
            f"أنت وكيل ERP ومستشار المتجر الذكي لمتجر '{store_name}'.\n"
            f"العملية المنفذة: {action_type}.\n"
            f"تفاصيل النتيجة من قاعدة البيانات: {json.dumps(action_data, ensure_ascii=False)}.\n"
            f"رسالة التاجر الأصلية: '{user_query}'.\n\n"
            f"{few_shots}\n"
            "المطلوب:\n"
            "صياغة رد استشاري مهذب، ذكي، ومباشر بلهجة مصرية احترافية يشرح ما تم تنفيذه بالقيم المضبوطة ويقترح على التاجر الخطوة التالية بذكاء (جملة أو جملتين فقط وبدون قوالب مسبقة الصنع)."
        )
        resp = llm.invoke([HumanMessage(content=prompt)])
        ans = extract_llm_text(resp).strip()
        if ans and len(ans) > 10:
            return ans
    except Exception:
        pass
    return None
