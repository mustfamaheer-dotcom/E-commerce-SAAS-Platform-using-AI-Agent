import re
from typing import List

def normalize_arabic(text: str) -> str:
    """Standardizes Arabic letters, removes tashkeel and punctuation."""
    tashkeel = re.compile(r"[\u064B-\u0652\u0670]")
    text = re.sub(tashkeel, "", text)

    # Standardize alef variants
    text = re.sub(r"[أإآ]", "ا", text)
    # Standardize ta marbouta
    text = re.sub(r"ة", "ه", text)
    # Standardize ya
    text = re.sub(r"ى", "ي", text)

    # Common business slang / Franco-Arabic normalization
    text = text.replace("توتال السيلز", "اجمالي المبيعات")
    text = text.replace("البرودكتس", "المنتجات")
    text = text.replace("الكاستمرز", "العملاء")
    text = text.replace("الانفنتوري", "المخزون")

    return re.sub(r"\s+", " ", text).strip()


def detect_domains(text: str) -> List[str]:
    """Detects likely business domains based on keywords in the prompt."""
    normalized = normalize_arabic(text).lower()
    domains = set()

    keywords = {
        "Sales": ["مبيعات", "اوردر", "طلب", "فاتورة", "ايراد", "دفع", "كوبون", "خصم", "سيلز"],
        "Production": ["منتج", "منتجات", "تصنيع", "مخزن", "مخزون", "بضاعة", "سماعة", "قطع"],
        "Purchasing": ["مورد", "موردين", "شراء", "توريد", "بوالص", "شحن"],
        "HumanResources": ["موظف", "موظفين", "مرتب", "مرتبات", "اجازة", "ادارة", "قسم"],
        "Person": ["عميل", "عملاء", "زبون", "زباين", "ايميل", "تليفون", "عنوان", "مدينة"],
    }

    for domain, kws in keywords.items():
        if any(kw in normalized for kw in kws):
            domains.add(domain)

    return list(domains) if domains else ["Sales"]
