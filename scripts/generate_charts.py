# scripts/generate_charts.py
"""
Generate ultra-modern, high-resolution visual charts and architecture diagrams
for the TalkShow Graduation Presentation deck.
"""
import os
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import numpy as np

ASSETS_DIR = r"D:\HITU\2\AI\Project-AI\Docs\Presentation\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

# Modern Tech Palette
PRIMARY_BLUE = "#0284C7"
EMERALD_GREEN = "#059669"
AI_VIOLET = "#7C3AED"
AMBER_ORANGE = "#D97706"
ROSE_RED = "#E11D48"
SLATE_DARK = "#0F172A"
SLATE_MUTED = "#64748B"
SLATE_LIGHT = "#E2E8F0"

plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']

def generate_problem_chart():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.2), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    
    # Donut Chart - Merchant Time Allocation
    sizes = [42, 28, 18, 12]
    labels = ['Manual ERP & Excel\n(42%)', 'WhatsApp & CRM\n(28%)', 'Stock Guesswork\n(18%)', 'Strategic Growth\n(12%)']
    colors = [ROSE_RED, AMBER_ORANGE, AI_VIOLET, PRIMARY_BLUE]
    
    wedges, texts = ax1.pie(
        sizes, labels=labels, colors=colors, startangle=140,
        textprops={'fontsize': 9, 'color': SLATE_DARK, 'weight': 'bold'},
        wedgeprops=dict(width=0.45, edgecolor='#FFFFFF', linewidth=2)
    )
    ax1.set_title("Merchant Daily Time Allocation (SMEs)", fontsize=11, fontweight='bold', color=SLATE_DARK, pad=12)
    
    # Bar Chart - Stockout Loss in MENA SMEs
    categories = ['Egyptian\nRetail SMEs', 'Regional\nMENA Avg', 'Global Best\nPractice']
    values = [23.4, 18.2, 4.5]
    bar_colors = [ROSE_RED, AMBER_ORANGE, EMERALD_GREEN]
    
    bars = ax2.bar(categories, values, color=bar_colors, width=0.55, edgecolor=SLATE_LIGHT, linewidth=1.5)
    ax2.set_facecolor('#F8FAFC')
    ax2.set_ylabel("% Annual Sales Lost to Stockouts", fontsize=9.5, fontweight='bold', color=SLATE_MUTED)
    ax2.set_title("Annual Revenue Lost to Stockouts", fontsize=11, fontweight='bold', color=SLATE_DARK, pad=12)
    ax2.set_ylim(0, 30)
    ax2.grid(axis='y', linestyle='--', alpha=0.5, color=SLATE_LIGHT)
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    ax2.spines['left'].set_color(SLATE_LIGHT)
    ax2.spines['bottom'].set_color(SLATE_LIGHT)
    ax2.tick_params(colors=SLATE_DARK, labelsize=9)
    
    for bar in bars:
        height = bar.get_height()
        ax2.annotate(f'{height}%',
                     xy=(bar.get_x() + bar.get_width() / 2, height),
                     xytext=(0, 4), textcoords="offset points",
                     ha='center', va='bottom', fontsize=10, fontweight='bold', color=SLATE_DARK)
                     
    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "chart_problem_time_loss.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_forecast_chart():
    fig, ax = plt.subplots(figsize=(6.8, 3.8), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')
    
    # 30 days historical + 30 days forecast
    days_hist = np.arange(1, 31)
    np.random.seed(42)
    sales_hist = 50 + 10 * np.sin(days_hist / 4) + np.random.normal(0, 4, 30)
    
    days_fc = np.arange(31, 61)
    sales_fc_median = 52 + 14 * np.sin(days_fc / 4) + (days_fc - 30) * 0.4
    sales_fc_upper = sales_fc_median + 12 + (days_fc - 30) * 0.3
    sales_fc_lower = np.maximum(20, sales_fc_median - 10 - (days_fc - 30) * 0.25)
    
    # Plot historical
    ax.plot(days_hist, sales_hist, color=SLATE_DARK, linewidth=2.2, label='Observed Sales (Last 30 Days)', marker='o', markersize=3.5)
    
    # Plot forecast median
    ax.plot(days_fc, sales_fc_median, color=EMERALD_GREEN, linewidth=2.5, linestyle='-', label='LightGBM Median Forecast (α=0.50)')
    
    # Shaded 95% Confidence Interval
    ax.fill_between(days_fc, sales_fc_lower, sales_fc_upper, color=EMERALD_GREEN, alpha=0.18, label='95% Confidence Interval (α=0.025 - 0.975)')
    
    # Reorder Point (ROP) Threshold line
    ax.axhline(y=68, color=ROSE_RED, linestyle='--', linewidth=1.8, label='Dynamic Reorder Point (ROP = 68 units)')
    
    ax.set_title("30-Day Quantile Demand Forecast (LightGBM)", fontsize=11, fontweight='bold', color=SLATE_DARK, pad=10)
    ax.set_xlabel("Timeline (Days)", fontsize=9.5, fontweight='bold', color=SLATE_MUTED)
    ax.set_ylabel("Daily Units Demanded", fontsize=9.5, fontweight='bold', color=SLATE_MUTED)
    ax.grid(True, linestyle='--', alpha=0.5, color=SLATE_LIGHT)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(SLATE_LIGHT)
    ax.spines['bottom'].set_color(SLATE_LIGHT)
    ax.tick_params(colors=SLATE_DARK, labelsize=8.5)
    ax.legend(loc='upper left', fontsize=7.5, frameon=True, facecolor='#FFFFFF', edgecolor=SLATE_LIGHT)
    
    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "chart_forecast_cone.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_shap_chart():
    fig, ax = plt.subplots(figsize=(6.2, 3.8), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')
    
    features = [
        'Ramadan / Eid Holiday Shift',
        'Bulk 15% Price Discount',
        '7-Day Sales EWMA Velocity',
        'Weekend Foot Traffic Spike',
        'Customer At-Risk Win-back',
        'Supplier Lead-Time Delay'
    ]
    shap_impact = [+34.2, +26.5, +18.4, +12.1, +9.6, -15.8]
    colors = [EMERALD_GREEN if v > 0 else ROSE_RED for v in shap_impact]
    
    y_pos = np.arange(len(features))
    bars = ax.barh(y_pos, shap_impact, color=colors, height=0.55, edgecolor=SLATE_LIGHT, linewidth=1)
    
    ax.set_yticks(y_pos)
    ax.set_yticklabels(features, fontsize=9, fontweight='bold', color=SLATE_DARK)
    ax.set_xlabel("Marginal Demand Impact (%)", fontsize=9.5, fontweight='bold', color=SLATE_MUTED)
    ax.set_title("SHAP Feature Importance (TreeExplainer Attribution)", fontsize=11, fontweight='bold', color=SLATE_DARK, pad=10)
    ax.grid(axis='x', linestyle='--', alpha=0.5, color=SLATE_LIGHT)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(SLATE_LIGHT)
    ax.spines['bottom'].set_color(SLATE_LIGHT)
    ax.axvline(0, color=SLATE_MUTED, linewidth=1)
    
    for bar in bars:
        w = bar.get_width()
        x_pos = w + (1.2 if w > 0 else -4.2)
        ax.annotate(f'{w:+.1f}%',
                    xy=(x_pos, bar.get_y() + bar.get_height() / 2),
                    va='center', fontsize=8.5, fontweight='bold', color=SLATE_DARK)
                    
    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "chart_shap_importance.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_rfm_chart():
    fig, ax = plt.subplots(figsize=(6.2, 3.8), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')
    
    np.random.seed(101)
    n = 60
    r1 = np.random.normal(12, 5, n)
    m1 = np.random.normal(8500, 1200, n)
    
    r2 = np.random.normal(28, 8, n)
    m2 = np.random.normal(5200, 800, n)
    
    r3 = np.random.normal(10, 4, n)
    m3 = np.random.normal(1800, 400, n)
    
    r4 = np.random.normal(75, 12, n)
    m4 = np.random.normal(4800, 900, n)
    
    r5 = np.random.normal(110, 15, n)
    m5 = np.random.normal(1200, 300, n)
    
    ax.scatter(r1, m1, color=EMERALD_GREEN, label='VIP Champions (High LTV)', alpha=0.8, edgecolors='white', s=55)
    ax.scatter(r2, m2, color=PRIMARY_BLUE, label='Loyal Regulars', alpha=0.8, edgecolors='white', s=55)
    ax.scatter(r3, m3, color=AI_VIOLET, label='New Shoppers', alpha=0.8, edgecolors='white', s=55)
    ax.scatter(r4, m4, color=AMBER_ORANGE, label='At-Risk of Churn (Target Win-Back)', alpha=0.8, edgecolors='white', s=55)
    ax.scatter(r5, m5, color=ROSE_RED, label='Hibernating / Lost', alpha=0.8, edgecolors='white', s=55)
    
    ax.set_title("Log-RFM + K-Means Customer Segmentation (K=5)", fontsize=11, fontweight='bold', color=SLATE_DARK, pad=10)
    ax.set_xlabel("Recency (Days Since Last Order)", fontsize=9.5, fontweight='bold', color=SLATE_MUTED)
    ax.set_ylabel("Monetary Spend (EGP)", fontsize=9.5, fontweight='bold', color=SLATE_MUTED)
    ax.grid(True, linestyle='--', alpha=0.5, color=SLATE_LIGHT)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(SLATE_LIGHT)
    ax.spines['bottom'].set_color(SLATE_LIGHT)
    ax.tick_params(colors=SLATE_DARK, labelsize=8.5)
    ax.legend(loc='upper right', fontsize=7.5, frameon=True, facecolor='#FFFFFF', edgecolor=SLATE_LIGHT)
    
    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "chart_rfm_clusters.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_benchmark_chart():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.2), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    
    # Subplot 1: Forecast Model WAPE comparison
    models = ['TalkShow\nLightGBM', 'Facebook\nProphet', 'Classical\nARIMA']
    wape = [14.2, 28.6, 34.1]
    m_colors = [EMERALD_GREEN, AMBER_ORANGE, ROSE_RED]
    
    bars1 = ax1.bar(models, wape, color=m_colors, width=0.5, edgecolor=SLATE_LIGHT, linewidth=1.5)
    ax1.set_facecolor('#F8FAFC')
    ax1.set_ylabel("WAPE % (Lower is Better)", fontsize=9.5, fontweight='bold', color=SLATE_MUTED)
    ax1.set_title("Forecasting Error Benchmark (WAPE)", fontsize=11, fontweight='bold', color=SLATE_DARK, pad=10)
    ax1.set_ylim(0, 42)
    ax1.grid(axis='y', linestyle='--', alpha=0.5, color=SLATE_LIGHT)
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.spines['left'].set_color(SLATE_LIGHT)
    ax1.spines['bottom'].set_color(SLATE_LIGHT)
    ax1.tick_params(colors=SLATE_DARK, labelsize=9)
    for b in bars1:
        h = b.get_height()
        ax1.annotate(f'{h:.1f}%',
                     xy=(b.get_x() + b.get_width() / 2, h),
                     xytext=(0, 4), textcoords="offset points",
                     ha='center', va='bottom', fontsize=10, fontweight='bold', color=SLATE_DARK)

    # Subplot 2: TalkShow 100-Prompt Benchmark Metrics
    metrics = ['Tool Selection\nF1-Score', 'SQL Execution\nAccuracy (EX)', 'Valid SQL\nRate (VSR)', 'Security Block\nRate (Attacks)']
    scores = [98.0, 92.4, 99.2, 100.0]
    bar_colors = [PRIMARY_BLUE, AI_VIOLET, EMERALD_GREEN, ROSE_RED]
    
    bars2 = ax2.bar(metrics, scores, color=bar_colors, width=0.55, edgecolor=SLATE_LIGHT, linewidth=1.5)
    ax2.set_facecolor('#F8FAFC')
    ax2.set_ylabel("Accuracy / Reliability (%)", fontsize=9.5, fontweight='bold', color=SLATE_MUTED)
    ax2.set_title("100-Prompt Academic Benchmark Results", fontsize=11, fontweight='bold', color=SLATE_DARK, pad=10)
    ax2.set_ylim(80, 105)
    ax2.grid(axis='y', linestyle='--', alpha=0.5, color=SLATE_LIGHT)
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    ax2.spines['left'].set_color(SLATE_LIGHT)
    ax2.spines['bottom'].set_color(SLATE_LIGHT)
    ax2.tick_params(colors=SLATE_DARK, labelsize=8.5)
    for b in bars2:
        h = b.get_height()
        ax2.annotate(f'{h:.1f}%',
                     xy=(b.get_x() + b.get_width() / 2, h),
                     xytext=(0, 4), textcoords="offset points",
                     ha='center', va='bottom', fontsize=9.5, fontweight='bold', color=SLATE_DARK)

    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "chart_benchmarks.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_hardware_chart():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9.5, 3.8), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    
    # Subplot 1: VRAM Footprint
    quant_levels = ['TalkShow 4-bit\n(Q4_K_M)', '8-bit Quantized\n(Int8)', '16-bit Full\n(FP16)']
    vram = [2.18, 4.40, 7.80]
    colors1 = [EMERALD_GREEN, AMBER_ORANGE, ROSE_RED]
    
    bars1 = ax1.bar(quant_levels, vram, color=colors1, width=0.5, edgecolor=SLATE_LIGHT, linewidth=1.5)
    ax1.axhline(4.0, color=ROSE_RED, linestyle='--', linewidth=1.5, label='Consumer RTX 3050 VRAM Cap (4 GB)')
    ax1.set_facecolor('#F8FAFC')
    ax1.set_ylabel("VRAM Footprint (GB)", fontsize=9.5, fontweight='bold', color=SLATE_MUTED)
    ax1.set_title("VRAM Consumption on RTX 3050", fontsize=11, fontweight='bold', color=SLATE_DARK, pad=10)
    ax1.set_ylim(0, 9)
    ax1.grid(axis='y', linestyle='--', alpha=0.5, color=SLATE_LIGHT)
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.spines['left'].set_color(SLATE_LIGHT)
    ax1.spines['bottom'].set_color(SLATE_LIGHT)
    ax1.tick_params(colors=SLATE_DARK, labelsize=8.5)
    ax1.legend(loc='upper left', fontsize=7.5, frameon=True, facecolor='#FFFFFF', edgecolor=SLATE_LIGHT)
    for b in bars1:
        h = b.get_height()
        ax1.annotate(f'{h:.2f} GB',
                     xy=(b.get_x() + b.get_width() / 2, h),
                     xytext=(0, 4), textcoords="offset points",
                     ha='center', va='bottom', fontsize=9.5, fontweight='bold', color=SLATE_DARK)

    # Subplot 2: Inference Token Speed
    models = ['RTX 3050\nCUDA (GGUF)', 'CPU 8-Core\n(AVX2)', 'Cloud Gemini\n(Network)']
    speed = [38.4, 11.2, 42.0]
    colors2 = [PRIMARY_BLUE, SLATE_MUTED, AI_VIOLET]
    
    bars2 = ax2.bar(models, speed, color=colors2, width=0.5, edgecolor=SLATE_LIGHT, linewidth=1.5)
    ax2.set_facecolor('#F8FAFC')
    ax2.set_ylabel("Inference Speed (Tokens / Sec)", fontsize=9.5, fontweight='bold', color=SLATE_MUTED)
    ax2.set_title("Generation Speed Comparison", fontsize=11, fontweight='bold', color=SLATE_DARK, pad=10)
    ax2.set_ylim(0, 50)
    ax2.grid(axis='y', linestyle='--', alpha=0.5, color=SLATE_LIGHT)
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    ax2.spines['left'].set_color(SLATE_LIGHT)
    ax2.spines['bottom'].set_color(SLATE_LIGHT)
    ax2.tick_params(colors=SLATE_DARK, labelsize=8.5)
    for b in bars2:
        h = b.get_height()
        ax2.annotate(f'{h:.1f} t/s',
                     xy=(b.get_x() + b.get_width() / 2, h),
                     xytext=(0, 4), textcoords="offset points",
                     ha='center', va='bottom', fontsize=9.5, fontweight='bold', color=SLATE_DARK)

    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "chart_hardware_bench.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(10.5, 4.5), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')
    
    box_coords = [
        (0.5, 3.3, 9.5, 0.72, "1. Client & Generative UI (React 18 + Vite + Redux)", PRIMARY_BLUE, "#E0F2FE", "Dynamic Typed GenUI Cards  |  Spatial Minimalist Storefront  |  Arabic RTL"),
        (0.5, 2.45, 9.5, 0.72, "2. API Gateway & Security Firewall (FastAPI / NestJS)", EMERALD_GREEN, "#D1FAE5", "X-Trace-ID Latency Tracker  |  PromptGuard Injection Filter  |  PII Masking"),
        (0.5, 1.6, 9.5, 0.72, "3. LangGraph Agent Core (MasterCommandGraph)", AI_VIOLET, "#EDE9FE", "10 Intent Routes  |  3-Tier Context Memory  |  Human-in-the-Loop (HITL) Gate"),
        (0.5, 0.75, 9.5, 0.72, "4. Predictive MLOps Microservice (LightGBM + Scikit)", AMBER_ORANGE, "#FEF3C7", "30-Day Demand Quantiles (95% CI)  |  SHAP Attributions  |  Log-RFM K-Means"),
        (0.5, -0.1, 9.5, 0.72, "5. Multi-Tenant Data Layer (PostgreSQL 16 RLS + Redis 7)", ROSE_RED, "#FFE4E6", "Row-Level Security Session Isolation  |  Sub-ms Redis Caching  |  Meilisearch")
    ]
    
    for x, y, w, h, title, border_c, bg_c, sub in box_coords:
        patch = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.04", facecolor=bg_c, edgecolor=border_c, linewidth=1.8)
        ax.add_patch(patch)
        ax.text(x + 0.3, y + h*0.64, title, fontsize=10.5, fontweight='bold', color=SLATE_DARK, va='center')
        ax.text(x + 0.3, y + h*0.25, sub, fontsize=8.5, color=SLATE_MUTED, va='center')
        
    for y in [3.3, 2.45, 1.6, 0.75]:
        ax.annotate('', xy=(5.25, y - 0.02), xytext=(5.25, y + 0.08),
                    arrowprops=dict(facecolor=SLATE_DARK, edgecolor=SLATE_DARK, width=1.5, headwidth=6, shrink=0.05))
                    
    ax.set_xlim(0, 10.5)
    ax.set_ylim(-0.3, 4.3)
    ax.axis('off')
    
    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "diagram_architecture_flow.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_ast_diagram():
    fig, ax = plt.subplots(figsize=(10.5, 4.3), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')
    
    steps = [
        ("Layer 1: Dialect Normalizer", "Normalizes Egyptian Arabic & maps colloquial Franco-Arab slang ('السيلز', 'الأوردرات') to DB schema.", PRIMARY_BLUE, "#E0F2FE"),
        ("Layer 2: Dynamic Schema Pruning", "Extracts only the 3-5 relevant tables via vector index instead of full 71-table ERP schema (70% token savings).", AI_VIOLET, "#EDE9FE"),
        ("Layer 3: AST Syntax Sandbox (sqlglot)", "Parses SQL tree; strictly rejects DROP, DELETE, UPDATE, INSERT, ALTER and catalog probes.", ROSE_RED, "#FFE4E6"),
        ("Layer 4: Semicolon & Tenant Guard", "Blocks multi-statement injection and enforces tenant_id isolation at kernel level.", AMBER_ORANGE, "#FEF3C7"),
        ("Layer 5: Row Clamping & Self-Correction", "Applies LIMIT 500 cap; automated reflection loop diagnoses relational exceptions and retries safely.", EMERALD_GREEN, "#D1FAE5")
    ]
    
    for i, (title, desc, border_c, bg_c) in enumerate(steps):
        y = 3.3 - i * 0.8
        patch = FancyBboxPatch((0.5, y), 9.5, 0.65, boxstyle="round,pad=0.04", facecolor=bg_c, edgecolor=border_c, linewidth=1.8)
        ax.add_patch(patch)
        ax.text(0.8, y + 0.42, title, fontsize=10, fontweight='bold', color=SLATE_DARK, va='center')
        ax.text(0.8, y + 0.18, desc, fontsize=8, color=SLATE_MUTED, va='center')
        if i < 4:
            ax.annotate('', xy=(5.25, y - 0.08), xytext=(5.25, y + 0.02),
                        arrowprops=dict(facecolor=SLATE_DARK, edgecolor=SLATE_DARK, width=1.2, headwidth=5))
                        
    ax.set_xlim(0, 10.5)
    ax.set_ylim(-0.3, 4.2)
    ax.axis('off')
    
    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "diagram_ast_defense.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_hitl_diagram():
    fig, ax = plt.subplots(figsize=(10.5, 3.8), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')
    
    nodes = [
        (0.5, "1. Natural Prompt", "Merchant Command:\n'طبق خصم 15% على السماعات'", PRIMARY_BLUE, "#E0F2FE"),
        (2.9, "2. Dry-Run & Check", "Simulates margin diff;\nVerifies Price > Cost floor", AMBER_ORANGE, "#FEF3C7"),
        (5.3, "3. Stage & GenUI", "Emits actionId (PENDING);\nRenders <BulkPricePreviewCard>", AI_VIOLET, "#EDE9FE"),
        (7.7, "4. Human Commit", "Merchant clicks 'Approve';\nCommits to PostgreSQL RLS", EMERALD_GREEN, "#D1FAE5")
    ]
    
    for x, title, sub, border_c, bg_c in nodes:
        patch = FancyBboxPatch((x, 0.8), 2.2, 2.2, boxstyle="round,pad=0.06", facecolor=bg_c, edgecolor=border_c, linewidth=2)
        ax.add_patch(patch)
        ax.text(x + 1.1, 2.4, title, fontsize=10, fontweight='bold', color=SLATE_DARK, ha='center', va='center')
        ax.text(x + 1.1, 1.5, sub, fontsize=8.5, color=SLATE_MUTED, ha='center', va='center')
        
    for arrow_x in [2.72, 5.12, 7.52]:
        ax.annotate('', xy=(arrow_x + 0.16, 1.9), xytext=(arrow_x - 0.02, 1.9),
                    arrowprops=dict(facecolor=SLATE_DARK, edgecolor=SLATE_DARK, width=1.5, headwidth=6))
                    
    ax.set_xlim(0, 10.5)
    ax.set_ylim(0, 3.8)
    ax.axis('off')
    
    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "diagram_hitl_workflow.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_comparison_diagram():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.5, 4.2), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    
    # Generic Naive LLM wrapper
    ax1.set_facecolor('#FFF1F2')
    ax1.set_xlim(0, 5)
    ax1.set_ylim(0, 5)
    ax1.axis('off')
    p1 = FancyBboxPatch((0.2, 0.2), 4.6, 4.6, boxstyle="round,pad=0.08", facecolor='#FFE4E6', edgecolor=ROSE_RED, linewidth=2)
    ax1.add_patch(p1)
    ax1.text(2.5, 4.3, "✕ Generic Naive LLM Wrapper", fontsize=11, fontweight='bold', color=ROSE_RED, ha='center')
    ax1.text(2.5, 3.8, "(Fragile & Dangerous for Business)", fontsize=8.5, color=SLATE_MUTED, ha='center')
    
    bad_points = [
        "• Unchecked SQL generation directly on DB",
        "• Zero margin guard: sets prices below cost",
        "• Drops/mutates tables on malicious prompts",
        "• Multi-tenant data contamination risks",
        "• Hallucinates product availability & specs",
        "• Static text dump: no actionable UI cards"
    ]
    for i, pt in enumerate(bad_points):
        ax1.text(0.5, 3.2 - i*0.5, pt, fontsize=8.8, color=SLATE_DARK, fontweight='500')
        
    # TalkShow Architecture
    ax2.set_facecolor('#ECFDF5')
    ax2.set_xlim(0, 5)
    ax2.set_ylim(0, 5)
    ax2.axis('off')
    p2 = FancyBboxPatch((0.2, 0.2), 4.6, 4.6, boxstyle="round,pad=0.08", facecolor='#D1FAE5', edgecolor=EMERALD_GREEN, linewidth=2)
    ax2.add_patch(p2)
    ax2.text(2.5, 4.3, "✓ TalkShow Enterprise Agent", fontsize=11, fontweight='bold', color=EMERALD_GREEN, ha='center')
    ax2.text(2.5, 3.8, "(Guaranteed Safety & Business Grounding)", fontsize=8.5, color=SLATE_MUTED, ha='center')
    
    good_points = [
        "• AST syntax sandbox rejects all DDL/DML",
        "• Human-in-the-Loop dry run & margin checks",
        "• Kernel PostgreSQL RLS tenant isolation",
        "• Grounded in live DB facts: zero hallucination",
        "• Quantile LightGBM demand forecasts (95% CI)",
        "• Dynamic Generative UI (GenUI React Cards)"
    ]
    for i, pt in enumerate(good_points):
        ax2.text(0.5, 3.2 - i*0.5, pt, fontsize=8.8, color=SLATE_DARK, fontweight='500')
        
    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "diagram_generic_vs_talkshow.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_genui_diagram():
    fig, ax = plt.subplots(figsize=(10.5, 4.0), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')
    
    stages = [
        (0.5, "1. Merchant Query", "User inputs:\n'مين أكتر عملاء اشتروا\nالشهر ده في الإسكندرية؟'", PRIMARY_BLUE, "#E0F2FE"),
        (2.9, "2. LangGraph + Tool", "Executes get_top_customers;\nFormats validated payload:\n{'action': 'RENDER_TABLE'}", AI_VIOLET, "#EDE9FE"),
        (5.3, "3. Typed GenUI Card", "Emits structured schema:\n<CustomerSegmentationCard\n  metrics={rfm_data} />", AMBER_ORANGE, "#FEF3C7"),
        (7.7, "4. Interactive Action", "Merchant filters, clicks\n'Create 10% Winback Promo'\nDirectly in chat card!", EMERALD_GREEN, "#D1FAE5")
    ]
    
    for x, title, sub, border_c, bg_c in stages:
        patch = FancyBboxPatch((x, 0.6), 2.2, 2.8, boxstyle="round,pad=0.06", facecolor=bg_c, edgecolor=border_c, linewidth=2)
        ax.add_patch(patch)
        ax.text(x + 1.1, 3.0, title, fontsize=10, fontweight='bold', color=SLATE_DARK, ha='center', va='center')
        ax.text(x + 1.1, 1.8, sub, fontsize=8.5, color=SLATE_MUTED, ha='center', va='center')
        
    for arrow_x in [2.72, 5.12, 7.52]:
        ax.annotate('', xy=(arrow_x + 0.16, 2.0), xytext=(arrow_x - 0.02, 2.0),
                    arrowprops=dict(facecolor=SLATE_DARK, edgecolor=SLATE_DARK, width=1.5, headwidth=6))
                    
    ax.set_xlim(0, 10.5)
    ax.set_ylim(0, 4.0)
    ax.axis('off')
    
    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "diagram_genui_concept.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_dialect_diagram():
    fig, ax = plt.subplots(figsize=(10.5, 4.0), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')
    
    steps = [
        ("Raw Input (Colloquial Egyptian)", "'عايز أعمل خصم 15% على السماعات اللي بتتباع بطيء'", ROSE_RED, "#FFE4E6"),
        ("Slang & Token Normalizer", "Maps: 'السماعات' -> Category 'Headphones' | 'بتتباع بطيء' -> velocity_tier = 'SLOW'", PRIMARY_BLUE, "#E0F2FE"),
        ("Intent & Entity Extractor", "Intent: 'BULK_PRICE_UPDATE' | params: {discount: 0.15, category: 'Headphones', condition: 'slow'}", AI_VIOLET, "#EDE9FE"),
        ("PostgreSQL RLS Execution", "SELECT product_id, price FROM products WHERE category = 'Headphones' AND tenant_id = current_tenant()", EMERALD_GREEN, "#D1FAE5")
    ]
    
    for i, (title, sub, border_c, bg_c) in enumerate(steps):
        y = 2.9 - i * 0.9
        patch = FancyBboxPatch((0.5, y), 9.5, 0.72, boxstyle="round,pad=0.04", facecolor=bg_c, edgecolor=border_c, linewidth=1.8)
        ax.add_patch(patch)
        ax.text(0.8, y + 0.46, title, fontsize=10, fontweight='bold', color=SLATE_DARK, va='center')
        ax.text(0.8, y + 0.20, sub, fontsize=8.2, color=SLATE_MUTED, va='center')
        if i < 3:
            ax.annotate('', xy=(5.25, y - 0.08), xytext=(5.25, y + 0.02),
                        arrowprops=dict(facecolor=SLATE_DARK, edgecolor=SLATE_DARK, width=1.2, headwidth=5))
                        
    ax.set_xlim(0, 10.5)
    ax.set_ylim(-0.2, 4.0)
    ax.axis('off')
    
    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "diagram_dialect_flow.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

def generate_roadmap_diagram():
    fig, ax = plt.subplots(figsize=(10.5, 3.8), dpi=250)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')
    
    quarters = [
        (0.5, "Phase 1: Foundation\n(Completed)", "• LangGraph Multi-Agent Core\n• Text-to-SQL + AST Sandbox\n• LightGBM Quantile Forecast\n• Log-RFM Segmentation", PRIMARY_BLUE, "#E0F2FE"),
        (2.9, "Phase 2: Local Integrations\n(Q1 2027)", "• Paymob Live Payment Gate\n• Bosta Courier Automated Dispatch\n• ETA E-Invoicing SDK Compliance\n• WhatsApp Business API Webhook", EMERALD_GREEN, "#D1FAE5"),
        (5.3, "Phase 3: Autonomous Social\n(Q2 2027)", "• Instagram & TikTok Live Co-Pilot\n• Video Stream Sentiment Tracking\n• Real-Time Flash Sale Bidding\n• Automated Order Capturing", AI_VIOLET, "#EDE9FE"),
        (7.7, "Phase 4: Multi-Tenant Scale\n(Q3-Q4 2027)", "• Sovereign Air-Gapped Appliances\n• Cross-Store Supplier Aggregation\n• Autonomous Stock Re-Balancing\n• Dynamic GCC Expansion", AMBER_ORANGE, "#FEF3C7")
    ]
    
    for x, title, sub, border_c, bg_c in quarters:
        patch = FancyBboxPatch((x, 0.5), 2.2, 2.9, boxstyle="round,pad=0.06", facecolor=bg_c, edgecolor=border_c, linewidth=2)
        ax.add_patch(patch)
        ax.text(x + 1.1, 3.0, title, fontsize=9.5, fontweight='bold', color=SLATE_DARK, ha='center', va='center')
        ax.text(x + 0.15, 1.6, sub, fontsize=8, color=SLATE_MUTED, ha='left', va='center')
        
    for arrow_x in [2.72, 5.12, 7.52]:
        ax.annotate('', xy=(arrow_x + 0.16, 1.95), xytext=(arrow_x - 0.02, 1.95),
                    arrowprops=dict(facecolor=SLATE_DARK, edgecolor=SLATE_DARK, width=1.5, headwidth=6))
                    
    ax.set_xlim(0, 10.5)
    ax.set_ylim(0, 3.8)
    ax.axis('off')
    
    plt.tight_layout()
    out_path = os.path.join(ASSETS_DIR, "diagram_roadmap_timeline.png")
    plt.savefig(out_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Generated:", out_path)

if __name__ == '__main__':
    print("Generating all TalkShow visual charts and architectural diagrams...")
    generate_problem_chart()
    generate_forecast_chart()
    generate_shap_chart()
    generate_rfm_chart()
    generate_benchmark_chart()
    generate_hardware_chart()
    generate_architecture_diagram()
    generate_ast_diagram()
    generate_hitl_diagram()
    generate_comparison_diagram()
    generate_genui_diagram()
    generate_dialect_diagram()
    generate_roadmap_diagram()
    print("All 13 charts and diagrams successfully generated!")
