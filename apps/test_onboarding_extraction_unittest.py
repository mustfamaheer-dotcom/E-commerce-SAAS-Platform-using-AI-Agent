# apps/test_onboarding_extraction_unittest.py
import sys
import unittest

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from apps.agent.graphs.onboarding_graph import OnboardingState, extract_slots_node
from langchain_core.messages import HumanMessage


class TestArabicStoreOnboardingExtraction(unittest.TestCase):
    def test_user_screenshot_case(self):
        query = "عايز اخلي اسم المتجر بتاعي Adel Tech و تكون في مجال بيع الموبايلات و اللابتوبات"
        state = OnboardingState(messages=[HumanMessage(content=query)])
        res = extract_slots_node(state)
        slots = res["slots"]
        self.assertEqual(slots.store_name, "Adel Tech")
        self.assertEqual(slots.product_category, "إلكترونيات وهواتف ذكية ولابتوبات")
        self.assertEqual(slots.currency, "EGP")

    def test_techzone_dark_mode_case(self):
        query = "عايز أعمل متجر اكسسوارات موبايل اسمه تك زون بالوضع الليلي وبالجنيه المصري"
        state = OnboardingState(messages=[HumanMessage(content=query)])
        res = extract_slots_node(state)
        slots = res["slots"]
        self.assertEqual(slots.store_name, "تك زون")
        self.assertEqual(slots.currency, "EGP")
        self.assertEqual(slots.theme_mode, "dark")

    def test_fashion_niche_case(self):
        query = "نفسي أعمل براند أزياء شبابية كاجوال باسم شياكة ستور بالريال السعودي"
        state = OnboardingState(messages=[HumanMessage(content=query)])
        res = extract_slots_node(state)
        slots = res["slots"]
        self.assertEqual(slots.store_name, "شياكة ستور")
        self.assertEqual(slots.product_category, "أزياء وملابس كاجوال")
        self.assertEqual(slots.currency, "SAR")


if __name__ == "__main__":
    unittest.main()
