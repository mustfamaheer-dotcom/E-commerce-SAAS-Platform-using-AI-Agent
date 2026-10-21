# apps/manual_test_interactive.py
"""
Interactive CLI for Manual Testing of Adel's Vertical Slice (Slice 02: Catalog, Inventory & HITL)
Usage:
    .\\.venv\\Scripts\\python.exe apps/manual_test_interactive.py
"""
import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from langchain_core.messages import HumanMessage
from apps.agent.graphs.catalog_agent_graph import build_catalog_agent_graph
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command


def print_banner():
    print("=" * 80)
    print("🤖 TECHZONE INTERACTIVE MANUAL TEST CONSOLE (Adel's Vertical Slice 02)")
    print("=" * 80)
    print("Examples of prompts you can test:")
    print("  1. Arabic Discount (HITL):  'اعمل خصم 15% على السماعات اللي فيها أكتر من 50 قطعة'")
    print("  2. English Discount (HITL): 'Apply 20% discount to Speakers with >50 stock'")
    print("  3. Inventory Alerts (ML):   'اعرض لي نواقص المخزون ومخاطر النفاد'")
    print("  4. Product Search (Read):   'عايز شاحن سريع'")
    print("  (Type 'exit' to quit)\n")


def format_diff_table(payload):
    summary = payload.get("summary", {})
    rows = payload.get("previewRows", [])

    print("\n" + "-" * 78)
    print(f"📊 BULK DISCOUNT DRY-RUN PREVIEW (Action ID: {payload.get('actionId')})")
    print("-" * 78)
    print(f"Total Affected SKUs: {summary.get('totalAffectedSkus')} | Avg Margin Before: {summary.get('averageMarginBeforePct')}% | Avg Margin After: {summary.get('averageMarginAfterPct')}%")
    
    if summary.get("negativeMarginCount", 0) > 0:
        print(f"⚠️  MARGIN FLOOR WARNING: {summary.get('negativeMarginCount')} SKU(s) proposed price falls BELOW unit cost!")
    
    print("-" * 78)
    header = f"{'SKU':<14} | {'Name':<30} | {'Stock':<5} | {'Price':<9} | {'New Price':<9} | {'Cost':<7} | {'Margin%'}"
    print(header)
    print("-" * 78)
    for r in rows:
        flag = " ⚠️ [COST ALERT]" if r["marginWarning"] else ""
        print(f"{r['sku']:<14} | {r['name'][:30]:<30} | {r['quantity']:<5} | {r['currentPrice']:<9.2f} | {r['proposedPrice']:<9.2f} | {r['cost']:<7.2f} | {r['newMarginPct']}%{flag}")
    print("-" * 78)


def main():
    print_banner()
    cp = MemorySaver()
    graph = build_catalog_agent_graph(checkpointer=cp)
    thread_counter = 1

    while True:
        try:
            user_input = input("\n👤 Enter your prompt (or press Enter for sample prompt): ").strip()
            if user_input.lower() in ("exit", "quit", "q"):
                print("Exiting manual test console. Goodbye!")
                break

            if not user_input:
                user_input = "اعمل خصم 15% على السماعات اللي فيها أكتر من 50 قطعة في المخزن"
                print(f"Using default sample prompt: '{user_input}'")

            thread_id = f"manual-thread-{thread_counter}"
            thread_counter += 1
            config = {"configurable": {"thread_id": thread_id}}

            print("\n⏳ Agent is analyzing intent and processing...")
            events = list(graph.stream({"messages": [HumanMessage(content=user_input)]}, config=config))

            state = graph.get_state(config)

            # Check if interrupted by HITL gate
            if state.tasks and len(state.tasks[0].interrupts) > 0:
                interrupt_val = state.tasks[0].interrupts[0].value
                action_id = interrupt_val.get("actionId")
                diff = interrupt_val.get("diffPayload", {})

                format_diff_table(diff)

                print(f"\n📢 HITL Gate Notice: {interrupt_val.get('message')}")
                choice = input("\n👉 Do you approve and execute this change into the database? [y/N]: ").strip().lower()

                if choice in ("y", "yes", "نعم"):
                    print("\n🚀 Approving action and committing atomic transaction...")
                    resume_events = list(
                        graph.stream(
                            Command(resume={"approved": True, "actionId": action_id}),
                            config=config,
                        )
                    )
                else:
                    print("\n🛑 Cancelling action...")
                    resume_events = list(
                        graph.stream(
                            Command(resume={"approved": False, "actionId": action_id}),
                            config=config,
                        )
                    )

                final_state = graph.get_state(config)
                final_msg = final_state.values["messages"][-1].content
                print(f"\n🤖 Agent Response:\n{final_msg}\n")

            else:
                # Read operation response
                final_msg = state.values["messages"][-1].content
                print(f"\n🤖 Agent Response:\n{final_msg}")
                res = state.values.get("execution_result", {})
                if "alerts" in res:
                    print("\n📋 Inventory Risk Alerts Breakdown:")
                    for a in res["alerts"]:
                        print(f"  • [{a['urgency']}] {a['sku']} ({a['product_name']}): Stock={a['current_stock']} | Stockout in {a['days_until_stockout']} days | Daily Loss Risk={a['daily_profit_at_risk']} EGP | Reorder={a['recommended_reorder_qty']} units")
                elif "products" in res:
                    print("\n📦 Matching Products Found:")
                    for p in res["products"]:
                        print(f"  • {p['sku']}: {p['name']} - {p['price']} EGP (Stock: {p['stock']})")

        except KeyboardInterrupt:
            print("\nInterrupted. Exiting...")
            break
        except Exception as e:
            print(f"\n❌ Error during execution: {e}")


if __name__ == "__main__":
    main()
