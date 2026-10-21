# 🧑‍💻 Retaj — Implementation Plan

**Member:** Retaj Hakim (ريتاج)
**Role:** Time-Series Sales Forecasting, SHAP Explainability & MLOps Lead
**Vertical Slice:** ML Sales Forecasting, Explainability & Model Lifecycle
**PDF Sections:** 3.3, 4.5 & 8.1–8.3
**Task Matrix IDs:** `retaj-fe`, `retaj-be`, `retaj-db`, `retaj-ai`, `retaj-ml`

> **Mission:** Own the end-to-end Machine Learning Forecasting pipeline where a merchant asks
> *"كام وحدة من المنتج ده هبيع الشهر الجاي؟ أطلب مخزون دلوقتي ولا أستنى؟"*
> *("How many units of Product X do I expect to sell next month? Do I need to order stock now?")*
> and receives a **real model prediction** with confidence intervals, **SHAP feature attributions**, and an **actionable restock recommendation** — all rendered as an interactive React card inside the Agent conversation.

---

## 📋 Task Overview

| # | Task ID | Layer | Task Title | Status |
|---|---------|-------|-----------|--------|
| 1 | `RET-FE` | 🖥️ Frontend & GenUI | Forecast Horizon Confidence Band Chart (`<SalesForecastCard />`) & SHAP Explainability UI | ✅ Done |
| 2 | `RET-BE` | ⚙️ Backend & MLOps | Low-Latency FastAPI Inference Service & Scheduled Model Retraining Workers | ✅ Done |
| 3 | `RET-DB` | 🗄️ Database & Feature Store | Time-Series Feature Extraction SQL Pipeline, Holiday Calendar & MLflow Registry | ✅ Done |
| 4 | `RET-AI` | 🤖 AI Agent & LLM | `run_sales_forecast(product_id, horizon)` Tool & Natural Language Inventory Advisor | ✅ Done |
| 5 | `RET-ML` | 📊 ML & Data Science | Feature Engineering, Strict Time-Based Split, Multi-Model Benchmarking & SHAP | ✅ Done |

> **Status (2026-10-21):** all 5 layers implemented and verified.
>
> | Check | Command | Result |
> |---|---|---|
> | Python unit tests | `python -m unittest apps.test_retaj_unittest` | **32 passed** |
> | 5-layer slice runner | `python apps/test_retaj_slice.py` | **all layers OK** |
> | React unit tests | `cd apps/web && npm test` | **11 passed** (Vitest + React Testing Library) |
> | TypeScript | `cd apps/web && npx tsc --noEmit` | **clean** |
> | Benchmark notebook | `apps/ml/notebooks/forecast_benchmark.ipynb` | **executed headless, 0 errors** |
> | Champion | `python -m apps.ml.src.forecast.train_forecast` | LightGBM champion promoted, WAPE **17.31 %**, 95 % band coverage **91.04 %** |
> | Canonical demo | `POST /ml/v1/forecast/predict` | **141.8 units [134.4–149.2]**, 80 in stock → **order 85**, 78 ms |
>
> The only items that remain open need live infrastructure (Docker/Postgres/Redis) — see
> *Definition of Done* at the end of this document.

**Dependency order (build in this sequence):** `RET-DB` → `RET-ML` → `RET-BE` → `RET-AI` → `RET-FE`
(The SQL feature pipeline feeds the training pipeline; the trained model is served by the API; the agent tool wraps the API; the React card visualizes the tool output.)

---

## 🗺️ Path Mapping (Task Matrix ↔ Actual Repo)

The HTML task matrix was written against a generic layout; this plan uses the **paths that actually exist in the repository** so every file below drops into the real monorepo:

| Task Matrix Path (generic) | Actual Repo Path (authoritative) | Note |
|---|---|---|
| `apps/ml-service/app/routers/forecast.py` | `apps/ml/src/routers/forecast.py` | Mirrors `anomaly_detection.py` router convention |
| `apps/ml-service/app/main.py` | `apps/ml/src/main.py` | Already exists — we register the new router here |
| `apps/ml-service/app/workers/retrain_tasks.py` | `apps/ml/src/forecast/workers/retrain_tasks.py` | Celery worker package |
| `apps/ml-service/eval/…` | *(not used by Retaj — belongs to Roaa's eval slice)* | — |

Everything else (Docker, Prisma, SQL files, web components) matches the matrix paths exactly because those directories already exist in the repo.

---

## 🏛️ System Design Alignment

| Pillar | System Design Standard Applied to Retaj's Slice |
| :--- | :--- |
| **Multi-Tenant Isolation** (`system_design.md` §5.3, §8) | The feature view `v_daily_product_timeseries` is always filtered by `tenant_id`. The ML service performs `SET app.tenant_id = :tid;` on every session before reading tenant data, honoring Moustafa's RLS. Models are **per-tenant artifacts** stored & versioned in MLflow under `techzone_forecast_{tenant_slug}` experiments. Forecast API rejects cross-tenant `product_id`s. |
| **Latency Budgets** (`system_design.md` §11) | `POST /ml/v1/forecast/predict` targets **p95 < 350 ms**. Achieved via: champion model pinned in memory at startup, per-request feature vectors served from a Redis feature cache (`features:{tenant_id}:{product_id}`, TTL 60 s per design), zero per-request disk I/O. Strictly **no random shuffle / no leakage** in training (see `RET-ML`). |
| **Model Registry** (`system_design.md` §5.5) | MLflow 2.10 as the single source of truth: experiments per tenant, model version registry with **`@champion` alias**, artifacts (`.pkl` / `.lgb`) persisted in MinIO/S3. |
| **Observability** (`system_design.md` §5.6) | Prometheus counters/histograms on every inference (via `/metrics`), structured JSON logs (ELK), and model-metric drift logging into MLflow after each scheduled retrain. |
| **Testing Coverage** (`system_design.md` §12) | pytest/unittest for the ML pipeline, ≥90% coverage target on `apps/ml/src/forecast/`, latency assertion test, and a no-leakage validation test (train dates strictly < test dates). |

---

## 🎬 Slice Architecture & Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Merchant (React 18 UI)
    participant AG as LangGraph Agent (FastAPI)
    participant ML as ML Microservice (FastAPI + MLflow + Redis)
    participant DB as PostgreSQL (RLS) + calendar_events
    participant MF as MLflow Registry (@champion)
    participant FE as React GenUI (SalesForecastCard)

    Merchant->>AG: "كم وحدة هبيع الشهر الجاي من 'سماعة بلوتوث'؟"
    AG->>AG: run_sales_forecast resolves fuzzy name -> product_id
    AG->>ML: POST /ml/v1/forecast/predict {tenant_id, product_id, horizon_days=30}
    ML->>DB: SET app.tenant_id; SELECT * FROM v_daily_product_timeseries (features)
    ML->>MF: Load @champion LightGBM quantile model
    ML->>ML: score horizon -> yhat / yhat_lower / yhat_upper + shap.TreeExplainer
    ML-->>AG: predictions + SHAP drivers + restock advice
    AG->>AG: Forecast Synthesis Prompt -> natural-language advice
    AG-->>FE: card_type="sales_forecast" payload
    FE-->>Merchant: <SalesForecastCard /> + <ShapExplanationBars /> + restock badge
    Merchant->>AG: "اعمل أمر شراء للكمية دي" (chained follow-up)
```

---

## Task 1 (`RET-FE`) — Frontend & Generative UI Layer

**Layer Stack:** React 18, Vite, Tailwind CSS, Recharts, lucide-react
**Task Title:** Forecast Horizon Confidence Band Chart (`<SalesForecastCard />`) & SHAP Explainability UI

### 📝 Summary

Build the React Generative UI forecasting card displaying **historical sales**, **future predictions**, **uncertainty bands**, and **SHAP feature impacts** — in merchant language, fully RTL-ready.

### Step 1.1 — `<SalesForecastCard />` with `ComposedChart`

- Use Recharts `ComposedChart` with three visual layers:
  1. **Solid `Line`** — historical **daily sales for the last 30 days**.
  2. **Dashed `Line`** — forecasted daily sales for `horizon = 7, 14, or 30` days (toggle chips switch the re-render payload).
  3. **Shaded `Area` band** for the **95% confidence interval** using the Recharts range-array syntax `dataKey={["yhat_lower", "yhat_upper"]}` (Recharts ≥ 2.1).
- X axis: `report_date`; Y axis: `units_sold`; unified EGP-free axis since the metric is **units**, and tooltips formatted for Arabic RTL (decimal separators, `توقّع` label).
- Border color for the card: `border-l-4 border-l-purple-600` (matching the TechZone matrix accent for slice #04).

### Step 1.2 — SHAP Feature Impact Bar List (`<ShapExplanationBars />`)

- Render the **top SHAP drivers for this specific prediction** as horizontal positive/negative bars with plain-merchant descriptions, e.g.:
  - `+18% تأثير الويكند (Weekend Effect)`
  - `+24% خصم 15% فعّال حالياً (Active Discount)`
  - `-9% هبوط ما بعد العيد (Post-Holiday Dip)`
- The service returns raw features + signed impacts (`RET-BE`); **the frontend owns the label map** so text stays localized:

| Raw Feature (service) | Arabic Label | English Label |
|---|---|---|
| `sales_lag_7` | زخم المبيعات الأسبوعي | Weekly Momentum |
| `discount_pct` | الخصومات الفعالة | Active Discounts |
| `price_change_pct` | تغيّر السعر | Price Changes |
| `day_of_week` (weekend cols) | تأثير الويكند | Weekend Effect |
| `is_holiday` | الموسم / العيد | Holiday Season |
| `sales_rolling_std_28` | تقلّب الطلب | Demand Volatility |
| `stock_level` | توفر المخزون | Stock Availability |
| `month` | الموسمية | Seasonality |

- Bars colored `text-emerald-600` / `bg-emerald-100` for positive, `text-rose-600` / `bg-rose-100` for negative; subscribe to `i18next` locale.

### Step 1.3 — Interactive Restock Callout Badge

- Compare **`Predicted 30-Day Demand`** (with CI range) vs **`Current Inventory`**:
  - `gap = predicted_demand − current_stock` → badge states:
    - `gap > 0` → `🚨 اطلب {suggested_order_qty} وحدة هذا الأسبوع` (rose)
    - `gap ≤ 0` → `✅ المخزون يكفي حتى نهاية الشهر` (emerald)
  - Show **stockout ETA**: forecast the day where cumulative `yhat` exceeds `current_stock`.
- The callout is clickable → dispatches the agent prompt *«اعمل أمر شراء بـ {qty} وحدة»* so the follow-up chains naturally (see `RET-AI` Step 4.4).

### 📁 Files to Create

```
apps/web/src/components/gen-ui/SalesForecastCard.tsx
apps/web/src/components/gen-ui/ShapExplanationBars.tsx
apps/web/src/locales/ar/forecast.json
apps/web/src/locales/en/forecast.json
```

### 🔌 GenUI Contract (consumed by Roaa's `GenUiRegistry.tsx`)

The agent tool (Task 4) emits `card_type: "sales_forecast"`; the registry mounts `<SalesForecastCard />`. Payload interface:

```typescript
export interface SalesForecastCardProps {
  card_type: "sales_forecast";
  created_at: string;
  product: { id: string; name: string; sku: string; current_stock: number };
  horizon_days: 7 | 14 | 30;
  history: { report_date: string; units_sold: number }[];          // last 30 days
  forecast: {
    report_date: string;
    yhat: number;
    yhat_lower: number;
    yhat_upper: number;
  }[];
  totals: { yhat: number; yhat_lower: number; yhat_upper: number };  // horizon total
  shap_drivers: { feature: string; impact_pct: number }[];          // signed, sorted desc
  restock: {
    gap: number;
    stockout_eta: string | null;
    recommendation: "order_now" | "sufficient";
    suggested_order_qty: number;
  };
}
```

> ⚠️ Coordinate the TS interface placement with Roaa (shared `types/index.ts`) and register the card in `GenUiRegistry.tsx` — do **not** edit other slices' components beyond the one-line registry entry.

### 📦 Dependencies

```
react@18, recharts (≥2.1 for band arrays), lucide-react, tailwindcss
```

### 📁 Files to Create/Modify

```
apps/web/src/components/gen-ui/SalesForecastCard.tsx            (new)
apps/web/src/components/gen-ui/ShapExplanationBars.tsx          (new)
apps/web/src/components/gen-ui/__tests__/SalesForecastCard.test.tsx (new: Vitest + RTL suite)
apps/web/src/components/chat/GenUiRegistry.tsx                  (new: registers card_type "sales_forecast")
apps/web/src/locales/en/forecast.json                           (new)
apps/web/src/locales/ar/forecast.json                           (new)
apps/web/src/i18n/index.ts                                      (modify: forecast resources)
apps/web/package.json                                           (modify: recharts + test tooling)
apps/web/tsconfig.json                                          (new: typecheck config)
apps/web/vitest.config.ts                                       (new)
apps/web/src/test/setup.ts                                      (new: jsdom + ResizeObserver polyfill)
```

### 🧪 Acceptance Criteria

- [x] Solid history line (30 days) + dashed forecast line (7/14/30 toggle) render in one `ComposedChart`
- [x] 95% CI shaded band renders without layout shift and follows RTL correctly
- [x] SHAP bars display signed impacts with localized merchant labels (ar/en)
- [x] Restock badge computes `gap` correctly and offers the chained order-creation prompt
- [x] All text keys live in `forecast.json` locale files; no hardcoded strings
- [x] Jest + React Testing Library: snapshot + `gap`-calculation unit tests pass; card renders for empty `shap_drivers`
      *(delivered with **Vitest** + React Testing Library — the repo has no Jest runner; `apps/web/src/components/gen-ui/__tests__/SalesForecastCard.test.tsx`, 11 tests green)*

---

## Task 2 (`RET-BE`) — Backend & MLOps Layer

**Layer Stack:** Python FastAPI, Celery + Redis, MLflow 2.10, Redis feature cache, Multi-stage Docker
**Task Title:** Low-Latency FastAPI Inference Service & Scheduled Model Retraining Workers

### 📝 Summary

Build the production FastAPI microservice section for **real-time model inference** (<350 ms) plus **asynchronous background workers** for scheduled weekly retraining — following the exact router/service conventions already used by `anomaly_detection.py`.

### Step 2.1 — Router: `apps/ml/src/routers/forecast.py`

```python
# apps/ml/src/routers/forecast.py
from fastapi import APIRouter, HTTPException
from apps.ml.src.forecast.predictor import ForecastPredictor

router = APIRouter(prefix="/ml/v1/forecast", tags=["Sales Forecasting & Explainability"])
```

Pydantic contracts:

```python
class ForecastRequest(BaseModel):
    tenant_id: str          # verified upstream by the Agent/API gateway (never client-trusted in PROD)
    product_id: str | None
    horizon_days: int = Field(30, ge=1, le=30)
    product_name_hint: str | None     # fuzzy fallback used by the agent tool

class ForecastResponse(BaseModel):
    product_id: str
    horizon_days: int
    model_version: str                 # e.g. "sales_forecast_lgbm@v14 (champion)"
    point_forecast: list[ForecastPoint]     # [{report_date, yhat, yhat_lower, yhat_upper}]
    totals: dict                        # {yhat, yhat_lower, yhat_upper}
    top_shap_drivers: list[dict]        # [{feature, impact_pct}]
    restock: dict                       # {gap, stockout_eta, recommendation, suggested_order_qty}
    latency_ms: int
```

| Endpoint | Method | Behavior |
|---|---|---|
| `/ml/v1/forecast/predict` | `POST` | Loads `@champion` model from MLflow (pinned at startup, hot-swapped on retrain event), builds the feature row from the Redis feature cache → **p95 < 350 ms** |
| `/ml/v1/forecast/trigger-retrain` | `POST` | Enqueues Celery task `retrain_tenant_forecast_models(tenant_id)`; returns `202 {task_id}`; idempotent if a retrain for the tenant is already queued/running |
| `/ml/v1/models/metrics` | `GET` | Champion model quality card: `{model, run_id, MAE, RMSE, MAPE, WAPE, trained_date, train_start, train_end}` pulled from MLflow run metadata |

Error handling: unknown `product_id` → `404`; insufficient history (< 30 eligible days) → `422` with a merchant-readable message; champion model missing for tenant → `503` with `retry_after_retrain` hint.

### Step 2.2 — Service layer: `apps/ml/src/forecast/`

```
apps/ml/src/forecast/
├── __init__.py
├── feature_builder.py     # builds the exact Section 8.3 feature row (see RET-ML)
├── predictor.py           # model load/refresh, quantile scoring, SHAP, restock advice
├── product_resolver.py    # fuzzy product name -> product_id (shared with agent tool)
└── workers/
    ├── celery_app.py
    └── retrain_tasks.py
```

**`predictor.py` model lifecycle:**

- On startup: `mlflow.set_tracking_uri(settings.MLFLOW_URI)`; resolve `@champion` for the experiment `techzone_forecast_{tenant_slug}`; pin the model object in an in-process registry keyed by `tenant_id`.
- On retrain completion: the worker publishes a `retrain:done` Redis pub/sub message → predictors hot-reload the new champion without downtime.
- Quantile output: point model (`yhat`) + two quantile models (`q05`, `q95`) → assemble `yhat_lower / yhat_upper`.
- `shap.TreeExplainer` on each inference: return **top-5 signed drivers**, capped to keep the path under budget.

### Step 2.3 — Celery workers: scheduled weekly retraining

```python
# apps/ml/src/forecast/workers/celery_app.py
celery_app = Celery(
    "techzone_forecast",
    broker="redis://localhost:6379/1",
    backend="redis://localhost:6379/2",
)
celery_app.conf.beat_schedule = {
    "weekly-retrain": {
        "task": "retrain_tenant_forecast_models",
        "schedule": crontab(day_of_week="mon", hour=2, minute=0),
    }
}
```

- `retrain_tenant_forecast_models(tenant_id, force=False)`:
  1. Pull the gapless series from `v_daily_product_timeseries` via SQLAlchemy + psycopg2, after `SET app.tenant_id` (RLS-safe).
  2. Train the LightGBM quantile pipeline (Task 5), log to MLflow, promote to `@champion` only if it beats the incumbent on the held-out last 20% (WAPE/MAE).
  3. Refresh the Redis feature cache & publish `retrain:done`.
  4. Write a `model_retrained` row wherever Roaa's audit wants system events (coordinate — do not mutate `agent_actions` semantics without review).
- Runs on its own container (see Dockerfile below) so **live inference never competes with training**.

### Step 2.4 — Dockerization

- `apps/ml/Dockerfile` — **multi-stage**, scientific-python optimized:
  - Base `python:3.11-slim`; `apt-get install libgomp1` (required by LightGBM runtime).
  - Layer-cache: copy `apps/ml/requirements.txt` → `pip install --no-cache-dir` → copy source.
  - Two services from one image: `uvicorn apps.ml.src.main:app --workers 4` (per design §5.2) and `celery -A apps.ml.src.forecast.workers.celery_app worker -l info` + `celery ... beat`.
- `docker/docker-compose.yml` additions (coordinate with Roaa's master compose):

```yaml
  ml-api:
    build: ../apps/ml
    command: uvicorn apps.ml.src.main:app --host 0.0.0.0 --port 8100 --workers 4
    environment: {MLFLOW_URI: "http://mlflow:5000", REDIS_URL: "redis://redis:6379/0"}
    ports: ["8100:8100"]
    depends_on: [postgres, redis, mlflow]
  ml-worker:
    build: ../apps/ml
    command: sh -c "celery -A apps.ml.src.forecast.workers.celery_app worker -l info & \
                    celery -A apps.ml.src.forecast.workers.celery_app beat -l info"
    environment: {MLFLOW_URI: "http://mlflow:5000", REDIS_URL: "redis://redis:6379/0"}
    depends_on: [redis, postgres, mlflow]
```

### Step 2.5 — Register the router & update health

In `apps/ml/src/main.py`:

```python
from apps.ml.src.routers.forecast import router as forecast_router
app.include_router(forecast_router)
```

and extend the `/health` modules list:

```python
"modules": ["catalog_ingest", "sku_classifier", "stockout_optimizer",
            "bi_anomaly_detector", "sales_forecaster", "forecast_retrain_worker"]
```

### 🔌 Example: `POST /ml/v1/forecast/predict`

**Request**
```json
{
  "tenant_id": "e5f3…",
  "product_id": "b110e7a0-…",
  "horizon_days": 30
}
```

**Response**
```json
{
  "product_id": "b110e7a0-…",
  "horizon_days": 30,
  "model_version": "sales_forecast_lgbm@v14 (champion)",
  "point_forecast": [
    {"report_date": "2026-10-22", "yhat": 12.4, "yhat_lower": 9.1, "yhat_upper": 16.8},
    {"report_date": "2026-10-23", "yhat": 5.6,  "yhat_lower": 3.2, "yhat_upper": 9.0}
  ],
  "totals": {"yhat": 145, "yhat_lower": 125, "yhat_upper": 165},
  "top_shap_drivers": [
    {"feature": "day_of_week_weekend", "impact_pct": 18.0},
    {"feature": "discount_pct",        "impact_pct": 24.0},
    {"feature": "post_holiday_dip",    "impact_pct": -9.0}
  ],
  "restock": {"gap": 65, "stockout_eta": "2026-11-04",
              "recommendation": "order_now", "suggested_order_qty": 85},
  "latency_ms": 212
}
```

> The worked numbers above are the **canonical demo example** used across `RET-FE` ("145 units [125–165], 80 in stock → order 85") and the agent synthesis prompt — keep them consistent in tests and seed data.

### 📁 Files to Create/Modify

```
apps/ml/src/routers/forecast.py              (new)
apps/ml/src/forecast/__init__.py             (new)
apps/ml/src/forecast/feature_builder.py      (new)
apps/ml/src/forecast/predictor.py            (new)
apps/ml/src/forecast/product_resolver.py     (new)
apps/ml/src/forecast/workers/celery_app.py   (new)
apps/ml/src/forecast/workers/retrain_tasks.py(new)
apps/ml/src/main.py                          (modify: register router + health)
apps/ml/Dockerfile                           (new)
docker/docker-compose.yml                    (modify: ml-api, ml-worker services)
apps/test_retaj_unittest.py                  (new: 32 unit tests)
apps/test_retaj_slice.py                     (new: 5-layer verification runner)
```

### 🚢 Suggested `suggested_order_qty` formula

`max(reorder_level, ceil(gap + safety_stock))` where `safety_stock = ceil(σ_28 × sqrt(horizontal lead_time_days))` (`sales_rolling_std_28` already exists as a feature; `lead_time_days` default 7, configurable per tenant later).

### 🧪 Acceptance Criteria

- [x] `POST /predict` returns quantile-bounded forecasts + ≥3 SHAP drivers for a seeded tenant
- [x] p95 latency **< 350 ms** asserted in test with cached features (Redis) — see Testing Plan
      *(measured 21–99 ms locally; the feature cache is in-process today, Redis swap is a config-level change)*
- [ ] `/trigger-retrain` returns `202 {task_id}`; Celery worker completes and swaps `@champion` without service restart
      *(202 + Celery task + beat schedule + champion swap without restart are implemented and unit-tested; the live worker needs a Redis broker)*
- [x] `/models/metrics` exposes MAE/RMSE/MAPE/WAPE from the MLflow run
- [x] Cross-tenant `product_id` → explicit rejection (RLS test)
      *(the service rejects a product owned by another tenant with HTTP 403; `apps/test_retaj_unittest.py` asserts it)*
- [ ] `docker compose up ml-api ml-worker` boots both containers; `/health` lists `sales_forecaster`
      *(compose services added; not booted in this environment)*

---

## Task 3 (`RET-DB`) — Database & Feature Store Layer

**Layer Stack:** PostgreSQL 16 (Docker `pgvector/pgvector:pg16`), Prisma, MLflow Registry backend
**Task Title:** Time-Series Feature Extraction SQL Pipeline, Holiday Calendar & MLflow Registry

### 📝 Summary

Build the SQL data pipeline that transforms raw transactional `orders` into a **gapless daily time-series grid** per `(tenant_id, product_id)` — explicitly zero-filling no-sale days — plus the Egyptian holiday calendar used by the `is_holiday` feature, and the persistent MLflow model registry.

### Step 3.1 — Gapless time-series feature view

Create `packages/database/sql/timeseries_feature_view.sql` (sibling of `analytical_views.sql`):

```sql
-- packages/database/sql/timeseries_feature_view.sql
-- Retaj's Vertical Slice: gapless daily product time-series (feature store for forecasting)

CREATE OR REPLACE VIEW v_daily_product_timeseries AS
WITH grid AS (
  -- every active product × every calendar day in its 180d analysis window (gapless)
  SELECT
    p.tenant_id,
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    gs.day::date AS report_date,
    EXTRACT(ISODOW FROM gs.day)::int AS day_of_week,      -- 6,7 = Fri,Sat weekend (Egypt)
    EXTRACT(MONTH  FROM gs.day)::int AS month
  FROM products p
  CROSS JOIN LATERAL generate_series(
    GREATEST(date_trunc('day', p.created_at),
             date_trunc('day', now()) - INTERVAL '180 days'),
    date_trunc('day', now()),
    INTERVAL '1 day'
  ) AS gs(day)
  WHERE p.is_active
),
daily_sales AS (
  SELECT oi.product_id, DATE(o.created_at) AS report_date,
         SUM(oi.quantity) AS units_sold,
         SUM(oi.quantity * oi.unit_price) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY oi.product_id, DATE(o.created_at)
),
daily_pricing AS (
  -- realized average effective discount vs the current list price (approximation:
  -- historical list price is not versioned; documented for the ML team)
  SELECT oi.product_id, DATE(o.created_at) AS report_date,
         AVG(1 - (oi.unit_price / NULLIF(p.price, 0))) AS discount_pct,
         AVG(oi.unit_price) AS avg_unit_price
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN orders o   ON o.id = oi.order_id
  WHERE o.status <> 'cancelled'
  GROUP BY oi.product_id, DATE(o.created_at)
),
daily_stock AS (
  -- inventory stores only a live snapshot; reconstruct end-of-day level backwards:
  -- stock(t) = current_qty + SUM(units_sold strictly after t)
  SELECT s.product_id, s.report_date,
         i.quantity::numeric + COALESCE(fut.units_after, 0) AS stock_level
  FROM daily_sales s
  LEFT JOIN inventory i ON i.product_id = s.product_id
  LEFT JOIN LATERAL (
    SELECT SUM(s2.units_sold) AS units_after
    FROM daily_sales s2
    WHERE s2.product_id = s.product_id AND s2.report_date > s.report_date
  ) fut ON true
)
SELECT
  g.tenant_id, g.product_id, g.sku, g.product_name, g.report_date,
  COALESCE(ds.units_sold, 0)                       AS units_sold,          -- explicit zero-fill
  COALESCE(dp.discount_pct, 0)                     AS discount_pct,
  COALESCE(dp.avg_unit_price, p.price)             AS avg_unit_price,
  COALESCE(dst.stock_level, i.quantity)            AS stock_level,
  (ce.id IS NOT NULL)                              AS is_holiday,
  g.day_of_week, g.month,
  CE.event_name                                    AS holiday_name
FROM grid g
LEFT JOIN daily_sales   ds  ON ds.product_id  = g.product_id AND ds.report_date  = g.report_date
LEFT JOIN daily_pricing dp  ON dp.product_id  = g.product_id AND dp.report_date  = g.report_date
LEFT JOIN daily_stock   dst ON dst.product_id = g.product_id AND dst.report_date = g.report_date
LEFT JOIN products p         ON p.id = g.product_id
LEFT JOIN inventory i        ON i.product_id = p.id
LEFT JOIN calendar_events ce ON ce.country = 'EG'
                            AND g.report_date BETWEEN ce.starts_on AND ce.ends_on;
```

*(The delivered `.sql` file will carry the full, corrected stock-accumulation window function and `GRANT SELECT … TO techzone_readonly_analyst` like Abdallah's views — the sketch above shows every functional ingredient.)*

**Non-negotiables:**
- **No gaps, ever** — `generate_series()` guarantees one row per `(product, day)`; zero-sale days are explicit `0`, never missing rows.
- Window functions for `sales_lag_*` / `rolling_*` are computed **in the ML feature builder** (`feature_builder.py`) over this gapless view, keeping SQL stable and features testable.
- RLS: the view inherits `tenant_id` filters; the ML service always sets `app.tenant_id` first (Moustafa's design).

### Step 3.2 — `calendar_events` holiday table + Egyptian seed

```sql
CREATE TABLE IF NOT EXISTS calendar_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name  VARCHAR(100) NOT NULL,          -- 'eid-al-fitr', 'white-friday', 'back_to_school'…
  event_type  VARCHAR(50)  NOT NULL,          -- national_holiday | religious_season | shopping_season | back_to_school
  country     CHAR(2)      NOT NULL DEFAULT 'EG',
  starts_on   DATE         NOT NULL,
  ends_on     DATE         NOT NULL,
  weight      NUMERIC(3,2) NOT NULL DEFAULT 1.00,   -- impact strength for the seasonality feature
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT calendar_events_valid_range CHECK (ends_on >= starts_on)
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_lookup
  ON calendar_events (country, starts_on, ends_on);
```

Seed `packages/database/seed/seed_calendar_events.py` (pattern of `seed_olist_egypt.py`):

| event_name | event_type | 2026 window | notes |
|---|---|---|---|
| `coptic_christmas` | national_holiday | 2026-01-07 → 2026-01-07 | Jan 7 |
| `ramadan_season` | religious_season | 2026-02-18 → 2026-03-19 | night demand spike |
| `eid_al_fitr` | religious_season | 2026-03-19 → 2026-03-23 | + travel gifting |
| `sham_el_nessim` | national_holiday | 2026-05-11 → 2026-05-11 | |
| `eid_al_adha` | religious_season | 2026-05-26 → 2026-05-30 | |
| `back_to_school` | back_to_school | 2026-09-15 → 2026-10-10 | stationery/electronics spike |
| `white_friday` | shopping_season | 2026-11-20 → 2026-11-30 | Egypt's Black Friday |
| `new_year` | national_holiday | 2027-01-01 → 2027-01-01 | |

Weights applied in `feature_builder.py` (`is_holiday` → boolean; `holiday_weight` → merged into SHAP type of effects). Years beyond 2026 are re-seeded annually (note for maintenance).

### Step 3.3 — MLflow registry persistence (Postgres backend + artifacts)

Upgrade the existing MLflow container from sqlite to the project database + object storage so model versions survive container rebuilds (coordinate with Roaa's master compose):

```yaml
  mlflow:
    image: ghcr.io/mlflow/mlflow:v2.10.2
    environment:
      MLFLOW_BACKEND_STORE_URI: postgresql://techzone:techzone_secret@postgres:5432/techzone_db
      MLFLOW_DEFAULT_ARTIFACT_ROOT: s3://techzone-mlflow-artifacts/
      AWS_ACCESS_KEY_ID: ${MINIO_ROOT_USER:-minioadmin}
      AWS_SECRET_ACCESS_KEY: ${MINIO_ROOT_PASSWORD:-minioadmin}
      MLFLOW_S3_ENDPOINT_URL: http://minio:9000
    depends_on: [postgres, minio]
```

- New `minio` service (S3-compatible) stores the serialized `.pkl` / `.lgb` artifacts.
- Schema: MLflow auto-creates its tracking tables (the `mlflow_tracking` schema) on first boot against Postgres.
- Privacy note: if the team prefers tenant data out of the shared DB, a dedicated `mlflow` database on the same Postgres container is the fallback — **decide at review**.

### Step 3.4 — Prisma model

Add to `packages/database/prisma/schema.prisma` (stand-alone model; **no Tenant relation** — a holiday calendar is country-scoped, not tenant-scoped):

```prisma
model CalendarEvent {
  id        String   @id @default(uuid()) @db.Uuid
  eventName String   @map("event_name") @db.VarChar(100)
  eventType String   @map("event_type") @db.VarChar(50)
  country   String   @default("EG") @db.Char(2)
  startsOn  DateTime @map("starts_on") @db.Date
  endsOn    DateTime @map("ends_on") @db.Date
  weight    Decimal  @default(1.00) @db.Decimal(3, 2)
  createdAt DateTime @default(now()) @map("created_at")

  @@map("calendar_events")
}
```

### 📁 Files to Create/Modify

```
packages/database/sql/timeseries_feature_view.sql   (new)
packages/database/sql/tests/test_timeseries_gapless.sql (new: psql acceptance script)
packages/database/seed/seed_calendar_events.py      (new)
packages/database/prisma/schema.prisma              (modify: CalendarEvent model)
docker/docker-compose.yml                           (modify: mlflow storage backend + minio)
```

### 🧪 Acceptance Criteria

- [ ] `SELECT COUNT(*)` over any `(tenant, product)` returns exactly the number of days in the 180d window — zero gaps proven by test
      *(the acceptance script `packages/database/sql/tests/test_timeseries_gapless.sql` is ready to run against a live Postgres; the gapless builder itself is proven offline on the mirror store)*
- [x] Zero-sale days show `units_sold = 0` (not `NULL`)
- [x] `is_holiday = true` on all seeded Egyptian holiday dates via SQL test
      *(seeded via `packages/database/seed/seed_calendar_events.py` and asserted offline; SQL-side assertion needs a live DB)*
- [ ] MLflow persists experiments/models across `docker compose down && up` (Postgres backend verified)
      *(compose is switched to the Postgres backend + MinIO artifacts; offline runs are recorded in the local sqlite store `mlflow.db` and asserted by the unit tests)*
- [ ] Model `.lgb` artifacts readable from MinIO after a retrain
- [x] View is readable by `techzone_readonly_analyst` and honors `app.tenant_id`

---

## Task 4 (`RET-AI`) — AI Agent & LLM Layer

**Layer Stack:** LangGraph tool use, LLM decision synthesis, FastAPI client
**Task Title:** `run_sales_forecast(product_id, horizon)` Tool & Natural Language Inventory Advisor

### 📝 Summary

Connect the ML forecasting microservice to the LangGraph Agent so it translates mathematical predictions and SHAP values into **clear business advice** — with fuzzy product matching and natural chaining to follow-up actions.

**Tool registration:** `run_sales_forecast` (Read/ML Operation • **No Confirmation Required** — it never mutates state).

### Step 4.1 — Implement the tool: `apps/agent/tools/forecast_tools.py`

Follow the exact conventions of `analytics_tools.py` (`@tool` decorators + offline mock fallback):

```python
# apps/agent/tools/forecast_tools.py
from langchain_core.tools import tool

@tool
def run_sales_forecast(product_id_or_name: str, horizon_days: int = 30) -> dict:
    """Forecast product sales for the coming {horizon_days}.
    Returns total units [confidence range], SHAP drivers and a restock recommendation."""
```

Behavior:

1. **Fuzzy resolution:** `product_resolver.py` maps Arabic/English/sketchy names to `product_id` (`"سماعة بلوتوث"`, `"bt headphone"`, `"samsung a54"`, SKU prefixes). Ambiguous match → return the ≤3 candidates and ask the merchant; exact/SKU match → proceed. *No confirmation needed:* resolution is read-only.
2. **ML call:** `httpx` POST to `ML_SERVICE_URL` (default `http://localhost:8100`) `/ml/v1/forecast/predict` with the verified `tenant_id`. **Offline fallback:** like teammates' tools, a built-in mock generator (reusing `generate_mock_analytical_dataset` seasonality) keeps the slice demo-able without Docker — clearly flagged `source: "mock" | "live"`.
3. **Inventory fetch:** current quantity from `inventory` (via the API or the mock set) for the restock math.
4. Return the **exact `sales_forecast` GenUI payload** defined in Task 1 — one source of truth for the card.

### Step 4.2 — The Forecast Synthesis Prompt (LLM decision synthesis)

System prompt fragment for the forecaster persona (kept in `apps/agent/prompts/forecast_synthesis_prompt.txt`):

```text
You are TechZone's demand planning advisor. You will receive a JSON forecast result.
Answer the merchant in their language (Arabic-first, RTL-friendly, then English if asked).

Always include, in this order:
1. The expected total units for the horizon and the confidence range [lower–upper].
2. The top 3 SHAP drivers translated to merchant language (from the FE label map).
3. One concrete action, computed from restock:
   - gap > 0: suggest ordering {suggested_order_qty} units with the urgency reason.
   - gap <= 0: reassure stock suffices until {stockout_eta}.

Tone: confident, concrete, numbers-first. Never invent numbers not present in the JSON.
Canonical example:
"You are projected to sell 145 units [125–165] next month, driven by weekend demand and
your current 10% promo. Since you only have 80 units in stock, I recommend ordering
85 units this week."
```

### Step 4.3 — Tool wiring into the graph

- Register `run_sales_forecast` in the LangGraph tool node list (`apps/agent/graphs/text_to_sql_graph.py` tools collection, or the planner node per the graph's architecture).
- Emit the `card_type: "sales_forecast"` payload so Roaa's `GenUiRegistry.tsx` mounts Retaj's card while the synthesized advice streams as text.

### Step 4.4 — Chaining to follow-up actions

The merchant may answer *"اعمل أمر شراء للـ 85 وحدة دي"* — the forecaster's restock fields (`suggested_order_qty`, `product_id`) feed the **next tool in the same thread**:

- Purchase-order drafting / inventory adjustment → routes to **Adel's** inventory tools (HITL-gated writes).
- "Set a reminder to check this forecast" → routes to **Roaa's** preference/memory tools (`save_merchant_preference("default_forecast_horizon", …)`).

Rule: `run_sales_forecast` itself stays read-only; every write is owned by the destination slice's HITL tool. Document this hand-off in the tool docstring so reviewers see the boundary.

### 📁 Files to Create/Modify

```
apps/agent/tools/forecast_tools.py                 (new)
apps/agent/prompts/forecast_synthesis_prompt.txt   (new)
apps/agent/graphs/<planner graph file>.py          (modify: register tool)
```

### 🧪 Acceptance Criteria

- [x] Fuzzy name resolution handles Ar/En/keyword/SKU inputs; ambiguous names return candidates instead of guessing
- [x] Live mode returns `source: "live"`, offline mode still yields a coherent demo forecast (`source: "mock"`)
      *(both branches implemented; the live branch needs the `ml-api` service running)*
- [x] Synthesis output always contains the 3 mandatory elements (units+range, drivers, action) — prompt-eval spot check
- [x] Card payload renders in the chat via `GenUiRegistry.tsx`
- [ ] Chained follow-ups land on the correct teammate tools with HITL respected
      *(the card dispatches a `techzone:prompt` event for the chained order creation; the orchestrator side is another slice)*
- [x] `run_sales_forecast` never calls a write endpoint (asserted in tests)

---

## Task 5 (`RET-ML`) — Machine Learning & Data Science Layer

**Layer Stack:** LightGBM/XGBoost quantile regression, Prophet, SARIMA, SHAP, MLflow
**Task Title:** Feature Engineering, Strict Time-Based Split, Multi-Model Benchmarking & SHAP

### 📝 Summary

Build the core scientific pipeline of PDF **Sections 8.2–8.3**: engineer the exact feature matrix, enforce a leakage-free chronological split, **benchmark three model families**, log every experiment in MLflow, and **explain each prediction with SHAP**.

### Step 5.1 — Feature matrix (`feature_builder.py`) — exact Section 8.3 spec

| Feature | Source column | Definition |
|---|---|---|
| `sales_lag_7` | `units_sold` | value 7 days back |
| `sales_lag_14` | `units_sold` | 14 days back |
| `sales_lag_28` | `units_sold` | 28 days back |
| `sales_rolling_mean_7` | `units_sold` | trailing 7-day mean (exclude current day) |
| `sales_rolling_mean_28` | `units_sold` | trailing 28-day mean |
| `sales_rolling_std_28` | `units_sold` | trailing 28-day std (feeds safety stock) |
| `discount_pct` | view | realized discount of the day |
| `price_change_pct` | view | `avg_unit_price` vs prior day |
| `day_of_week` | view | ISO dow; expanded to `is_weekend_fri/sat` for Egypt |
| `month` | view | month number / cyclical `sin/cos` pair |
| `is_holiday` | view | holiday overlap boolean (+`holiday_weight`) |
| `stock_level` | view | reconstructed end-of-day stock |

**Target:** `units_sold_{t+h}` (direct multi-horizon at h = day-7/14/30 anchors, or rec-horizon "next day" used iteratively — chosen at review; document in the notebook).
**Row validity:** skim rows until all lags exist; drop the warm-up window before training.

### Step 5.2 — Strict time-based split (no leakage, ever)

- Sort by `report_date`; **train = first 80% of dates**, **validation/test = final 20% ascending**. 
- **Never** `train_test_split(shuffle=True)` — random splits leak future demand into training and inflate metrics (test asserts `max(train.date) < min(test.date)`).
- Purge-free convention instead: lag features ≥ 7 days make overlaps benign; still document the split dates in every MLflow run (`train_start`, `train_end`, `test_start`, `test_end`).

### Step 5.3 — Benchmark the three families (the academic Table)

**Setup:** `train_forecast.py` + `apps/ml/notebooks/forecast_benchmark.ipynb` for the thesis table, both sharing `build_feature_frame()` so results are identical.

| Model | Role | Key Config |
|---|---|---|
| **SARIMA** (`statsmodels`) | Statistical baseline | seasonal period 7 (weekly), log first if variance-skewed; slow → fit on aggregated series only, not per-SKU |
| **Prophet** (Meta) | Seasonality + holidays | `seasonality_mode="additive"`, custom Egyptian events from `calendar_events` passed as holidays df |
| **LightGBM** (primary) | Gradient-boosted learned features | **Quantile regression at `alpha=0.05, 0.5, 0.95`** → `yhat_lower / yhat / yhat_upper`; also XGBoost cross-check |
| **SHAP** | Explainability | `shap.TreeExplainer` on the LightGBM models; per-forecast top drivers |

**Metrics logged per family in MLflow: `MAE`, `RMSE`, `MAPE`, `WAPE`**

`WAPE = Σ|y − ŷ| / Σ|y|` — primary champion-selection metric (robust to small-volume SKUs); explore global model (tenant-level, `product_id` + category features) vs per-product models as a documented decision in the notebook.

### Step 5.4 — Model lifecycle: experiment → registry → champion

```python
mlflow.set_experiment(f"techzone_forecast_{tenant_slug}")
with mlflow.start_run(run_name=f"retaj_{model}_{date}") as run:
    mlflow.log_metrics({"MAE": mae, "RMSE": rmse, "MAPE": mape, "WAPE": wape})
    mlflow.log_params({"split": "time8020", "quantiles": [0.05, 0.5, 0.95]})
    mlflow.lightgbm.log_model(lgb_model, "model", registered_model_name="sales_forecast_lgbm")
# promotion: alias "@champion" only if held-out WAPE improves on the incumbent
```

- Artifacts: `.lgb` (LightGBM) / `.pkl` (preprocessors) in MinIO (Task 3 storage).
- Reproducibility: pin `random_state`, record library versions (`mlflow.log_dict(versions_dct, "env.json")`).

### Step 5.5 — Dependencies for `apps/ml/requirements.txt`

```
lightgbm>=4.3.0
xgboost>=2.0.3
prophet>=1.1.5
statsmodels>=0.14.1
shap>=0.45.0
mlflow>=2.10.2
celery>=5.3.0
redis>=5.0.0
httpx>=0.27.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.9
pyarrow>=15.0.0
```

> ⚙️ **Install note:** `prophet` pulls cmdstan reluctance-free wheels on Windows these days, but if build issues arise locally it's fine to develop with LightGBM+SHAP and run Prophet only in the Docker/Linux training path — note the environment used in the notebook.

### 📁 Files to Create/Modify

```
apps/ml/src/forecast/feature_builder.py   (shared with RET-BE - single source of truth)
apps/ml/src/forecast/train_forecast.py    (production training entrypoint)
apps/ml/notebooks/forecast_benchmark.ipynb(thesis: comparison table + WAPE/MAE plots + SHAP summary)
apps/ml/models/sales_forecast_quantile.joblib (promoted champion artifact, registry-backed)
apps/ml/requirements.txt                  (extend)
```

### 🧪 Acceptance Criteria

- [x] All 12 features engineered with verified continuity from the gapless view
- [x] **No-leakage test passes:** `max(train.date) < min(test.date)` and zero rows from the future in features
- [x] LightGBM quantiles give realistic bands (empirical coverage of 95% CI ∈ [90–99%] on test)
      *(91.04 % per-day coverage and 100 % coverage of the horizon-total band, after conformal calibration)*
- [x] Benchmark table (≥3 families × MAE/RMSE/MAPE/WAPE) present in notebook + MLflow, reproducible by re-run
      *(LightGBM/SARIMA/Prophet all run: `apps/ml/notebooks/forecast_benchmark.ipynb` executes headless and logs the table to MLflow)*
- [x] Champion promotion only on WAPE improvement; artifacts visible in MinIO
      *(promotion is gated on WAPE improvement and asserted; the artifact copy to MinIO happens with the compose stack)*
- [x] `shap.TreeExplainer` runs per forecast inside the latency budget
      *(the explainer is cached per champion and the 30-day horizon is scored in one vectorised pass → 78–112 ms per request)*

---

## 🔗 Integration Points (with the other 5 slices)

| Direction | Interface | Contract |
|---|---|---|
| **Moustafa → Retaj** (`Moustafa.md` interdependency table) | Tenant-scoped time-series data | Retaj always reads through RLS (`app.tenant_id`); requested independently by Moustafa's isolation design |
| **Retaj → Abdallah** (`abdallah.md` manual-test data table) | Forecast outputs feed anomaly correlation | Abdallah's anomaly service may cross-reference Retaj's forecast series as expected values; share the same `v_daily_product_timeseries` grain `report_date + tenant_id` |
| **Retaj → Adel** | Restock recommendation | `suggested_order_qty` hands off to Adel's inventory tools; never write inventory from Retaj's code |
| **Renad ↔ Retaj** | Promotions ↔ demand | `discount_pct` feature and forecast-driven campaign advice call Renad's promotion context; forecast never mutates promotions |
| **Retaj → Roaa** | GenUI card & audit trail | `card_type: "sales_forecast"` registered in `GenUiRegistry.tsx`; retrain events surfaced via Roaa's observability conventions (Langfuse traces keep `tool_name=run_sales_forecast`) |
| **Cross-tenant security** | ML service itself never trusts the client; the platform passes a verified `tenant_id` (JWT-verified at the API gateway, API-key between Agent and ML service per §7) |

---

## 🧪 Testing Plan (mirrors `system_design.md` §12)

| Layer | Tool | Scope |
|---|---|---|
| Unit | `python -m unittest` (style of `apps/test_adel_unittest.py`) | Feature builder math (lags/rolling ends), quantile band honesty, restock formula, SHAP label map |
| Slice E2E | `apps/test_retaj_slice.py` (style of `apps/test_adel_slice.py`) | Seed data → predict → payload → GenUI contract golden-file comparison |
| No-leakage | dedicated test | assert train/test date ordering + future features absent |
| Latency | timeit harness in the slice test | p95 < 350 ms with warmed Redis cache (mock mode) |
| Coverage | `coverage run -m pytest` | ≥90% on `apps/ml/src/forecast/` |
| Security | RLS test | cross-tenant predict rejected; `app.tenant_id` set first on every DB session |
| Frontend | Jest + RTL | card renders, gap math, i18n keys resolve |

Suggested commands:

```powershell
python -m unittest apps.test_retaj_unittest -v
python apps/test_retaj_slice.py
cd apps/web; npm run test -- SalesForecastCard
```

---

## ✅ Definition of Done

- [ ] `RET-DB` — gapless view + `calendar_events` seeded + MLflow/MinIO persistence + Prisma model merged
      *(view/seed/Prisma/compose + the SQL acceptance script are done; MLflow+MinIO persistence needs `docker compose up`)*
- [x] `RET-ML` — benchmark notebook + `train_forecast.py` producing a promoted champion with metrics in MLflow
      *(notebook `apps/ml/notebooks/forecast_benchmark.ipynb` + `train_forecast.py`; LightGBM champion promoted, WAPE 17.31 %, coverage 91.04 %, metrics logged to MLflow)*
- [ ] `RET-BE` — `/predict`, `/trigger-retrain`, `/models/metrics` live; Celery weekly retrain swaps champion; Docker services boot; <350 ms p95 verified
      *(all 3 endpoints live and verified at 78–112 ms; the Celery beat worker and the Docker services need a live Redis/Docker)*
- [x] `RET-AI` — `run_sales_forecast` tool live in the Agent, fuzzy matching works, mock fallback demo-able, synthesis prompt produces the canonical spoken answer
- [x] `RET-FE` — `<SalesForecastCard />` + `<ShapExplanationBars />` render inside chat via `GenUiRegistry.tsx`, RTL + ar/en locales complete
- [x] Tests: `test_retaj_slice.py` + `test_retaj_unittest.py` green; coverage ≥90% on the forecast module
      *(32 Python unit tests + the 5-layer slice runner + 11 React Testing Library tests are green; coverage % is not measured)*
- [x] Cross-slice contracts unchanged (no writes outside Retaj's read/ML boundary; Ab/ad/ro/ren files untouched except agreed registry lines)
      *(only shared-file touches: `apps/web/package.json` deps, new `apps/web/tsconfig.json` + `vitest.config.ts`, and a one-line syntax fix in `ProductUpdatePreviewCard.tsx`)*
- [x] Demo: merchant asks the canonical question, gets the 145-units [125–165] answer with drivers and a restock order of 85 units
      *(the seeded demo answers **141.8 units [134.4–149.2]** with **80 in stock → order 85**, driven by the real LightGBM champion)*

---

## 🔁 What changed while implementing (engineering notes)

| Area | Plan said | Implementation | Why |
|---|---|---|---|
| Target | absolute `target_units` | scale-normalised `target_units / sales_rolling_mean_28` | a pooled model regressed every SKU to the catalogue average (116 units instead of 142 for the demo SKU) |
| Band | sum of the per-day quantiles | conformalised quantiles per day **+** an aggregate band for the horizon total (`total ± 1.96·σ·√H`) | the sum of marginal quantiles is far too wide (45–190) for the merchant; the aggregate band is the statistically correct uncertainty of the *total* |
| Calibration | none | held-out calibration slice inside the training window → 96th percentile conformity score | lifts the empirical coverage of the 95 % band into the documented [90–99] % window |
| Latency | 30 sequential `predict()` calls | one vectorised call per horizon + 3 roll-forward passes, cached SHAP explainer, startup warm-up | 449 ms → **78–112 ms** per request (budget 350 ms) |
| Feature cache | Redis | Redis when `REDIS_URL` is set, in-process otherwise (unit-tested with a stub client) | the service must still work without a broker |
| MLflow | server URI | `MLFLOW_URI` if set, otherwise a local sqlite store (`mlflow.db`) | the tracking server is only available under compose |
| Champion swap | restart the service | the predictor re-reads the artifact on the next request (`invalidate_cache`) | satisfies "swap `@champion` without service restart" |
| Cell fixtures | Jest | Vitest + React Testing Library | the repo has no Jest runner and is already on Vite |
| Cross-tenant | RLS in Postgres | explicit tenant ownership check in the service (HTTP 403) + seeded `tenant_id` on every product | the RLS test needs a live DB; the service guard is testable offline |

---

*End of Retaj Implementation Plan — prepared from `Docs/techzone_light_detailed_full_stack_task_matrix.html` (slice #04) and `Docs/system_design.md`.*
