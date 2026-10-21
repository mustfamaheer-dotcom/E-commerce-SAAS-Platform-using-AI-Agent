# Implementation Verification Test - Moustafa Maher Slice
import os
import sys
import pandas as pd

# Fix Windows console UTF-8 encoding
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


def test_agent_arabic_slot_extraction():
    print("\n--- TEST 1: Agent Arabic Slot Extraction ---")
    state = OnboardingState(
        messages=[
            HumanMessage(
                content="عايز أعمل متجر اكسسوارات موبايل اسمه تك زون بالوضع الليلي وبالجنيه المصري"
            )
        ]
    )
    result = extract_slots_node(state)
    slots = result["slots"]
    print(f"Extracted Name: '{slots.store_name}'")
    print(f"Extracted Currency: '{slots.currency}'")
    print(f"Extracted Theme: '{slots.theme_mode}'")
    print(f"Detected Language: '{result['language']}'")
    print(f"Missing Slots: {result['missing_slots']}")

    assert slots.currency == "EGP", "Currency should be EGP"
    assert slots.theme_mode == "dark", "Theme should be dark"
    assert result["language"] == "ar", "Language should be detected as Arabic"
    print(">>> Agent Slot Extraction Test PASSED!")


def test_ml_catalog_cleaner_and_classifier():
    print("\n--- TEST 2: ML Catalog Ingestion & Classification ---")
    raw_df = pd.DataFrame([
        {"الاسم": "جراب حماية ضد الصدمات لايفون 15", "السعر": "220 ج.م", "الكمية": 50, "الكود": "SKU-CASE-1"},
        {"الاسم": "جراب حماية ضد الصدمات لايفون 15", "السعر": "220 ج.م", "الكمية": 50, "الكود": "SKU-CASE-1"}, # Duplicate
        {"الاسم": "سماعة بلوتوث لاسلكية عازلة للضوضاء", "السعر": "950 EGP", "الكمية": 20},
        {"الاسم": "كابل شحن سريع تايب سي 2 متر", "السعر": "150", "الكمية": 100},
        {"الاسم": "ساعة رولكس اصلية مرصعة بالالماس", "السعر": "350000", "الكمية": 1}, # Outlier
    ])

    cleaned, stats = clean_catalog(raw_df)
    classified = classify_catalog_categories(cleaned)

    print(f"Total Rows: {stats['total_rows']}, Cleaned Valid: {stats['valid_rows']}")
    print(f"Duplicates Removed: {stats['duplicates_removed']}")
    print(f"Outliers Flagged: {stats['outliers_flagged']}")
    print(f"Warnings: {stats['warnings']}")

    assert stats["duplicates_removed"] == 1, "Should remove exactly 1 duplicate"
    assert stats["outliers_flagged"] == 1, "Should detect 1 price outlier"
    assert len(classified) == 4, "Should have 4 unique products remaining"
    print(">>> ML Cleaner and Classifier Test PASSED!")


if __name__ == "__main__":
    test_agent_arabic_slot_extraction()
    test_ml_catalog_cleaner_and_classifier()
    print("\n==============================================")
    print("ALL TESTS FOR MOUSTAFA'S TASKS PASSED SUCCESSFULLY!")
    print("==============================================")
