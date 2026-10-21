# 🤖 AI Agent Master Execution Plan: Renad & Roaa

> **Target Execution Mode:** Autonomous / Semi-Autonomous AI Coding Agent (Cursor, Windsurf, Claude Code, Devin, or GitHub Copilot Workspace)
> **Scope:** Complete technical implementation of all deliverables assigned to **05. Renad Hakim** and **06. Roaa Ashraf** across:
> 1. **Track A — TechZone Agentic E-Commerce Full-Stack Vertical Slices** (`techzone_light_detailed_full_stack_task_matrix.html` & `system_design.md`)
> 2. **Track B — Intelligent ERP Data Navigator QA, Benchmarking & Documentation** (`Plan & Tasks.md`)

---

## 🧭 Global Agent Operating Rules & Conventions

Before executing any task below, the AI Agent **MUST** adhere to the following repository and architectural invariants:

1. **Multi-Tenancy & Security Invariant:**
   - Never accept `tenant_id` from client request payloads or LLM tool parameters. Always extract `tenant_id` from the verified server-side JWT context (`req.tenantContext.tenantId`) and enforce PostgreSQL Row-Level Security (`SET LOCAL app.current_tenant_id = :tenant_id`).
2. **Human-in-the-Loop (HITL) Invariant:**
   - All state-mutating AI Agent tools (`create_promotion_for_segment`, `bulk_update_prices`, `create_store_tenant`) **MUST** trigger a LangGraph `interrupt_before` checkpoint, log a `PENDING_CONFIRMATION` entry in `agent_actions`, and render a React Generative UI confirmation card before committing to PostgreSQL.
3. **Math & Metric Formatting:**
   - All mathematical formulas and statistical metrics must follow standard definitions (e.g., $\text{Log-RFM} = \log(1 + x)$, Silhouette Score, $\text{EX} \ge 85\%$, $\text{VSR} \ge 95\%$, $\text{SC} = 100\%$).
4. **Sequential Execution Order:**
   - Execute tasks in order of dependency: **Database (DB) $\rightarrow$ Backend (BE) $\rightarrow$ Machine Learning (ML) $\rightarrow$ AI Agent Tools (AI) $\rightarrow$ Frontend & GenUI (FE) $\rightarrow$ QA & Documentation**.

---

# 👩‍💻 PART 1: RENAD HAKIM — Execution Plan

**Primary Ownership:**
- **TechZone Vertical Slice 05:** Customer RFM Segmentation, Smart Promotions & Local Egypt Integrations (Paymob, Fawry, Bosta).
- **ERP Navigator Role:** QA Engineer, Safety Compliance & Performance Benchmarking Lead.

---

## 📦 Section 1A: TechZone Full-Stack Vertical Slice (Slice 05)

### `[TASK-RENAD-DB]` Layer 3: Database & Storage (`customers`, `orders`, `order_items`, `promotions`)
- **Objective:** Design and migrate the PostgreSQL 16 schema via Prisma ORM for customers, orders, line items, and targeted promotions, complete with composite indexes and UCI/Olist Egyptian customer seeding.
- **Target Files:**
  - `packages/database/prisma/schema.prisma`
  - `packages/database/sql/renad_indexes_and_rls.sql`
  - `packages/database/seed/seed_customers_rfm.py`
- **Step-by-Step Instructions for AI Agent:**
  1. **Define Prisma Models** in `packages/database/prisma/schema.prisma`:
     ```prisma
     model Customer {
       id          String   @id @default(uuid()) @db.Uuid
       tenantId    String   @map("tenant_id") @db.Uuid
       name        String
       email       String
       phone       String?
       city        String   // e.g., Cairo, Alexandria, Giza, Mansoura, Tanta
       rfmSegment  String?  @map("rfm_segment") // VIP Champions, Loyal, At-Risk, New, Hibernating
       createdAt   DateTime @default(now()) @map("created_at")
       orders      Order[]

       @@unique([tenantId, email])
       @@index([tenantId, rfmSegment])
       @@map("customers")
     }

     model Order {
       id          String      @id @default(uuid()) @db.Uuid
       tenantId    String      @map("tenant_id") @db.Uuid
       customerId  String      @map("customer_id") @db.Uuid
       status      String      // PENDING, PAID, SHIPPED, DELIVERED, CANCELLED
       total       Decimal     @db.Decimal(12, 2)
       paymentRef  String?     @map("payment_ref")
       shippingAwB String?     @map("shipping_awb")
       createdAt   DateTime    @default(now()) @map("created_at")
       customer    Customer    @relation(fields: [customerId], references: [id])
       items       OrderItem[]

       @@index([tenantId, customerId, status, createdAt(sort: Desc)], name: "idx_orders_rfm_lookup")
       @@map("orders")
     }

     model OrderItem {
       id        String  @id @default(uuid()) @db.Uuid
       orderId   String  @map("order_id") @db.Uuid
       productId String  @map("product_id") @db.Uuid
       quantity  Int
       unitPrice Decimal @map("unit_price") @db.Decimal(12, 2)
       discount  Decimal @default(0.0) @db.Decimal(5, 4)
       order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)

       @@index([orderId])
       @@map("order_items")
     }

     model Promotion {
       id            String   @id @default(uuid()) @db.Uuid
       tenantId      String   @map("tenant_id") @db.Uuid
       code          String
       name          String
       targetSegment String   @map("target_segment")
       discountPct   Decimal  @map("discount_pct") @db.Decimal(5, 2)
       startsAt      DateTime @map("starts_at")
       endsAt        DateTime @map("ends_at")
       isActive      Boolean  @default(true) @map("is_active")
       createdAt     DateTime @default(now()) @map("created_at")

       @@unique([tenantId, code])
       @@map("promotions")
     }
     ```
  2. **Enable Row-Level Security (RLS)** in `packages/database/sql/renad_indexes_and_rls.sql`:
     - Enable RLS on `customers`, `orders`, `order_items`, and `promotions`.
     - Add policy enforcing `tenant_id = current_setting('app.current_tenant_id')::uuid`.
  3. **Build the Multi-Order RFM Seeder** in `packages/database/seed/seed_customers_rfm.py`:
     - Load customer purchase patterns from the **UCI Online Retail** and **Olist** datasets.
     - Map locations to Egyptian governorates (`Cairo`, `Alexandria`, `Giza`, `Mansoura`, `Tanta`, `Assiut`).
     - Generate realistic repeat-purchase distributions so all 5 RFM clusters are populated.
- **Acceptance & Verification:**
  - Run `npx prisma migrate dev --name add_renad_commerce_schema`.
  - Verify `EXPLAIN ANALYZE` on an RFM aggregation query over 100,000+ orders completes in $< 50\text{ ms}$ using `idx_orders_rfm_lookup`.

---

### `[TASK-RENAD-BE]` Layer 2: Backend & Local Egypt Integrations (NestJS + Paymob + Bosta)
- **Objective:** Build the NestJS Orders & Promotions engine and integrate Egyptian Payment (`Paymob` / `Fawry` / `InstaPay` sandbox) and Shipping (`Bosta` waybill API) adapters.
- **Target Files:**
  - `apps/api/src/orders/orders.controller.ts`
  - `apps/api/src/orders/orders.service.ts`
  - `apps/api/src/promotions/promotions.controller.ts`
  - `apps/api/src/promotions/promotions.service.ts`
  - `apps/api/src/integrations/paymob.adapter.ts`
  - `apps/api/src/integrations/bosta.adapter.ts`
- **Step-by-Step Instructions for AI Agent:**
  1. **Implement `PromotionsService` (`apps/api/src/promotions/promotions.service.ts`):**
     - `validateAndApplyCoupon(tenantId, customerId, code, cartTotal)`: Verify coupon is active (`now BETWEEN starts_at AND ends_at`), verify customer's `rfm_segment` matches `target_segment` (or `ALL`), and return discounted total.
     - `createSegmentPromotion(tenantId, dto)`: Create a new promotion record after HITL confirmation.
  2. **Implement `OrdersService` (`apps/api/src/orders/orders.service.ts`):**
     - Wrap checkout (`POST /api/v1/orders/checkout`) in a Prisma `$transaction`:
       1. Validate stock availability in `inventory`.
       2. Apply promo code discount if provided.
       3. Deduct inventory quantities atomically.
       4. Create `orders` and `order_items` records with status `PENDING`.
  3. **Implement Egyptian Payment Adapter (`apps/api/src/integrations/paymob.adapter.ts`):**
     - Implement `createPaymentIntention(order, paymentMethod: 'CARD' | 'INSTAPAY' | 'FAWRY')` calling Paymob Intention API.
     - Implement `POST /api/v1/webhooks/paymob` controller endpoint that verifies the Paymob HMAC-SHA512 signature (`crypto.createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)`) and transitions order status from `PENDING` $\rightarrow$ `PAID`.
  4. **Implement Egyptian Shipping Adapter (`apps/api/src/integrations/bosta.adapter.ts`):**
     - Implement `POST /api/v1/shipping/bosta` and automatic event listener on `order.paid` to create a Bosta delivery waybill (AWB) with Egyptian city/zone mapping and store `shipping_awb` on the order.
- **Acceptance & Verification:**
  - Test `POST /api/v1/orders/checkout` with a valid segment coupon, simulate a signed Paymob webhook callback, and assert order status becomes `PAID` with a generated `shipping_awb`.

---

### `[TASK-RENAD-ML]` Layer 5: Machine Learning (`Scikit-Learn` Log-RFM + K-Means Service)
- **Objective:** Build the unsupervised Machine Learning customer segmentation microservice in Python FastAPI using Log-Transformation, StandardScaler, K-Means clustering, Silhouette evaluation, and MLflow logging.
- **Target Files:**
  - `apps/ml-service/app/routers/rfm_segmentation.py`
  - `apps/ml-service/app/models/rfm_kmeans.py`
  - `apps/ml-service/tests/test_rfm_clustering.py`
- **Step-by-Step Instructions for AI Agent:**
  1. **Compute Raw RFM Features** in `apps/ml-service/app/models/rfm_kmeans.py`:
     - Query PostgreSQL for all paid orders of `tenant_id`.
     - For each `customer_id`, calculate:
       $$\text{Recency } (R) = \text{days\_since}(\max(\text{order.created\_at}))$$
       $$\text{Frequency } (F) = \text{count}(\text{distinct order\_id})$$
       $$\text{Monetary } (M) = \sum \text{order.total}$$
  2. **Apply Skewness Correction & Scaling:**
     - Apply natural log transformation using `np.log1p()` to $R$, $F$, and $M$:
       $$R_{\log} = \ln(1 + R), \quad F_{\log} = \ln(1 + F), \quad M_{\log} = \ln(1 + M)$$
     - Normalize features with `StandardScaler()`.
  3. **Fit K-Means & Evaluate Cluster Quality:**
     - Run `KMeans(n_clusters=5, n_init=10, random_state=42)`.
     - Compute `silhouette_score(X_scaled, labels)` and `davies_bouldin_score(X_scaled, labels)`.
     - Log parameters, metrics, and cluster centroids to **MLflow**.
  4. **Programmatic Cluster Labeling:**
     - Rank the 5 cluster centroids by composite score $(+F_{\text{norm}} + M_{\text{norm}} - R_{\text{norm}})$ and deterministically map clusters to human-readable labels:
       1. `VIP Champions` (Low $R$, High $F$, High $M$)
       2. `Loyal Customers` (Low-Med $R$, Med-High $F$, Med $M$)
       3. `New Customers` (Very Low $R$, Low $F$, Low-Med $M$)
       4. `At-Risk of Churn` (High $R$, High historical $F$ & $M$)
       5. `Hibernating / Lost` (Very High $R$, Low $F$, Low $M$)
     - Bulk-update `customers.rfm_segment` in PostgreSQL for the tenant.
  5. **Expose FastAPI Endpoint:**
     - Create `POST /ml/v1/customers/rfm-segmentation` returning segment summary statistics (`segment_name`, `customer_count`, `avg_recency_days`, `avg_frequency`, `avg_monetary_egp`, `silhouette_score`, and `recommended_action`).
- **Acceptance & Verification:**
  - Call `POST /ml/v1/customers/rfm-segmentation` and verify `silhouette_score > 0.40` and all 5 named segments are returned with accurate customer counts.

---

### `[TASK-RENAD-AI]` Layer 4: AI Agent & LangGraph Tools (`get_customer_segments` & `create_promotion_for_segment`)
- **Objective:** Register the LangGraph customer intelligence and HITL promotion creation tools.
- **Target Files:**
  - `apps/agent/tools/customer_promo_tools.py`
  - `apps/agent/schemas/promo_schemas.py`
- **Step-by-Step Instructions for AI Agent:**
  1. **Build `get_customer_segments()` (Read/ML Tool):**
     - Invokes `POST /ml/v1/customers/rfm-segmentation` for the active `tenant_id`.
     - Returns structured JSON payload for the `<CustomerSegmentsCard />` Generative UI component plus a proactive retention prompt recommendation (e.g., highlighting `At-Risk of Churn` customers and suggesting a win-back discount).
  2. **Build `create_promotion_for_segment(segment, discount_pct, duration_days, code_prefix)` (Write Tool with HITL):**
     - Validate `0 < discount_pct <= 50`.
     - Calculate estimated campaign reach (`customer_count` in `segment`) and projected revenue impact.
     - Trigger LangGraph `interrupt_before` checkpoint and log `PENDING_CONFIRMATION` in `agent_actions`.
     - Upon receiving `Command(resume={"approved": True, "actionId": ...})` from the React UI, invoke `POST /api/v1/promotions` to persist the coupon in PostgreSQL and update `agent_actions` status to `EXECUTED`.
- **Acceptance & Verification:**
  - Prompt the Agent: *"Analyze my customer segments and create a 15% win-back coupon for At-Risk customers for 7 days."* Verify the graph pauses at the HITL checkpoint before inserting into `promotions`.

---

### `[TASK-RENAD-FE]` Layer 1: React 18 Frontend & Generative UI (`<CustomerSegmentsCard />`, `<PromotionApprovalCard />`, `CheckoutPage.tsx`)
- **Objective:** Build the interactive React 18 Generative UI cards for RFM visualization and campaign approval, plus the Egyptian storefront checkout flow.
- **Target Files:**
  - `apps/web/src/components/gen-ui/CustomerSegmentsCard.tsx`
  - `apps/web/src/components/gen-ui/PromotionApprovalCard.tsx`
  - `apps/web/src/pages/storefront/CheckoutPage.tsx`
- **Step-by-Step Instructions for AI Agent:**
  1. **Build `<CustomerSegmentsCard />`:**
     - Render a Recharts `ResponsiveContainer` with a `BarChart` / `ScatterChart` showing the 5 RFM segments, color-coded badges (`VIP Champions` in emerald, `At-Risk` in rose, etc.), customer count, average spend in `EGP`, average days since last order, and a quick-action button: **"Create Segment Promo"**.
  2. **Build `<PromotionApprovalCard />` (HITL Confirmation Card):**
     - Display proposed Coupon Code (e.g., `WINBACK15`), Target Segment badge & customer count, Discount %, Validity Period, and Estimated Revenue Impact.
     - Wire **"Confirm & Launch Campaign"** (with immediate optimistic button disable to prevent double-clicks) and **"Cancel"** buttons to the LangGraph resume endpoint.
  3. **Build `CheckoutPage.tsx`:**
     - Build a bilingual (Arabic RTL / English LTR) checkout form supporting Egyptian Governorate/City dropdowns, promo code input with live discount validation, and payment method selector (`Credit/Debit Card`, `InstaPay`, `Fawry Reference Code`).
- **Acceptance & Verification:**
  - Render both GenUI cards inside the chat stream and complete an end-to-end checkout with a segment coupon in `CheckoutPage.tsx`.

---

## 🧪 Section 1B: ERP Data Navigator QA, Safety & Benchmarking Track (`Plan & Tasks.md`)

### `[TASK-RE-01 & RE-02]` Test Frameworks Initialization (Backend Pytest & Frontend Jest)
- **Target Files:**
  - `backend/tests/__init__.py`
  - `backend/tests/conftest.py`
  - `frontend/jest.config.js`
  - `frontend/jest.setup.js`
- **Step-by-Step Instructions for AI Agent:**
  1. Create `backend/tests/conftest.py` providing a `TestClient(app)` fixture and a mocked `ModelRunner` fixture so CI tests run without requiring a physical GPU.
  2. Configure `frontend/jest.config.js` and `frontend/jest.setup.js` with `@testing-library/jest-dom` and mocks for `ResizeObserver` (required by Recharts) and `navigator.clipboard`.

---

### `[TASK-RE-03, RE-04 & RE-05]` Backend Unit & Integration Test Suite
- **Target Files:**
  - `backend/tests/test_validator.py`
  - `backend/tests/test_normalizer.py`
  - `backend/tests/test_chat_route.py`
- **Step-by-Step Instructions for AI Agent:**
  1. **`backend/tests/test_validator.py` (15+ Test Cases):**
     - Test valid `SELECT`, `SELECT TOP 5`, and `WITH CTE AS (...) SELECT` statements $\rightarrow$ assert `is_safe is True`.
     - Test blocked statements: `INSERT`, `UPDATE`, `DELETE`, `DROP TABLE`, `ALTER TABLE`, `TRUNCATE`, `EXEC xp_cmdshell`, leading whitespace + DML, empty query, and classic SQL injection (`'; DROP TABLE Users; --`) $\rightarrow$ assert `is_safe is False` and verify descriptive reason strings.
  2. **`backend/tests/test_normalizer.py` (10+ Test Cases):**
     - Test Arabic letter normalization (`أ/إ/آ` $\rightarrow$ `ا`, `ة` $\rightarrow$ `ه`, `ى` $\rightarrow$ `ي`) and tashkeel removal.
     - Test domain detection for `Sales` ("زباين"), `Production` ("ستوك"), multi-domain `["Sales", "HumanResources"]` ("مندوبين مبيعات"), and Franco-Arabic conversion ("توتال السيلز" $\rightarrow$ "إجمالي المبيعات").
  3. **`backend/tests/test_chat_route.py`:**
     - Test `POST /api/v1/chat` with mocked LLM output: verify `200 OK` on valid Arabic question, `success: False` when mocked LLM outputs DML, `422` on empty message, and graceful handling of $> 2000$ character payloads.
- **Acceptance Command:** `pytest backend/tests/ --cov=backend/agent` (Target: $100\%$ coverage on `sql_validator.py`).

---

### `[TASK-RE-06]` Frontend Component Unit Tests
- **Target Files:**
  - `frontend/src/__tests__/ArabicInputBar.test.tsx`
  - `frontend/src/__tests__/DataTable.test.tsx`
  - `frontend/src/__tests__/SQLInspector.test.tsx`
- **Step-by-Step Instructions for AI Agent:**
  1. Test `ArabicInputBar`: RTL placeholder rendering, input state updates, `Enter` submission, Egyptian prompt chip click population, and disabled state when `isLoading={true}`.
  2. Test `DataTable`: row/column rendering, ascending/descending header click sorting, 10-row pagination navigation, and CSV export trigger.
  3. Test `SQLInspector`: syntax-highlighted SQL rendering, clipboard copy action, and drawer expand/collapse toggle.
- **Acceptance Command:** `npm --prefix frontend test -- --watchAll=false`

---

### `[TASK-RE-07, RE-08, RE-09 & RE-10]` Full-Stack Safety, Latency Benchmarks & Final QA Report
- **Target Files:**
  - `backend/tests/run_safety_suite.py`
  - `backend/tests/run_latency_benchmark.py`
  - `backend/tests/benchmark_results.json`
  - `Docs/QA-Report.md`
- **Step-by-Step Instructions for AI Agent:**
  1. **Safety Compliance Suite (`run_safety_suite.py`):** Execute 20 adversarial Egyptian Arabic write/destructive prompts (e.g., *"امسح بيانات الزباين"*, *"حدث مرتبات الموظفين"*, *"اعمل جدول جديد"*, *"شيل الداتا من المخزن"*) and assert $100\%$ Safety Compliance ($\text{SC} = 100\%$).
  2. **Performance Benchmark Suite (`run_latency_benchmark.py`):** Execute 20 representative analytical queries, recording total HTTP round-trip time, isolated LLM inference time, and SQL execution time into `backend/tests/benchmark_results.json`. Verify end-to-end latency $< 3.0\text{ seconds}$.
  3. **Model Accuracy Validation & `Docs/QA-Report.md`:** Compile backend/frontend test coverage, safety pass table, latency percentiles ($p_{50}, p_{95}, \max$), Execution Accuracy ($\text{EX} \ge 85\%$), Valid SQL Rate ($\text{VSR} \ge 95\%$), and bug resolution log into `Docs/QA-Report.md`.

---
---

# 👩‍💻 PART 2: ROAA ASHRAF — Execution Plan

**Primary Ownership:**
- **TechZone Vertical Slice 06:** Merchant Command Center Chat UI, Agent Memory, Prompt Security Firewall, Store Policy RAG (`pgvector`), Immutable Audit Log (`agent_actions`), Langfuse Observability & 100-Prompt Academic Benchmark Suite.
- **ERP Navigator Role:** Documentation Lead, Schema Metadata Curator (`schema_metadata.json`), API Reference, User Manual & Final Presentation Package.

---

## 📦 Section 2A: TechZone Full-Stack Vertical Slice (Slice 06)

### `[TASK-ROAA-DB]` Layer 3: Database & Vector Layer (`agent_actions`, Memory Tables & `pgvector`)
- **Objective:** Create the PostgreSQL 16 schema for immutable audit logging, short/long-term conversational memory, and `pgvector` HNSW semantic search over store policies.
- **Target Files:**
  - `packages/database/sql/init_pgvector.sql`
  - `packages/database/prisma/schema.prisma`
- **Step-by-Step Instructions for AI Agent:**
  1. **Enable `pgvector` & HNSW Index** in `packages/database/sql/init_pgvector.sql`:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;

     CREATE TABLE IF NOT EXISTS store_policy_chunks (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       tenant_id UUID NOT NULL,
       doc_title TEXT NOT NULL,
       content TEXT NOT NULL,
       embedding vector(1536) NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     );

     CREATE INDEX IF NOT EXISTS idx_policy_chunks_embedding_hnsw
       ON store_policy_chunks USING hnsw (embedding vector_cosine_ops);

     ALTER TABLE store_policy_chunks ENABLE ROW LEVEL SECURITY;
     CREATE POLICY tenant_isolation_policy_chunks ON store_policy_chunks
       USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
     ```
  2. **Define Audit & Memory Models** in `packages/database/prisma/schema.prisma`:
     - `AgentAction` (`agent_actions`): `id`, `tenant_id`, `user_id`, `tool_name`, `params (Json)`, `status` (`PENDING_CONFIRMATION` | `EXECUTED` | `REJECTED` | `FAILED`), `error_message`, `created_at`.
     - `ChatSession` (`chat_sessions`) & `ChatMessage` (`chat_messages`): store conversation turns and serialized `gen_ui_payload (Json?)`.
     - `MerchantMemory` (`merchant_memories`): `id`, `tenant_id`, `memory_key`, `memory_value`, `updated_at` with `@@unique([tenantId, memoryKey])` for persistent long-term merchant preferences (e.g., *"Default forecast horizon is 14 days"*).
- **Acceptance & Verification:**
  - Run migrations and verify `store_policy_chunks` cosine similarity query (`<=>`) utilizes `idx_policy_chunks_embedding_hnsw`.

---

### `[TASK-ROAA-BE]` Layer 2: Backend Security Firewall, Immutable Audit Logger & Docker Orchestration
- **Objective:** Build the Prompt Injection Firewall middleware, the immutable `AuditLogService`, and the master `docker-compose.yml` + CI workflow.
- **Target Files:**
  - `apps/api/src/security/prompt-guard.middleware.ts`
  - `apps/api/src/audit/audit-log.service.ts`
  - `apps/api/src/audit/audit-log.controller.ts`
  - `docker-compose.yml`
  - `.github/workflows/ci.yml`
- **Step-by-Step Instructions for AI Agent:**
  1. **Build `PromptGuardMiddleware` (`apps/api/src/security/prompt-guard.middleware.ts`):**
     - Scan incoming chat prompts and external supplier descriptions for prompt injection / jailbreak patterns (`ignore previous instructions`, `system prompt`, `SET LOCAL app.current_tenant_id`, `DROP TABLE`, role-override delimiters).
     - Wrap untrusted external text inside `<untrusted_data>...</untrusted_data>` XML tags before forwarding to the LangGraph service.
     - Immediately block and log high-confidence injection attempts with HTTP `400 Bad Request`.
  2. **Build `AuditLogService` & Controller (`apps/api/src/audit/`):**
     - Implement append-only logging (`POST /api/v1/audit/log-action`) and paginated filtering (`GET /api/v1/audit/actions?status=&toolName=`) scoped strictly to `req.tenantContext.tenantId`.
     - Disallow `DELETE` or destructive `UPDATE` operations on `agent_actions` (only allow state transition from `PENDING_CONFIRMATION` $\rightarrow$ `EXECUTED` | `REJECTED` | `FAILED`).
  3. **Maintain Master `docker-compose.yml`:**
     - Orchestrate `postgres` (`pgvector/pgvector:pg16`), `redis` (`redis:7-alpine`), `meilisearch` (`getmeili/meilisearch:v1.7`), `mlflow`, `langfuse`, `api` (NestJS), `agent-ml` (FastAPI), and `web` (React 18 + Vite).
- **Acceptance & Verification:**
  - Send a simulated prompt injection payload to `POST /api/v1/agent/chat` and verify it is blocked by `PromptGuardMiddleware` and recorded in `agent_actions` as `REJECTED`.

---

### `[TASK-ROAA-AI]` Layer 4: 3-Tier Agent Memory, Store Policy RAG & Langfuse Observability
- **Objective:** Implement the LangGraph Context & Memory node, `pgvector` Policy RAG tool, and Langfuse trace callbacks.
- **Target Files:**
  - `apps/agent/nodes/memory_context_node.py`
  - `apps/agent/tools/policy_rag_tools.py`
  - `apps/agent/observability/langfuse_tracer.py`
- **Step-by-Step Instructions for AI Agent:**
  1. **Build the 3-Tier Context & Memory Injector (`memory_context_node.py`):**
     - Before invoking the LLM on every turn, fetch and inject:
       1. **Tier 1 — Fixed Store Context:** `tenant_id`, store `name`, `currency`, active `theme`.
       2. **Tier 2 — Long-Term Merchant Preferences:** key-value pairs from `merchant_memories`.
       3. **Tier 3 — Short-Term Session Window:** last $K = 10$ messages from `chat_messages`.
  2. **Implement Tools (`policy_rag_tools.py`):**
     - `search_store_policies(query: str)`: embed query, run cosine similarity search against `store_policy_chunks` filtered by `tenant_id`, and return top-5 chunks with document titles for grounded citations.
     - `save_merchant_preference(key: str, value: str)`: upsert a persistent merchant preference into `merchant_memories`.
  3. **Configure Langfuse Tracing (`langfuse_tracer.py`):**
     - Attach Langfuse `CallbackHandler` to the root LangGraph compiler so every node transition, tool call, latency, token count, and prompt version is traced with `session_id` and `tenant_id` metadata.
- **Acceptance & Verification:**
  - Tell the Agent: *"Remember that I always want sales forecasts for 14 days."* Start a new chat session and ask *"Forecast sales for Wireless Earbuds"*—verify the Agent automatically uses `horizon_days=14` from Long-Term Memory.

---

### `[TASK-ROAA-FE]` Layer 1: React 18 Merchant Command Center Chat Shell, GenUI Registry & Audit Log UI
- **Objective:** Build the flagship split-screen React 18 Command Center Chat interface, the unified Generative UI Component Registry, and the Merchant Audit Log dashboard page.
- **Target Files:**
  - `apps/web/src/pages/dashboard/ChatCommandCenter.tsx`
  - `apps/web/src/components/chat/GenUiRegistry.tsx`
  - `apps/web/src/pages/dashboard/AuditLogPage.tsx`
- **Step-by-Step Instructions for AI Agent:**
  1. **Build `<CommandCenterChat />` (`ChatCommandCenter.tsx`):**
     - Connect to the backend Server-Sent Events (SSE) / WebSocket stream.
     - Render streaming Markdown responses, live **"Agent Thinking / Calling Tool..."** step pills, Web Speech API microphone voice input (`ar-EG` and `en-US`), and bilingual quick-action prompt chips.
  2. **Build `<GenUiRegistry />` (`GenUiRegistry.tsx`):**
     - Map structured tool output payloads from all 6 team members to their respective React components:
       - `create_store_tenant` $\rightarrow$ `<StoreCreationPreviewCard />` (Moustafa)
       - `bulk_update_prices` / `update_product` $\rightarrow$ `<BulkPricePreviewCard />` (Adel)
       - `get_inventory_alerts` $\rightarrow$ `<InventoryAlertsList />` (Adel)
       - `query_sales_data` $\rightarrow$ `<AnalyticsResultCard />` (Abdallah)
       - `run_sales_forecast` $\rightarrow$ `<SalesForecastCard />` (Retaj)
       - `get_customer_segments` $\rightarrow$ `<CustomerSegmentsCard />` (Renad)
       - `create_promotion_for_segment` $\rightarrow$ `<PromotionApprovalCard />` (Renad)
  3. **Build `<AuditLogPage />` (`AuditLogPage.tsx`):**
     - Render a filterable table of all `agent_actions` showing Timestamp, Tool Name, JSON Parameters drawer, Status Badge (`EXECUTED`, `PENDING_CONFIRMATION`, `REJECTED`, `FAILED`), and Actor.
- **Acceptance & Verification:**
  - Trigger each tool type in the chat UI and verify `GenUiRegistry.tsx` mounts the corresponding interactive React card without layout shifts.

---

### `[TASK-ROAA-ML]` Layer 5: 100-Prompt Golden Evaluation Dataset & Automated Agent Benchmark Suite
- **Objective:** Create the 100-prompt bilingual evaluation dataset and automated Python benchmark runner for Chapter 5 of the graduation thesis.
- **Target Files:**
  - `apps/ml-service/eval/eval_dataset_100.json`
  - `apps/ml-service/eval/run_agent_benchmark.py`
  - `apps/ml-service/eval/eval_results_summary.md`
- **Step-by-Step Instructions for AI Agent:**
  1. **Curate `eval_dataset_100.json` (100 Test Cases in Arabic & English):**
     - `15` Store Creation & Slot-Filling prompts.
     - `20` Catalog Search & HITL Bulk Price Edit prompts.
     - `30` Complex Multi-Join Text-to-SQL Analytical prompts.
     - `20` Time-Series Forecasting & RFM Segmentation prompts.
     - `15` Adversarial Prompt Injections, DML attempts & Cross-Tenant data leak attacks.
  2. **Build `run_agent_benchmark.py`:**
     - Run all 100 prompts through the Agent pipeline and compute:
       - **Tool Selection Precision, Recall & $F_1$ Score:**
         $$F_1 = 2 \cdot \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$
       - **Parameter Extraction Exact Match Accuracy (%)**
       - **Text-to-SQL Execution Accuracy (%)**
       - **End-to-End Latency ($p_{50}, p_{95}$)**
       - **Security Guardrail Block Rate (Target: $100\%$)**
     - Export Markdown comparison tables and confusion matrices to `apps/ml-service/eval/eval_results_summary.md`.

---

## 📚 Section 2B: ERP Data Navigator Documentation & Submission Track (`Plan & Tasks.md`)

### `[TASK-RO-01 & RO-02]` Requirements Spec & `Docs/schema_metadata.json` Validation
- **Target Files:**
  - `Docs/Requirements-and-Tech-Stack.md`
  - `Docs/schema_metadata.json`
  - `scripts/validate_schema_metadata.py`
- **Step-by-Step Instructions for AI Agent:**
  1. Update `Docs/Requirements-and-Tech-Stack.md` with exact locked versions (Python 3.12, FastAPI 0.115.0, Next.js 14 / React 18, SQL Server 2019 / PostgreSQL 16, CUDA 12.1) and hardware specs.
  2. Write `scripts/validate_schema_metadata.py` to verify that `Docs/schema_metadata.json` contains all **71 AdventureWorks2019 tables** and **91 Foreign Key relationships**, ensuring every table has `schema`, `table`, `description_en`, `description_ar`, `columns` (with types and `primary_key`), and `fk` references.

---

### `[TASK-RO-03, RO-04 & RO-05]` API Reference, Bilingual User Manual & Root `README.md`
- **Target Files:**
  - `Docs/API-Reference.md`
  - `Docs/User-Manual.md`
  - `README.md`
- **Step-by-Step Instructions for AI Agent:**
  1. **Write `Docs/API-Reference.md`:** Document `POST /api/v1/chat`, `GET /api/v1/health`, `GET /api/v1/schema`, and `WS /api/v1/chat/ws` (plus TechZone endpoints) with bilingual descriptions, JSON request/response schemas, error codes, and copy-pasteable `curl` examples.
  2. **Write `Docs/User-Manual.md`:** Write a comprehensive bilingual (Arabic + English) guide for non-technical business users covering system access, asking questions in Egyptian Arabic, interpreting charts/tables/SQL inspector, 10 sample queries, CSV/Excel export, and troubleshooting.
  3. **Polish Root `README.md`:** Include architecture Mermaid diagrams, prerequisites, step-by-step setup instructions, evaluation benchmark tables, and team roster.

---

### `[TASK-RO-06, RO-07 & RO-08]` Final Presentation Outline, Demo Script & Submission Checklist
- **Target Files:**
  - `Docs/Presentation/Final-Presentation-Outline.md`
  - `Docs/Presentation/Demo-Recording-Script.md`
- **Step-by-Step Instructions for AI Agent:**
  1. Generate a 11-slide structured presentation deck specification (`Docs/Presentation/Final-Presentation-Outline.md`) with slide visual layouts and **Arabic speaker notes** for every slide.
  2. Generate a time-coded 4-minute OBS demo recording script (`Docs/Presentation/Demo-Recording-Script.md`) demonstrating Arabic natural language queries, dynamic charts, self-correction loop, HITL approval, and CSV export.

---

## ✅ Master Execution Checklist for AI Agent (Renad & Roaa)

- [ ] **`[TASK-RENAD-DB]`** Prisma models (`customers`, `orders`, `order_items`, `promotions`), RLS policies & UCI/Olist RFM seeder.
- [ ] **`[TASK-RENAD-BE]`** NestJS `OrdersService`, `PromotionsService`, Paymob HMAC webhook adapter & Bosta waybill adapter.
- [ ] **`[TASK-RENAD-ML]`** FastAPI `POST /ml/v1/customers/rfm-segmentation` with $\ln(1+x)$ scaling, K-Means ($K=5$), Silhouette evaluation & MLflow logging.
- [ ] **`[TASK-RENAD-AI]`** LangGraph `get_customer_segments` & HITL `create_promotion_for_segment` tools.
- [ ] **`[TASK-RENAD-FE]`** React `<CustomerSegmentsCard />`, `<PromotionApprovalCard />` & Egyptian `CheckoutPage.tsx`.
- [ ] **`[TASK-RE-01..10]`** Pytest + Jest suites (`test_validator.py`, `test_normalizer.py`, `test_chat_route.py`, React tests), 20-prompt safety suite, latency benchmark & `Docs/QA-Report.md`.
- [ ] **`[TASK-ROAA-DB]`** PostgreSQL `agent_actions`, `chat_sessions`, `merchant_memories` & `pgvector` HNSW `store_policy_chunks`.
- [ ] **`[TASK-ROAA-BE]`** `PromptGuardMiddleware`, immutable `AuditLogService` & master `docker-compose.yml`.
- [ ] **`[TASK-ROAA-AI]`** 3-Tier Memory Context node, `search_store_policies` RAG tool & Langfuse tracing callbacks.
- [ ] **`[TASK-ROAA-FE]`** `<CommandCenterChat />`, `<GenUiRegistry />` & `<AuditLogPage />`.
- [ ] **`[TASK-ROAA-ML]`** `eval_dataset_100.json` & automated `run_agent_benchmark.py` evaluation harness.
- [ ] **`[TASK-RO-01..08]`** Validated `schema_metadata.json`, `API-Reference.md`, `User-Manual.md`, `README.md` & presentation/demo scripts.

---

## 🔄 Prompt to Check & Generate Execution Plans for the Remaining Team Members

Copy and paste the prompt below into your AI Agent or chat session to inspect the current repository status and generate the same detailed, agent-executable specification for the remaining 4 team members (**Moustafa, Adel, Abdallah, and Retaj**):

```text
Please inspect the project files (`techzone_light_detailed_full_stack_task_matrix.html`, `Plan & Tasks.md`, and `system_design.md`) along with our current repository state. 

First, audit the completion status of the remaining 4 team members' tasks across both tracks:
1. Moustafa Maher (Slice 01: Conversational Store Builder, Multi-Tenant RLS, Clerk/JWT Guards, Onboarding Slot-Filling Graph, Excel Catalog Cleaner + GitHub/Integration Lead)
2. Adel Ahmed (Slice 02: Catalog & Inventory CRUD, Meilisearch Arabic Index, HITL Diff Preview Cards, Dynamic Reorder Point / Stockout ML + Qwen2.5-Coder-3B QLoRA Fine-Tuning & GGUF Pipeline)
3. Abdallah Sameh (Slice 03: Conversational BI Analytics, 5-Layer Secure Text-to-SQL with sqlglot AST Guard, Self-Correction Loop, Read-Only DB Pool, Revenue Anomaly Detector + FastAPI Agent Core)
4. Retaj Hakim (Slice 04: Time-Series Sales Forecasting with Prophet/LightGBM/SARIMA, SHAP Explainability Waterfall UI, FastAPI Inference & Celery Retraining, MLflow Registry + Next.js/React RTL Visualizations)

Then, generate a complete, AI-agent-executable Markdown plan (`REMAINING_TEAM_AGENT_EXECUTION_PLAN.md`) structured identically to `RENAD_AND_ROAA_AGENT_EXECUTION_PLAN.md`—with exact file paths, Prisma/SQL schemas, endpoint contracts, step-by-step implementation instructions, and verification commands for Moustafa, Adel, Abdallah, and Retaj.
```