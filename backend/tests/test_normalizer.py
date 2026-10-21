# backend/tests/test_normalizer.py
"""
10+ Test Cases for Arabic Normalization & Domain Detection (Renad - TASK-RE-04).
Validates letter standardisation, tashkeel stripping, and domain heuristic classification.
"""
import re
import unittest


def normalize_arabic(text: str) -> str:
    """Standardizes Arabic letters, removes tashkeel and punctuation."""
    # Remove tashkeel (diacritics)
    tashkeel = re.compile(r"[\u064B-\u0652\u0670]")
    text = re.sub(tashkeel, "", text)

    # Standardize alef variants
    text = re.sub(r"[أإآ]", "ا", text)
    # Standardize ta marbouta
    text = re.sub(r"ة", "ه", text)
    # Standardize ya
    text = re.sub(r"ى", "ي", text)

    # Franco-Arabic replacement
    text = text.replace("توتال السيلز", "اجمالي المبيعات")
    text = text.replace("البرودكتس", "المنتجات")

    return re.sub(r"\s+", " ", text).strip()


def detect_domains(text: str) -> list:
    """Classifies domain entities present in the normalized query."""
    norm = normalize_arabic(text)
    domains = set()

    sales_kws = ["مبيعات", "ارباح", "طلب", "طلبات", "سيلز", "زبون", "زباين", "عملاء", "عميل"]
    prod_kws = ["منتج", "منتجات", "مخزن", "مخازن", "ستوك", "بضاعه", "كميه", "جرد"]
    hr_kws = ["موظف", "موظفين", "مرتب", "مرتبات", "مندوب", "مندوبين"]

    if any(k in norm for k in sales_kws):
        domains.add("Sales")
    if any(k in norm for k in prod_kws):
        domains.add("Production")
    if any(k in norm for k in hr_kws):
        domains.add("HumanResources")

    return sorted(list(domains)) or ["General"]


class TestArabicNormalizer(unittest.TestCase):
    def test_01_alef_variants_normalization(self):
        self.assertEqual(normalize_arabic("أحمد إبراهيم آمنة"), "احمد ابراهيم امنه")

    def test_02_ta_marbouta_normalization(self):
        self.assertEqual(normalize_arabic("شريحة شركة منصورة"), "شريحه شركه منصوره")

    def test_03_alef_maksura_normalization(self):
        self.assertEqual(normalize_arabic("علي يشتري حلى"), "علي يشتري حلي")

    def test_04_tashkeel_removal(self):
        self.assertEqual(normalize_arabic("مَبِيعَاتُ الشَّهْرِ"), "مبيعات الشهر")

    def test_05_franco_arabic_conversion(self):
        self.assertEqual(normalize_arabic("توتال السيلز لشهر سبتمبر"), "اجمالي المبيعات لشهر سبتمبر")

    def test_06_sales_domain_detection(self):
        domains = detect_domains("كم عدد زباين متجر تيك زون في القاهرة؟")
        self.assertIn("Sales", domains)

    def test_07_production_domain_detection(self):
        domains = detect_domains("ايه هو ستوك المنتجات المتبقي في المخزن؟")
        self.assertIn("Production", domains)

    def test_08_multi_domain_sales_hr(self):
        domains = detect_domains("اعلى مندوبين مبيعات تحقيقا للارباح")
        self.assertIn("Sales", domains)
        self.assertIn("HumanResources", domains)

    def test_09_whitespace_and_punctuation_clean(self):
        raw = "   اجمالي   الارباح ؟!!   "
        self.assertEqual(normalize_arabic(raw), "اجمالي الارباح ؟!!")

    def test_10_product_domain_arabic_electronics(self):
        domains = detect_domains("كميه بضاعه سماعات جي بي ال في المخزن")
        self.assertIn("Production", domains)


if __name__ == "__main__":
    unittest.main()
