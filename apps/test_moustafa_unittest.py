# Unit & Integration Tests for Moustafa's Slice
import os
import sys
import unittest
import pandas as pd

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from apps.agent.graphs.onboarding_graph import (
    OnboardingState,
    extract_slots_node,
    onboarding_router,
    ask_followup_node,
)
from apps.ml.src.catalog.cleaner import clean_catalog
from apps.ml.src.catalog.classifier import classify_catalog_categories
from langchain_core.messages import HumanMessage


class TestMoustafaSlice(unittest.TestCase):

    def test_agent_slot_extraction_arabic(self):
        state = OnboardingState(
            messages=[
                HumanMessage(
                    content="عايز أعمل متجر اكسسوارات موبايل اسمه تك زون بالوضع الليلي وبالجنيه المصري"
                )
            ]
        )
        result = extract_slots_node(state)
        slots = result["slots"]

        self.assertEqual(slots.currency, "EGP")
        self.assertEqual(slots.theme_mode, "dark")
        self.assertEqual(result["language"], "ar")

    def test_agent_slot_extraction_english(self):
        state = OnboardingState(
            messages=[
                HumanMessage(
                    content="I want to create a store called TechZone in dark mode with USD currency"
                )
            ]
        )
        result = extract_slots_node(state)
        slots = result["slots"]

        self.assertEqual(slots.currency, "USD")
        self.assertEqual(slots.theme_mode, "dark")
        self.assertEqual(result["language"], "en")

    def test_catalog_cleaning_and_deduplication(self):
        raw_df = pd.DataFrame([
            {"الاسم": "جراب حماية ضد الصدمات لايفون 15", "السعر": "220 ج.م", "الكمية": 50, "الكود": "SKU-CASE-1"},
            {"الاسم": "جراب حماية ضد الصدمات لايفون 15", "السعر": "220 ج.م", "الكمية": 50, "الكود": "SKU-CASE-1"},
            {"الاسم": "سماعة بلوتوث لاسلكية عازلة للضوضاء", "السعر": "950 EGP", "الكمية": 20},
            {"الاسم": "كابل شحن سريع تايب سي 2 متر", "السعر": "150", "الكمية": 100},
            {"الاسم": "ساعة رولكس اصلية مرصعة بالالماس", "السعر": "350000", "الكمية": 1},
        ])

        cleaned, stats = clean_catalog(raw_df)
        classified = classify_catalog_categories(cleaned)

        self.assertEqual(stats["duplicates_removed"], 1)
        self.assertEqual(stats["outliers_flagged"], 1)
        self.assertEqual(len(classified), 4)


if __name__ == "__main__":
    unittest.main()
