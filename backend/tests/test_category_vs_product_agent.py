# backend/tests/test_category_vs_product_agent.py
import pytest
from langchain_core.messages import HumanMessage
from backend.agent.erp_agent import get_erp_agent

@pytest.fixture(scope="module")
def agent():
    return get_erp_agent()

def test_bare_add_category_clarification(agent):
    """'عايز اضيف قسم جديد' must trigger category clarification, NOT product."""
    state = {
        "messages": [HumanMessage(content="عايز اضيف قسم جديد")],
        "tenant_id": "tenant-moustafa-tech",
        "session_id": "test-cat-1",
    }
    res = agent.invoke(state)
    assert res.get("intent") == "clarification_add_category"
    assert res.get("card_type") == "clarification"
    payload = res.get("tool_result", {}).get("payload", {})
    assert payload.get("formType") == "category"
    assert any(slot["field"] == "name" for slot in payload.get("slots", []))
    assert not any(slot["field"] == "price" for slot in payload.get("slots", []))

def test_bare_add_tasneef_clarification(agent):
    """'عايز اضيف تصنيف جديد' must trigger category clarification, NOT product."""
    state = {
        "messages": [HumanMessage(content="عايز اضيف تصنيف جديد")],
        "tenant_id": "tenant-moustafa-tech",
        "session_id": "test-cat-2",
    }
    res = agent.invoke(state)
    assert res.get("intent") == "clarification_add_category"
    payload = res.get("tool_result", {}).get("payload", {})
    assert payload.get("formType") == "category"

def test_add_specific_category(agent):
    """'اضف قسم ساعات ذكية' must create a category with category_card."""
    state = {
        "messages": [HumanMessage(content="اضف قسم أجهزة منزلية ذكية")],
        "tenant_id": "tenant-moustafa-tech",
        "session_id": "test-cat-3",
    }
    res = agent.invoke(state)
    assert res.get("intent") == "add_category"
    assert res.get("card_type") == "category_card"
    assert "أجهزة منزلية ذكية" in res.get("tool_result", {}).get("message", "")

def test_list_categories(agent):
    """'اعرض الاقسام' must list store categories."""
    state = {
        "messages": [HumanMessage(content="اعرض الاقسام")],
        "tenant_id": "tenant-moustafa-tech",
        "session_id": "test-cat-4",
    }
    res = agent.invoke(state)
    assert res.get("intent") == "list_categories"
    assert res.get("card_type") == "categories_list_card"

def test_product_addition_unaffected(agent):
    """'عايز اضيف منتج' must still trigger product clarification."""
    state = {
        "messages": [HumanMessage(content="عايز اضيف منتج جديد")],
        "tenant_id": "tenant-moustafa-tech",
        "session_id": "test-prod-1",
    }
    res = agent.invoke(state)
    assert res.get("intent") == "clarification_add_product"
    payload = res.get("tool_result", {}).get("payload", {})
    assert any(slot["field"] == "price" for slot in payload.get("slots", []))
