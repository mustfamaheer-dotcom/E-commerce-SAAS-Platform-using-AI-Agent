# backend/agent/answer_synthesizer.py
from typing import List, Dict, Any

def synthesize_answer_arabic(user_query: str, rows: List[Dict[str, Any]], chart_type: str) -> str:
    """Synthesizes a friendly merchant-oriented answer in Egyptian Arabic."""
    row_count = len(rows)
    if row_count == 0:
        return "لم يتم العثور على أي نتائج مطابقة لاستفسارك في قاعدة البيانات."

    if row_count == 1 and len(rows[0]) == 1:
        key, val = list(rows[0].items())[0]
        return f"القيمة المطلوبة لـ {key} هي: {val}."

    return f"تم استخراج {row_count} نتيجة بنجاح. تم تجهيز الرسم البياني التفاعلي من نوع ({chart_type}) لعرض التفاصيل."
