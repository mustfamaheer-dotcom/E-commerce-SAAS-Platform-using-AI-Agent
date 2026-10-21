# apps/test_adel_unittest.py
import os
import sys
import unittest
import math

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from langchain_core.messages import HumanMessage
from apps.ml.src.inventory.stockout_optimizer import (
    compute_safety_stock,
    compute_reorder_point,
    compute_days_until_stockout,
    compute_daily_profit_at_risk,
    analyze_inventory_risk,
    DEFAULT_LEAD_TIME_DAYS,
)
from apps.agent.tools.catalog_tools import (
    search_products_tool,
    get_inventory_alerts_tool,
    bulk_update_prices_dry_run,
    update_product_dry_run,
)
from apps.agent.graphs.catalog_agent_graph import (
    CatalogState,
    parse_catalog_intent,
    build_catalog_agent_graph,
)
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command


class TestAdelVerticalSlice(unittest.TestCase):

    # --- 1. ML Layer Tests: Stockout & Safety Stock Optimizer ---
    def test_ml_safety_stock_formula(self):
        """Verify SS = Z_0.95 * sigma_d * sqrt(L) where Z_0.95 = 1.64485"""
        sigma_d = 4.0
        lead_time = 9  # sqrt(9) = 3
        # SS = 1.644853 * 4 * 3 = 19.738 -> ceil = 20
        ss = compute_safety_stock(demand_std_dev=sigma_d, lead_time_days=lead_time)
        self.assertEqual(ss, 20)

    def test_ml_reorder_point_formula(self):
        """Verify ROP = (mu_d * L) + SS"""
        mean_demand = 5.0
        lead_time = 4
        safety_stock = 15
        # ROP = (5 * 4) + 15 = 35
        rop = compute_reorder_point(mean_daily_demand=mean_demand, safety_stock=safety_stock, lead_time_days=lead_time)
        self.assertEqual(rop, 35)

    def test_ml_days_until_stockout(self):
        """Verify DUS = Q_current / max(EWMA_d, epsilon)"""
        stock = 50
        velocity = 10.0
        dus = compute_days_until_stockout(current_stock=stock, demand_velocity=velocity)
        self.assertEqual(dus, 5.0)

    def test_ml_daily_profit_at_risk(self):
        """Verify Daily Profit at Risk = EWMA_d * max(0, price - cost)"""
        velocity = 4.0
        price = 1000.0
        cost = 700.0
        # Profit at risk = 4 * (1000 - 700) = 1200.0
        risk = compute_daily_profit_at_risk(demand_velocity=velocity, unit_price=price, unit_cost=cost)
        self.assertEqual(risk, 1200.0)

    def test_ml_inventory_risk_ranking(self):
        """Verify analyze_inventory_risk ranks SKUs by urgency and daily profit at risk descending"""
        items = [
            {
                "sku": "SKU-LOW-PROFIT",
                "name": "Cheap Cable",
                "category": "Cables",
                "current_stock": 2,
                "price": 50.0,
                "cost": 30.0,
                "demand_history": [2, 2, 3, 2, 2],
            },
            {
                "sku": "SKU-HIGH-PROFIT",
                "name": "Premium Speaker",
                "category": "Speakers",
                "current_stock": 3,
                "price": 5000.0,
                "cost": 3000.0,
                "demand_history": [3, 4, 3, 4, 3],
            },
        ]
        res = analyze_inventory_risk(items, lead_time_days=5)
        self.assertEqual(res.total_skus_evaluated, 2)
        self.assertEqual(res.skus_at_risk_count, 2)
        # SKU-HIGH-PROFIT must be ranked first because its daily profit at risk is much higher
        self.assertEqual(res.ranked_risk_profiles[0].sku, "SKU-HIGH-PROFIT")
        self.assertTrue(res.ranked_risk_profiles[0].daily_profit_at_risk > res.ranked_risk_profiles[1].daily_profit_at_risk)

    # --- 2. Catalog Tools Tests ---
    def test_search_products_tool(self):
        # Search by Arabic keyword
        res = search_products_tool(query="سماعات")
        self.assertTrue(len(res) > 0)
        # Search with stock filter
        res_stock = search_products_tool(query="speaker", min_stock=70)
        self.assertTrue(all(p["stock"] >= 70 for p in res_stock))

    def test_get_inventory_alerts_tool(self):
        alerts = get_inventory_alerts_tool()
        self.assertTrue(len(alerts) > 0)
        # Verify urgency sorting
        self.assertTrue("daily_profit_at_risk" in alerts[0])

    def test_bulk_update_prices_dry_run_margin_safety(self):
        """
        Verify bulk discount dry run calculates new prices without mutating data
        and detects negative margin floor (proposed_price < cost).
        """
        # 15% discount on Speakers category
        result = bulk_update_prices_dry_run(category="Speakers", min_stock=50, discount_pct=15.0)

        self.assertEqual(result["status"], "PENDING_CONFIRMATION")
        self.assertTrue(result["actionId"].startswith("act_"))
        summary = result["summary"]
        self.assertTrue(summary["totalAffectedSkus"] > 0)

        # SKU 'SPK-MINI-09' has price=500, cost=450.
        # At 15% discount: proposedPrice = 425 < 450 -> marginWarning = True!
        warning_skus = [r for r in result["previewRows"] if r["marginWarning"]]
        self.assertTrue(len(warning_skus) > 0)
        self.assertEqual(summary["negativeMarginCount"], len(warning_skus))
        self.assertTrue(any(r["sku"] == "SPK-MINI-09" for r in warning_skus))

    # --- 3. Agent Intent & LangGraph HITL Tests ---
    def test_intent_parsing_arabic_discount(self):
        state = CatalogState(
            messages=[HumanMessage(content="اعمل خصم 15% على السماعات اللي فيها أكتر من 50 قطعة في المخزن")]
        )
        parsed = parse_catalog_intent(state)
        self.assertEqual(parsed["language"], "ar")
        self.assertEqual(parsed["pending_action_type"], "bulk_update_prices")
        self.assertEqual(parsed["pending_action_params"]["discount_pct"], 15.0)
        self.assertEqual(parsed["pending_action_params"]["category"], "Speakers")
        self.assertEqual(parsed["pending_action_params"]["min_stock"], 50)

    def test_intent_parsing_english_alerts(self):
        state = CatalogState(
            messages=[HumanMessage(content="Show me stockout alerts and low stock items")]
        )
        parsed = parse_catalog_intent(state)
        self.assertEqual(parsed["language"], "en")
        self.assertEqual(parsed["pending_action_type"], "get_inventory_alerts")

    def test_langgraph_hitl_interrupt_and_resume(self):
        """
        Verifies full LangGraph HITL workflow:
        1. Merchant sends discount request.
        2. Graph runs up to HITL gate and triggers interrupt with dry-run preview.
        3. Merchant approves with Command(resume={'approved': True, 'actionId': ...}).
        4. Graph resumes and executes commit!
        """
        cp = MemorySaver()
        graph = build_catalog_agent_graph(checkpointer=cp)
        config = {"configurable": {"thread_id": "thread-test-hitl-01"}}

        # Turn 1: Merchant asks for 15% discount on speakers
        events = list(
            graph.stream(
                {
                    "messages": [
                        HumanMessage(content="Apply 15% discount to Speakers with >50 stock")
                    ],
                    "tenant_id": "tenant-uuid-111",
                },
                config=config,
            )
        )

        state = graph.get_state(config)
        # Verify graph is paused at HITL gate with interrupt payload
        self.assertTrue(len(state.tasks) > 0)
        task = state.tasks[0]
        self.assertTrue(len(task.interrupts) > 0)
        interrupt_value = task.interrupts[0].value

        self.assertEqual(interrupt_value["type"], "HITL_CONFIRMATION_REQUIRED")
        self.assertTrue(interrupt_value["actionId"].startswith("act_"))
        self.assertTrue(interrupt_value["diffPayload"]["summary"]["totalAffectedSkus"] > 0)
        # Margin warning should be detected for SPK-MINI-09
        self.assertTrue(interrupt_value["marginWarning"])

        # Turn 2: Merchant confirms approval via UI
        action_id = interrupt_value["actionId"]
        resume_events = list(
            graph.stream(
                Command(resume={"approved": True, "actionId": action_id}),
                config=config,
            )
        )

        final_state = graph.get_state(config)
        self.assertEqual(len(final_state.tasks), 0)  # Finished execution
        last_ai_msg = final_state.values["messages"][-1]
        self.assertIn("committed successfully", last_ai_msg.content.lower())
        self.assertEqual(final_state.values["execution_result"]["status"], "EXECUTED")


if __name__ == "__main__":
    unittest.main()
