# backend/tests/test_agent_power_training.py
"""Tests for AI Agent Power-Up: Training Dataset, Few-Shot Injections, Multi-Slot Extraction, and Budget Search."""
import pytest
from unittest.mock import patch, MagicMock

from backend.agent.training_dataset import (
    MERCHANT_TRAINING_EXAMPLES,
    CUSTOMER_TRAINING_EXAMPLES,
    format_few_shot_prompt,
)
from backend.agent.system_prompt import get_system_prompt
from backend.agent.erp_gemini_synthesis import (
    extract_product_slots_with_gemini,
    extract_category_slots_with_gemini,
    extract_price_update_slots_with_gemini,
    extract_coupon_slots_with_gemini,
    synthesize_erp_action_with_gemini,
)
from backend.services.ai_orchestrator import IntentRouter, AIOrchestrationService
from backend.schemas.ai import AIQueryRequestDTO
from backend.tests.test_ai_agent_comprehensive import agent_test_store


def test_training_datasets_structure():
    """Verify that both training datasets are well-populated and well-structured."""
    assert len(MERCHANT_TRAINING_EXAMPLES) >= 5
    assert len(CUSTOMER_TRAINING_EXAMPLES) >= 5

    for example in MERCHANT_TRAINING_EXAMPLES:
        assert "user_query" in example
        assert "intent" in example
        assert "slots" in example
        assert "ideal_response" in example

    for example in CUSTOMER_TRAINING_EXAMPLES:
        assert "user_query" in example
        assert "intent" in example
        assert "ideal_response" in example


def test_format_few_shot_prompt():
    """Test dynamic formatting and role routing."""
    merchant_prompt = format_few_shot_prompt("merchant", limit=3)
    assert "أمثلة تدريبية" in merchant_prompt
    assert "كيبورد وايرلس ميكانيكال" in merchant_prompt

    customer_prompt = format_few_shot_prompt("customer", limit=3)
    assert "أمثلة تدريبية" in customer_prompt
    assert "كيبورد وماوس" in customer_prompt

    empty_prompt = format_few_shot_prompt("non_existent_role")
    assert empty_prompt == ""


def test_system_prompt_includes_few_shots():
    """Verify that merchant and customer system prompts integrate few-shot instructions."""
    merchant_sys = get_system_prompt(role="merchant")
    assert "أمثلة تدريبية" in merchant_sys
    assert "وكيل تيك زون" in merchant_sys

    customer_sys = get_system_prompt(role="customer")
    assert "أمثلة تدريبية" in customer_sys
    assert "المساعد الذكي للتسوق" in customer_sys


def test_intent_router_product_and_sku_detection():
    """Verify intent routing for Egyptian Arabic customer queries and SKU searches."""
    router = IntentRouter()

    # Hardware queries
    assert router.route("عندكم ماوس جيمنج وبكام؟", role="customer") == "search_products"
    assert router.route("عايز كيبورد ميكانيكال", role="customer") == "search_products"
    assert router.route("في حدود 500 جنيه سماعة", role="customer") == "search_products"

    # SKU pattern detection
    assert router.route("هل المنتج PRD-913A85 متوفر؟", role="customer") == "search_products"
    assert router.route("تفاصيل prd-74efa9", role="customer") == "search_products"


@patch("backend.services.ai_orchestrator.get_llm")
def test_orchestrator_budget_range_filtering(mock_get_llm, agent_test_store):
    """Customer searches with budget range (between 500 and 1000 EGP).
    Should match the Anker charger (850 EGP) and filter out AirPods (8500 EGP).
    """
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm
    mock_llm.invoke.return_value = MagicMock(content="رشحتلك شاحن أنكر المناسب لميزانيتك يا فندم.")

    db, tenant_id, _, _, _ = agent_test_store
    service = AIOrchestrationService(db)

    # 1. Budget between 500 and 1000
    req = AIQueryRequestDTO(
        message="عايز شاحن بين 500 و 1000 جنيه",
        tenant_id=tenant_id,
        role="customer"
    )
    res = service.process_query(tenant_id=tenant_id, request=req)

    assert res.intent == "search_products"
    assert res.card_type == "products_list_card"
    assert len(res.products) >= 1
    # Verify Anker 850 EGP is present
    assert any("أنكر" in p.name_ar and p.price == 850.0 for p in res.products)
    # Verify AirPods 8500 EGP is NOT present
    assert not any(p.price > 1000.0 for p in res.products)

    # 2. Budget under 1000
    req2 = AIQueryRequestDTO(
        message="عاوز شاحن سريع في حدود 900",
        tenant_id=tenant_id,
        role="customer"
    )
    res2 = service.process_query(tenant_id=tenant_id, request=req2)
    assert res2.intent == "search_products"
    assert all(p.price <= 900.0 for p in res2.products)


@patch("backend.agent.erp_gemini_synthesis.get_llm")
def test_gemini_product_slot_extraction(mock_get_llm):
    """Test LLM-based product slot extraction mock."""
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm
    mock_llm.invoke.return_value = MagicMock(
        content='{"name": "كيبورد ميكانيكال RGB", "price": 1450.0, "stock": 15}'
    )

    slots = extract_product_slots_with_gemini("ضيف كيبورد ميكانيكال RGB بسعر 1450 وكمية 15")
    assert slots is not None
    assert slots["name"] == "كيبورد ميكانيكال RGB"
    assert slots["price"] == 1450.0
    assert slots["stock"] == 15


@patch("backend.agent.erp_gemini_synthesis.get_llm")
def test_gemini_category_slot_extraction(mock_get_llm):
    """Test category slot extraction mock."""
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm
    mock_llm.invoke.return_value = MagicMock(content='{"name": "ساعات وإكسسوارات"}')

    slots = extract_category_slots_with_gemini("اعمل تصنيف جديد باسم ساعات وإكسسوارات")
    assert slots is not None
    assert slots["name"] == "ساعات وإكسسوارات"


@patch("backend.agent.erp_gemini_synthesis.get_llm")
def test_gemini_price_update_slot_extraction(mock_get_llm):
    """Test price update slot extraction mock."""
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm
    mock_llm.invoke.return_value = MagicMock(
        content='{"name_or_sku": "ماوس لاسلكي", "price": 420.0}'
    )

    slots = extract_price_update_slots_with_gemini("عدل سعر الماوس اللاسلكي ل 420 جنيه")
    assert slots is not None
    assert slots["name_or_sku"] == "ماوس لاسلكي"
    assert slots["price"] == 420.0


@patch("backend.agent.erp_gemini_synthesis.get_llm")
def test_gemini_coupon_slot_extraction(mock_get_llm):
    """Test coupon slot extraction mock."""
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm
    mock_llm.invoke.return_value = MagicMock(
        content='{"code": "RAMADAN20", "discount": 20.0, "type": "percentage", "min_order": 500.0}'
    )

    slots = extract_coupon_slots_with_gemini("اعمل كوبون خصم RAMADAN20 بخصم 20 بالمية لطلبات فوق 500")
    assert slots is not None
    assert slots["code"] == "RAMADAN20"
    assert slots["value"] == 20.0
    assert slots["type"] == "percentage"
    assert slots["min_order"] == 500.0


@patch("backend.agent.erp_gemini_synthesis.get_llm")
def test_gemini_action_synthesis(mock_get_llm):
    """Test rich action synthesis node with Gemini."""
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm
    mock_llm.invoke.return_value = MagicMock(
        content="تم تعديل السعر بنجاح يا فندم إلى 420 ج.م، تم تحديث المتجر فورا."
    )

    synthesis = synthesize_erp_action_with_gemini(
        action_type="update_price",
        action_data={"product": "ماوس", "new_price": 420.0},
        user_query="عدل سعر الماوس ل 420",
        store_name="متجري"
    )
    assert synthesis is not None
    assert "420" in synthesis


def test_ai_training_api_status_and_dataset():
    """Verify AI Training API endpoints for status, dataset, and system prompt."""
    from backend.api.routes.agent import (
        get_ai_training_status,
        get_ai_training_dataset,
        add_ai_training_example,
        get_augmented_system_prompt,
        evaluate_ai_training,
        AddTrainingExamplePayload,
    )

    # 1. Test Status
    status = get_ai_training_status()
    assert status["status"] == "ready"
    assert status["merchant_examples_count"] >= 5
    assert status["customer_examples_count"] >= 5
    assert "add_product" in status["supported_intents"]

    # 2. Test Dataset
    dataset = get_ai_training_dataset(role="all")
    assert dataset["total_count"] >= 10
    assert len(dataset["merchant_examples"]) >= 5

    merchant_ds = get_ai_training_dataset(role="merchant")
    assert merchant_ds["role"] == "merchant"

    # 3. Test Add Training Example
    payload = AddTrainingExamplePayload(
        role="merchant",
        user_query="عايز اضيف شاشة سامسونج كيرف 32 بوصة بـ 7500",
        ideal_response="تمت إضافة الشاشة بنجاح يا فندم بضمان محلي معتمد.",
        intent="add_product",
        slots={"name": "شاشة سامسونج كيرف 32 بوصة", "price": 7500.0}
    )
    add_res = add_ai_training_example(payload)
    assert add_res["status"] == "success"
    assert add_res["example"]["slots"]["price"] == 7500.0

    # 4. Test System Prompt Inspection
    sys_res = get_augmented_system_prompt(role="merchant", store_name="تيك زون")
    assert "وكيل تيك زون" in sys_res["system_prompt"]
    assert "أمثلة تدريبية" in sys_res["system_prompt"]

    # 5. Test Evaluation
    eval_res = evaluate_ai_training()
    assert eval_res["status"] == "passed"
    assert eval_res["accuracy_score"] > 0.95
