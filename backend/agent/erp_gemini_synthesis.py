import sys
import json
import re
from typing import Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from backend.agent.llm_client import get_llm, extract_llm_text

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
            '  "stock": (الكمية بالمخزن كرقم صحيح أو 20 إن لم تذكر)\n'
            "}"
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
            }
    except Exception as ex:
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
        prompt = (
            f"أنت وكيل ERP ومستشار المتجر الذكي لمتجر '{store_name}'.\n"
            f"العملية المنفذة: {action_type}.\n"
            f"تفاصيل النتيجة: {json.dumps(action_data, ensure_ascii=False)}.\n"
            f"رسالة التاجر الأصلية: '{user_query}'.\n\n"
            "المطلوب:\n"
            "صياغة رد مهذب، ذكي، ومباشر بلهجة مصرية احترافية يشرح ما تم تنفيذه بالقيم المضبوطة ويشجع التاجر على الخطوة التالية في جملة أو جملتين فقط وبدون قوالب مسبقة الصنع."
        )
        resp = llm.invoke([HumanMessage(content=prompt)])
        ans = extract_llm_text(resp).strip()
        if ans and len(ans) > 10:
            return ans
    except Exception:
        pass
    return None
