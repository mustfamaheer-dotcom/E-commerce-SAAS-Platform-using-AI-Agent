# TechZone: Intelligent Agentic Multi-Tenant E-Commerce & ERP Platform
## Comprehensive Deep-Dive Technical Documentation

---

## 1. Project Overview

### 1.1 Purpose and Target Users
The **TechZone Platform** (incorporating the **Intelligent ERP Data Navigator**) is an enterprise-grade, multi-tenant e-commerce and ERP operating system powered by autonomous AI agents. Rather than forcing merchants, store managers, and business analysts to navigate dozens of disconnected admin forms, tabular grids, and manual SQL query consoles, TechZone provides a conversational command center with execution permissions.

The platform was engineered specifically for the Egyptian and Middle Eastern (MENA) retail and wholesale markets, addressing three core operational realities:
1. **Dialectal NLP & Cultural Grounding:** Native understanding of Egyptian Colloquial Arabic (*اللهجة المصرية العامية*), Franco-Arab business terms (*السيلز*, *البرودكتس*, *الأوردرات*), and local operational contexts (Egyptian Consumer Protection Law 181/2018, Bosta shipping logistics, Paymob/Fawry payment gateways, and EGP currency formatting).
2. **Autonomous Operations with Human-in-the-Loop (HITL):** Capable of executing high-stakes database mutations (bulk discounting across categories, creating targeted win-back vouchers, provisioning stores, and adjusting inventory thresholds) while strictly protecting gross profit margins and requiring visual confirmation prior to transaction commitment.
3. **Conversational Business Intelligence & Predictive MLOps:** Seamlessly bridges tabular OLTP operations with statistical machine learning:
   - Converting natural language questions into safe, AST-validated SQL queries against complex relational schemas (AdventureWorks2019 71-table ERP and Olist Egypt e-commerce databases).
   - Real-time time-series sales forecasting using quantile gradient boosting (LightGBM) with 95% confidence bounds and SHAP explainability.
   - Algorithmic customer segmentation using Log-RFM transformation and K-Means clustering ($K=5$).

**Target Users:**
- **Merchants & Store Owners:** Non-technical entrepreneurs who want to build, theme, and manage an e-commerce store conversationally.
- **Inventory & Operations Managers:** Supply chain personnel tracking stockout velocity, safety stock, and reorder points.
- **Business Analysts & Executives:** Decision-makers querying historical sales, profit drivers, and financial anomalies without writing manual SQL.
- **Storefront Shoppers:** End consumers shopping via modern Spatial Minimalist web interfaces with bilingual Arabic/English search and checkout.

---

### 1.2 High-Level Architecture Summary
The system operates as a **modular monorepo** integrating four primary layers:
1. **Frontend & Generative UI (Vite + React 18):** Provides a dual interface: a customer-facing storefront (Spatial Minimalist design with floating navigation and instant cart drawer) and a merchant command center. When the AI agent executes actions or queries data, the chat interface dynamically renders typed React components (**Generative UI**) such as `<BulkPricePreviewCard />`, `<SalesForecastCard />`, `<AnalyticsResultCard />`, and `<InventoryAlertsList />`.
2. **API & Orchestration Layer (FastAPI & NestJS):** Exposes RESTful endpoints, Server-Sent Events (SSE) streaming connections, and webhook handlers. Implements strict tenant isolation, JWT authentication, request tracing, and security middleware.
3. **Agent & Intelligence Layer (LangGraph):** Orchestrates multi-turn workflows, slot-filling state machines, and tool invocations via a directed cyclic graph (`MasterCommandGraph`). State-modifying operations pause at a Human-in-the-Loop gate, emit a dry-run preview to the frontend, and resume execution only upon cryptographic confirmation.
4. **Data & MLOps Layer (PostgreSQL 16 + Redis + LightGBM + MLflow):** 
   - **PostgreSQL 16** with Row-Level Security (RLS) ensures absolute data isolation between tenant stores.
   - **Redis 7** provides sub-millisecond caching for product catalogs and time-series feature frames.
   - **LightGBM Quantile Models** and **Scikit-learn Pipelines** deliver real-time demand forecasting and RFM segmentation.
   - **Offline GGUF Model Runtime:** A fine-tuned `Qwen2.5-Coder-3B` model quantized to 4-bit (`Q4_K_M`) runs completely offline via CUDA on local hardware (e.g., NVIDIA RTX 3050 4GB VRAM) for air-gapped zero-API enterprise environments.

---

### 1.3 Tech Stack & Key Dependencies

| Layer | Technology | Version | Purpose in Codebase |
| :--- | :--- | :--- | :--- |
| **Languages** | Python | `>= 3.11, < 3.13` | Core AI agents, FastAPI backend, MLOps, training pipelines |
| | TypeScript / Node.js | `^5.4.5` / `>= 20.0` | React web application, NestJS gateway, Prisma schemas |
| | SQL (PostgreSQL & T-SQL) | PostgreSQL 16 / T-SQL | Multi-tenant schema, analytical feature views, RLS policies |
| **Backend & APIs** | FastAPI | `^0.111.0` | High-performance asynchronous REST & SSE streaming API |
| | Uvicorn | `^0.30.0` | ASGI web server implementation |
| | Pydantic | `^2.7.0` | Request/response data validation and serialization |
| | NestJS | `^10.3.8` | Enterprise API gateway microservice (`apps/api`) |
| **Agent & NLP** | LangGraph | `^0.1.0` | StateGraph multi-turn workflow and HITL checkpoint engine |
| | LangChain Core | `^0.2.0` | Agent tool abstraction, message state protocols |
| | Google GenAI SDK | `^2.0.0` | Default cloud LLM provider (`gemini-flash-lite-latest`) |
| | sqlglot | `^25.0.0` | Abstract Syntax Tree (AST) validation for read-only SQL |
| | llama-cpp-python | `^0.2.70` | Offline 4-bit GGUF inference for `Qwen2.5-Coder-3B` |
| **Machine Learning** | LightGBM | `^4.3.0` | Quantile regression ($\alpha \in \{0.025, 0.5, 0.975\}$) forecasting |
| | Scikit-learn | `^1.5.0` | K-Means clustering, TF-IDF vectorization, StandardScaler |
| | SHAP | `^0.45.0` | TreeExplainer feature importance attributions |
| | SciPy & NumPy | `^1.13.0` / `^1.26.0` | Normal distributions, Z-scores, and EWMA velocity |
| | Pandas & PyArrow | `^2.2.0` / `^15.0.0` | Dataframe manipulation, catalog cleaning, Parquet caching |
| | Celery | `^5.3.0` | Asynchronous scheduled model retraining worker |
| **Data & Storage** | PostgreSQL | `16-alpine` / `pgvector` | Primary multi-tenant ACID store with Row-Level Security |
| | SQLite | `3.x` (Built-in) | Zero-setup development and unit test local storage |
| | Prisma ORM | `^5.14.0` | Type-safe database client and migrations (`@techzone/database`) |
| | SQLAlchemy | `^2.0.0` | Python relational ORM and connection pooling |
| | Redis | `7-alpine` | Session management, feature frame caching, idempotency locks |
| | Meilisearch | `v1.6` | Bilingual Arabic/English typo-tolerant search engine |
| | MinIO | `latest` | S3-compatible object store for MLflow artifacts |
| | MLflow | `v2.10.2` | Experiment tracking, model registry, metric logging |
| **Frontend UI** | React | `^18.3.1` | Component-based interactive UI library |
| | Vite | `^5.2.11` | Build tooling and development server |
| | Tailwind CSS | `^3.4.3` | Utility-first styling framework with dark/light themes |
| | Redux Toolkit | `^2.2.5` | Global client-side state management (cart, catalog, wishlist) |
| | TanStack React Query | `^5.39.0` | Server-state caching, pagination, optimistic mutations |
| | Recharts | `^2.12.7` | SVG-based responsive data visualization (charts & KPIs) |
| | i18next & react-i18next | `^23.11.5` / `^14.1.2` | Internationalization and native RTL Arabic support |
| | Lucide React | `^0.383.0` | Minimalist SVG iconography |
| | SheetJS (xlsx) & jsPDF | `^0.18.5` / `^4.2.1` | Client-side spreadsheet and PDF report export |
| **Testing & QA** | Pytest & Unittest | `^9.1.1` | Python test suites, safety suites, and latency benchmarks |
| | Vitest | `^2.1.8` | Fast TypeScript/React component testing |
| | React Testing Library | `^16.1.0` | Component DOM interaction and snapshot assertions |

---

## 2. Architecture & Structure

### 2.1 Repository Layout & Module Responsibilities

```
d:\text-to-sql\
├── apps/                               # Applications & Microservices
│   ├── agent/                          # LangGraph Multi-Agent Command Core
│   │   ├── graphs/                     # Domain state graphs (Master, Catalog, Forecast, Onboarding, Promo, SQL)
│   │   ├── nodes/                      # State graph nodes (hitl_gate_node, memory_context_node)
│   │   ├── observability/              # Distributed tracing (langfuse_tracer.py)
│   │   ├── prompts/                    # Dialect-tuned system prompts and templates
│   │   └── tools/                      # Agent tool definitions (analytics, catalog, forecast, promo, policy, sql)
│   ├── api/                            # NestJS Enterprise API Gateway (TypeScript)
│   │   └── src/                        # Modular controllers, services, guards, and Prisma integrations
│   ├── ml/                             # FastAPI Machine Learning Microservice (Python)
│   │   ├── eval/                       # 100-prompt benchmark dataset, runner, and markdown summary
│   │   ├── models/                     # Serialized model artifacts (.joblib, metrics.json)
│   │   ├── notebooks/                  # Model benchmarking and research Jupyter notebooks
│   │   └── src/                        # ML services (forecast, inventory risk, RFM, anomaly detection, catalog)
│   ├── web/                            # React 18 + Vite Web Application
│   │   └── src/                        # Pages, Storefront, Dashboard, Generative UI cards, Redux store
│   └── test_*_unittest.py              # Individual team member slice verification test suites
├── backend/                            # Unified FastAPI Monolith Application
│   ├── agent/                          # Dialect normalizer, SQL validator, executor, self-correction, tools
│   ├── api/routes/                     # REST routers (agent, analytics, auth, categories, chat, orders, products, etc.)
│   ├── core/                           # Security, JWT auth, middleware, custom error handlers
│   ├── db/                             # SQLAlchemy engine, schema.sql, database seeders, synthetic ERP generators
│   ├── models/                         # Declarative SQLAlchemy models (Tenant, User, Product, Order, etc.)
│   ├── schemas/                        # Pydantic request/response schemas (DTOs)
│   ├── services/                       # Business logic services (AI orchestrator, cart, inventory, order, product, etc.)
│   └── static/uploads/                 # Uploaded store logos and product assets
├── DataSet/                            # Enterprise database backups (AdventureWorks2019.bak)
├── docker/                             # Docker Compose multi-service deployment definitions
├── Docs/                               # System design specifications, architectural plans, and QA reports
├── models/                             # Quantized GGUF models (qwen2.5-coder-3b-egyptian.Q4_K_M.gguf)
├── packages/                           # Shared Monorepo Packages
│   ├── database/                       # Prisma schema, SQL migration scripts, RLS policies, seeders
│   └── search/                         # Meilisearch schema configuration
├── scripts/                            # Development process managers (dev.js, run-backend.js, db checkers)
├── training/                           # Model fine-tuning pipeline (QLoRA, GGUF conversion, evaluation)
├── .env.example                        # Comprehensive environment variable template
├── package.json                        # Monorepo root configuration & execution scripts
├── pnpm-workspace.yaml                 # PNPM monorepo package workspace definitions
└── requirements.txt                    # Top-level Python dependency specification
```

---

### 2.2 System Data Flow

```
+---------------------------------------------------------------------------------------+
|                                MERCHANT / SHOPPER (UI)                                |
|   1. Chat Command: "طبق خصم 15% على السماعات اللي رصيدها اكتر من 50"                  |
|   2. Storefront Checkout: Add to Cart -> Select City (Cairo) -> Pay via Card / COD     |
+------------------------------------------+--------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                               API GATEWAY & MIDDLEWARE                                |
|  - RequestTracingMiddleware: Injects unique X-Trace-ID & logs latency                 |
|  - PromptGuardMiddleware: Regex & token inspection for prompt injection / PII         |
|  - TenantContextGuard: Extracts tenant_id from verified JWT (prevents client spoofing) |
+------------------------------------------+--------------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v (Standard CRUD / Storefront)                v (Agentic Conversational)
+---------------------------------------+   +-----------------------------------------------+
|       BUSINESS SERVICES LAYER         |   |         LANGGRAPH MASTER COMMAND GRAPH        |
|  - ProductService: Catalog filtering  |   |  - Guardrail Node: Adversarial screening      |
|  - OrderService: State machine logic  |   |  - Context Injector: 3-tier memory recall     |
|  - InventoryService: Atomic decrements|   |  - Router Node: Intent classifier (10 routes) |
|  - CouponService: Promo validation    |   +-----------------------+-----------------------+
+-------------------+-------------------+                           |
                    |                                               v
                    |                       +-----------------------------------------------+
                    |                       |           TOOL EXECUTION & DRY-RUN            |
                    |                       |  - Bulk Price Dry-Run: Computes margin diff   |
                    |                       |  - SQL Query Tool: sqlglot AST verification   |
                    |                       |  - Forecast Tool: LightGBM quantiles + SHAP   |
                    |                       +-----------------------+-----------------------+
                    |                                               |
                    |                       +-----------------------+-----------------------+
                    |                       |        HUMAN-IN-THE-LOOP (HITL) GATE          |
                    |                       |  Is mutation state-changing?                  |
                    |                       |  YES -> Pause execution & emit GenUI Card     |
                    |                       |         (<BulkPricePreviewCard />)            |
                    |                       |  NO  -> Proceed directly                      |
                    |                       +-----------------------+-----------------------+
                    |                                               | (On Merchant "Approve")
                    v                                               v
+---------------------------------------------------------------------------------------+
|                             DATA & PERSISTENCE LAYER                                  |
|  - PostgreSQL 16: SET LOCAL app.current_tenant_id = :tenant_id (RLS enforced)         |
|  - Redis 7: Invalidate product cache, verify idempotency lock (idempotency:action_id) |
|  - SQLite: Fallback local ACID storage for zero-dependency development               |
+------------------------------------------+--------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                                RESPONSE SYNTHESIS                                     |
|  - Synthesize Arabic conversational explanation grounded in real DB records           |
|  - Stream SSE events: [thinking -> token -> gen_ui_card -> done]                      |
|  - Update Langfuse trace & AgentAction audit log with execution status                |
+---------------------------------------------------------------------------------------+
```

---

### 2.3 Key Design Patterns
1. **State Graph Orchestration (LangGraph):** Rather than using fragile, unbounded ReAct loops, workflows are modeled as deterministic state graphs with explicit edges, conditional routing, and persistent checkpoints using `MemorySaver`.
2. **Human-in-the-Loop (HITL) Gate Pattern:** Mutating tools do not write to the database directly. They execute a deterministic "dry-run", verify margin floors ($\text{New Price} > \text{Cost Price}$), create a `PENDING_CONFIRMATION` record in `agent_actions`, and wait for an explicit client approval token (`actionId`).
3. **Generative UI (GenUI) Component Registry:** The backend and frontend share a typed card serialization contract (`card_type` + `payload`). The frontend `GenUiDispatcher` dynamically maps payloads into rich React components, decoupling UI presentation from LLM prompt text.
4. **Row-Level Security (RLS) Multi-Tenancy:** Isolation is enforced at the database kernel level using PostgreSQL session variables (`SET LOCAL app.current_tenant_id = :id`). Even if an application bug omitted `WHERE tenant_id = ...`, PostgreSQL denies cross-tenant reads or writes.
5. **AST Sandboxed Text-to-SQL:** Generated queries are parsed into Abstract Syntax Trees using `sqlglot`. Statements containing DDL (`DROP`, `ALTER`, `CREATE`), DML (`UPDATE`, `DELETE`, `INSERT`), or system catalogs (`information_schema`, `pg_catalog`) are rejected before touching the database connection pool.
6. **Dual-Speed Data Architecture:** High-throughput transactional OLTP is cleanly separated from analytical feature extraction views (`v_timeseries_daily_sales`, `v_order_profit_analytics`), allowing LightGBM and statistical services to query feature representations without lock contention.

---

### 2.4 System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Presentation & Client Layer (React 18 + Vite)"]
        UI["Merchant & Customer UI"]
        GenUI["Generative UI Component Registry\n(BulkPricePreview, SalesForecast, AnalyticsResult)"]
        Redux["Redux Toolkit & TanStack Query State"]
    end

    subgraph Gateway["API Gateway & Security (FastAPI / NestJS)"]
        Middleware["RequestTracing & Error Handlers"]
        Guard["PromptGuard & PII Masking Firewall"]
        Auth["JWT & Multi-Tenant Context Guard"]
    end

    subgraph AgentEngine["Agent & Reasoning Core (LangGraph)"]
        MasterGraph["MasterCommandGraph Orchestrator"]
        Memory["3-Tier Context Memory\n(Session, Preference, Audit)"]
        HITL["Human-in-the-Loop Interrupt Gate"]
        Tools["Specialized Tools\n(Catalog, Forecast, Analytics, RFM, Policies)"]
    end

    subgraph MLService["Machine Learning & Intelligence (FastAPI / Celery)"]
        ForecastEngine["LightGBM Quantile Regressor (95% CI)"]
        ShapEngine["SHAP TreeExplainer Attributions"]
        RFMEngine["Log-RFM + K-Means (K=5)"]
        CleanEngine["Catalog Cleaner & Zero-Shot SKU Classifier"]
        AnomalyEngine["Rolling Z-Score & IQR Anomaly Detector"]
    end

    subgraph DataStore["Data & Persistence Layer"]
        PG[("PostgreSQL 16 + pgvector\n(Row-Level Security)")]
        SQLite[("SQLite 3 Engine\n(Zero-Config Dev)")]
        Redis[("Redis 7 Cache & Idempotency")]
        Meili[("Meilisearch v1.6 Bilingual")]
        MLflow[("MLflow Registry & MinIO S3")]
    end

    UI -->|HTTP / SSE Stream| Gateway
    Gateway --> Auth
    Auth --> AgentEngine
    AgentEngine --> Memory
    MasterGraph --> Tools
    Tools --> HITL
    Tools --> MLService
    Gateway --> DataStore
    AgentEngine --> DataStore
    MLService --> DataStore
    Tools -->|Emits GenUI Payload| GenUI
```

---

## 3. Setup & Installation

### 3.1 Prerequisites
- **Operating System:** Windows 10/11, macOS (Apple Silicon or Intel), or Linux (Ubuntu 22.04+).
- **Python:** Version `3.11` or `3.12` installed.
- **Node.js:** Version `18.x` or `20.x` LTS.
- **Package Managers:** `pnpm` (`npm install -g pnpm`) or standard `npm`.
- **Database Engine (Optional for Dev):** Docker Desktop (for running PostgreSQL 16, Redis, Meilisearch, and MLflow). *Note: The system includes a zero-config SQLite mode (`techzone.db`) for immediate offline execution without external databases.*
- **LLM API Key:** Google Gemini API Key (or OpenAI / Groq / local Ollama). *A default Gemini demo key is embedded in `backend/config.py` for immediate evaluation.*

---

### 3.2 Step-by-Step Local Setup

#### Step 1: Clone the Repository
```bash
git clone https://github.com/mustfamaheer-dotcom/Text-To-SQL-AI-Agent-.git
cd Text-To-SQL-AI-Agent-
```

#### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in both the repository root and `backend/`:
```bash
# Windows PowerShell
Copy-Item .env.example .env
Copy-Item .env.example backend/.env

# Linux / macOS
cp .env.example .env
cp .env.example backend/.env
```

#### Step 3: Python Virtual Environment & Dependencies
Create a virtual environment and install the required dependencies:
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Upgrade pip and install core dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install -r apps/ml/requirements.txt
```

#### Step 4: Frontend Dependencies
Install dependencies for the React web application:
```bash
cd apps/web
npm install
cd ../..
```

#### Step 5: Start the Development Server
You can launch both the FastAPI backend (port 8001) and the React Vite frontend (port 5173) with a single command:
```bash
npm run dev
```

Alternatively, start services in separate terminals:
- **Terminal 1 (Backend API):**
  ```bash
  python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
  ```
- **Terminal 2 (Frontend UI):**
  ```bash
  cd apps/web
  npm run dev
  ```

Open your browser to:
- **Web Application & Storefront:** `http://localhost:5173`
- **Backend API Swagger Documentation:** `http://localhost:8001/docs`
- **ML Microservice Swagger Documentation:** `http://localhost:8100/docs` (if started)

---

### 3.3 Environment Variables Reference

| Variable Name | Default Value | Description & Allowed Values |
| :--- | :--- | :--- |
| `ENV` | `development` | Environment tier: `development`, `staging`, `production`. |
| `HOST` | `0.0.0.0` | Network binding interface for the backend server. |
| `PORT` | `8001` | Primary FastAPI backend port. |
| `FRONTEND_PORT` | `5173` | React Vite development server port. |
| `DATABASE_URL` | `sqlite:///./techzone.db` | SQLAlchemy connection string. Set to `postgresql://user:pass@host:5432/dbname` for Postgres. |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL for caching, rate limiting, and frame cache. |
| `JWT_SECRET_KEY` | *(Configured default)* | Cryptographic HMAC secret for signing auth tokens (min 32 chars in production). |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Access token lifespan in minutes (default 7 days). |
| `LLM_PROVIDER` | `gemini` | LLM routing provider: `gemini`, `groq`, `openai`, `local`. |
| `GEMINI_API_KEY` | *(Base64 auto-decoded)* | API key for Google Gemini models. |
| `GEMINI_MODEL` | `gemini-flash-lite-latest` | Model version for Gemini synthesis. |
| `OPENAI_API_KEY` | `""` | Optional API key for OpenAI GPT models. |
| `GROQ_API_KEY` | `""` | Optional API key for Groq Cloud. |
| `USE_LOCAL_LLM` | `false` | When `true`, routes reasoning to local Ollama/vLLM. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Endpoint for local Ollama daemon. |
| `LOCAL_LLM_MODEL` | `qwen2.5-coder:3b` | Target local model identifier. |
| `LANGFUSE_PUBLIC_KEY` | `pk-demo-techzone` | Public key for Langfuse observability. |
| `LANGFUSE_SECRET_KEY` | `sk-demo-techzone` | Secret key for Langfuse observability. |
| `LANGFUSE_HOST` | `http://localhost:3000` | Self-hosted Langfuse web console URL. |
| `MEILISEARCH_HOST` | `http://localhost:7700` | Host URL for Meilisearch full-text search instance. |
| `MEILI_MASTER_KEY` | `masterKeyTechZone123` | Master API key for Meilisearch indexing. |
| `ML_SERVICE_URL` | `http://localhost:8100` | Internal URL for the Python ML microservice. |
| `MLFLOW_TRACKING_URI` | `http://localhost:5000` | URL for the centralized MLflow tracking server. |
| `MLFLOW_ARTIFACT_ROOT`| `s3://techzone-mlflow-artifacts/` | Object storage destination for model weights. |
| `MINIO_ROOT_USER` | `minioadmin` | Access key for MinIO S3 storage. |
| `MINIO_ROOT_PASSWORD` | `minioadmin_secret` | Secret key for MinIO S3 storage. |
| `PAYMOB_API_KEY` | `""` | Egyptian payment gateway merchant token. |
| `BOSTA_API_KEY` | `""` | Egyptian shipping courier integration token. |
| `VITE_API_BASE_URL` | `/api/v1` | Base API route prefix consumed by React HTTP clients. |

---

### 3.4 Running the Test Suites

#### 1. Python Unit Tests (All Slices)
Execute the comprehensive test suites across all 5 engineering vertical slices:
```bash
# Run all slice unit tests (Adel, Abdallah, Moustafa, Renad, Retaj, Roaa)
python -m unittest apps.test_adel_unittest apps.test_abdallah_unittest apps.test_moustafa_unittest apps.test_renad_unittest apps.test_retaj_unittest apps.test_roaa_unittest
```

#### 2. Running the 100-Prompt Academic Benchmark
Evaluate the agent's tool selection accuracy, security block rate, and latency:
```bash
python apps/ml/eval/run_agent_benchmark.py
```

#### 3. Frontend Unit Tests (Vitest & RTL)
Test the React components, theme providers, and Generative UI cards:
```bash
cd apps/web
npm test
```

---

## 4. Core Modules & Components

### 4.1 AI Orchestration & Agent Core

#### `AIOrchestrationService` (`backend/services/ai_orchestrator.py`)
- **Responsibility:** High-level coordinator for e-commerce AI queries. Enforces strict tenant scoping, grounds product prices against the database, masks sensitive PII, executes prompt injection screening, and serializes responses into typed GenUI contracts.
- **Key Methods:**
  - `process_query(tenant_id: str, request: AIQueryRequestDTO) -> AIResponseDTO`: Main processing entrypoint.
- **Internal Logic & Invariants:**
  - Zero-hallucination price grounding: Compares any currency mention in generated text against active database prices. Discrepancies generate non-blocking telemetry alerts.
  - PII Masking: Automatically masks 16-digit card numbers, 14-digit Egyptian national IDs, and plaintext passwords.

#### `MasterCommandGraph` (`apps/agent/graphs/master_command_graph.py`)
- **Responsibility:** LangGraph StateGraph that routes merchant commands into specialized execution nodes across 10 functional domains.
- **State Schema:**
  ```python
  class MasterAgentState(MessagesState):
      tenant_id: str
      session_id: str
      trace_id: Optional[str]
      language: str
      intent_route: str
      card_type: Optional[str]
      tool_output: Optional[Dict[str, Any]]
      security_flag: bool
  ```
- **Public Methods:**
  - `build_master_command_graph() -> CompiledGraph`: Compiles the state graph with a `MemorySaver` checkpointer.

#### `SQLValidator` (`apps/agent/tools/sql_validator.py`)
- **Responsibility:** 5-layer Abstract Syntax Tree (AST) query analyzer using `sqlglot`.
- **Public Method:**
  - `validate_and_sanitize_sql(sql: str, tenant_id: str) -> Tuple[str, Dict[str, Any]]`: Parses and sanitizes SQL.
- **Enforced Security Invariants:**
  - Multi-statement blocking: Raises `SQLSecurityError` if semicolons exist inside query bodies.
  - Read-Only enforcement: Rejects expressions of type `Drop`, `Delete`, `Update`, `Insert`, `Alter`, `Create`, `Command`.
  - System catalog protection: Blocks access to tables starting with `pg_`, `information_schema`, or `sqlite_`.
  - Row cap: Automatically clamps queries without limits or exceeding limits to `LIMIT 500`.

#### `ArabicNormalizer` (`backend/agent/arabic_normalizer.py`)
- **Responsibility:** Normalizes Egyptian dialectal text, removes diacritics (tashkeel), standardizes letter variants (Alef, Ta Marbouta, Ya), and maps colloquial Franco-Arab terms to domain entities.
- **Public Methods:**
  - `normalize_arabic(text: str) -> str`: Cleans and normalizes Arabic strings.
  - `detect_domains(text: str) -> List[str]`: Maps keywords to relational schemas (`Sales`, `Production`, `Purchasing`, `HumanResources`, `Person`).

---

### 4.2 E-Commerce Business Services

#### `ProductService` (`backend/services/product_service.py`)
- **Responsibility:** Tenant-scoped product catalog management, SKU uniqueness verification, pricing, and category mapping.
- **Public Methods:**
  - `list_products(tenant_id: str, filters: ProductFilterParams, page: int, page_size: int) -> Tuple[List[Product], int]`
  - `create_product(tenant_id: str, dto: ProductCreateDTO) -> Product`
  - `get_by_sku(tenant_id: str, sku: str) -> Optional[Product]`

#### `OrderService` (`backend/services/order_service.py`)
- **Responsibility:** Transactional order placement, coupon consumption, customer CRM sync, and state machine transitions.
- **State Machine Map:**
  ```
  PENDING   ──> CONFIRMED ──> PROCESSING ──> SHIPPED ──> DELIVERED ──> REFUNDED
     │              │              │            │           │
     └──> CANCELLED <┘              └──> CANCELLED          └──> RETURNED ──> REFUNDED
  ```
- **Public Methods:**
  - `place_order(tenant_id: str, dto: OrderCreateDTO, user_id: Optional[str]) -> Order`: Atomically decrements inventory, applies discounts, creates order logs, and persists records within a database transaction.
  - `update_status(tenant_id: str, order_id: str, new_status: str, note: Optional[str]) -> Order`: Validates state transition against `VALID_ORDER_TRANSITIONS` before persisting.

#### `InventoryService` (`backend/services/inventory_service.py`)
- **Responsibility:** Stock tracking, threshold adjustment, and atomic reservation.
- **Public Methods:**
  - `reserve_stock_atomic(tenant_id: str, items: List[InventoryReservationItem]) -> None`: Verifies all line items have sufficient stock before decrementing; rolls back and raises `InsufficientStockException` if any SKU is unavailable.

---

### 4.3 Machine Learning & Analytics Engines

#### `StockoutOptimizer` (`apps/ml/src/inventory/stockout_optimizer.py`)
- **Responsibility:** Computes probabilistic stockout risk, safety stock, and reorder points based on normal demand distributions.
- **Mathematical Formulations:**
  $$\text{Safety Stock (SS)} = \lceil Z_{\alpha} \cdot \sigma_d \cdot \sqrt{L} \rceil \quad (\text{where } Z_{0.95} = 1.64485)$$
  $$\text{Reorder Point (ROP)} = (\mu_d \cdot L) + SS$$
  $$\text{Days Until Stockout (DUS)} = \frac{Q_{\text{current}}}{\max(\text{EWMA}_d, \epsilon)}$$
  $$\text{Daily Profit at Risk} = \mu_d \cdot (\text{Price} - \text{Cost}) \quad (\text{if } DUS \le L)$$

#### `ForecastPredictor` (`apps/ml/src/forecast/predictor.py`)
- **Responsibility:** Scores real-time demand forecasts using LightGBM quantile regression models ($\alpha \in \{0.025, 0.5, 0.975\}$) and computes SHAP feature importance attributions.
- **Public Methods:**
  - `predict(product_id: str, horizon_days: int, tenant_id: str) -> Dict[str, Any]`: Generates forecast bands, restock recommendations, and SHAP feature rankings.

#### `RfmSegmentationPipeline` (`apps/ml/src/customers/rfm_service.py`)
- **Responsibility:** Unsupervised customer segmentation using Log-RFM transformation and K-Means clustering.
- **Mathematical Transformation:**
  $$\text{Feature Matrix} = \text{StandardScaler}(\log(1 + [\text{Recency}, \text{Frequency}, \text{Monetary}]))$$
- **Segment Output (5 Clusters):** VIP Champions, Loyal Customers, New Customers, At-Risk of Churn, Hibernating / Lost.

---

## 5. API Documentation

### 5.1 Authentication & Store Management

#### `POST /api/v1/auth/register`
- **Purpose:** Registers a new merchant user and automatically provisions an isolated store tenant.
- **Request Body:**
  ```json
  {
    "email": "merchant@techzone.eg",
    "password": "SecurePassword123!",
    "full_name": "أحمد محمود",
    "phone": "+201012345678",
    "store_name": "متجر الإسكندرية للإلكترونيات",
    "business_type": "إلكترونيات"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": "usr_94a8e2",
      "email": "merchant@techzone.eg",
      "full_name": "أحمد محمود",
      "role": "owner",
      "tenant_id": "tenant-alex-elec"
    },
    "store": {
      "id": "tenant-alex-elec",
      "name": "متجر الإسكندرية للإلكترونيات",
      "slug": "alex-elec-store"
    }
  }
  ```

#### `POST /api/v1/auth/login`
- **Purpose:** Authenticates a user and issues a JWT token.
- **Request Body:** `{"email": "...", "password": "..."}`
- **Response Status Codes:** `200 OK` (success), `401 Unauthorized` (invalid credentials).

---

### 5.2 Conversational AI & Generative UI

#### `POST /api/v1/agent/chat`
- **Purpose:** Synchronous endpoint for merchant interaction with the AI command center.
- **Request Body:**
  ```json
  {
    "message": "عايز اعرف اعلى 5 منتجات مبيعا الشهر ده",
    "tenant_id": "tenant-moustafa-tech",
    "session_id": "sess_84b1a2"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "sessionId": "sess_84b1a2",
    "reply": "إليك المنتجات الـ 5 الأكثر مبيعاً لشهر أكتوبر بناءً على أحدث بيانات المبيعات الحية:",
    "cardType": "products_list_card",
    "payload": {
      "topProducts": [
        {"name": "سماعة Anker Soundcore Life P2", "sales": 142, "revenue": 142000.0},
        {"name": "شاحن Anker 65W GaN Fast Charger", "sales": 98, "revenue": 117600.0}
      ]
    }
  }
  ```

#### `POST /api/v1/agent/chat/stream`
- **Purpose:** Server-Sent Events (SSE) streaming endpoint delivering real-time agent reasoning steps, typewriter tokens, and Generative UI payloads.
- **Event Flow:**
  1. `event: thinking` -> `{"status": "thinking", "step": 1, "message": "🧠 تحليل الاستعلام واستنباط الأهداف التجارية..."}`
  2. `event: thinking` -> `{"status": "thinking", "step": 2, "message": "📊 استعلام قاعدة البيانات ومطابقة سجلات المبيعات الحية..."}`
  3. `event: token` -> `{"token": "إليك "}`
  4. `event: card` -> `{"cardType": "bulk_price_preview", "payload": { ... }}`
  5. `event: done` -> `{"status": "complete"}`

---

### 5.3 Catalog & Bulk Price Mutations (HITL)

#### `POST /api/v1/products/bulk-discount/dry-run`
- **Purpose:** Calculates the impact of a proposed bulk discount, verifies margin floors, and prepares a Human-in-the-Loop preview diff without mutating data.
- **Request Body:**
  ```json
  {
    "category": "Speakers",
    "discount_pct": 15.0,
    "min_stock": 50
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "actionId": "act_9f81a7",
    "summary": {
      "totalAffectedSkus": 3,
      "averageMarginBefore": 38.5,
      "averageMarginAfter": 27.6,
      "hasMarginFloorWarning": false
    },
    "diffItems": [
      {
        "sku": "SPK-JBL-01",
        "name": "JBL Flip 6 Portable Bluetooth Speaker",
        "currentPrice": 4800.0,
        "proposedPrice": 4080.0,
        "costPrice": 2900.0,
        "newMarginPct": 28.9,
        "marginWarning": false
      }
    ]
  }
  ```

#### `POST /api/v1/products/bulk-discount/commit`
- **Purpose:** Confirms and atomically applies an approved bulk discount. Requires the `actionId` generated during the dry-run phase.
- **Request Body:**
  ```json
  {
    "actionId": "act_9f81a7",
    "approved": true
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "تم تطبيق الخصم بنجاح على 3 منتجات.",
    "affectedRows": 3
  }
  ```

---

### 5.4 Machine Learning Microservice Endpoints

| Method | Path | Description | Key Input Fields |
| :--- | :--- | :--- | :--- |
| `POST` | `/ml/v1/forecast/predict` | 30-day demand forecast with SHAP values | `product_id`, `horizon_days`, `tenant_id` |
| `POST` | `/ml/v1/inventory/analyze-risk` | Probabilistic stockout analysis & ROP | `tenant_id`, `service_level`, `lead_time` |
| `POST` | `/ml/v1/customers/segment-rfm` | K-Means customer RFM segmentation | `tenant_id`, `as_of_date` |
| `POST` | `/ml/v1/analytics/detect-anomalies` | Rolling Z-score financial anomaly detection | `metric`, `dates`, `values`, `z_threshold` |
| `POST` | `/ml/v1/catalog/clean` | Cleans uploaded merchant Excel files | Multipart file upload (`.xlsx`, `.csv`) |
| `POST` | `/ml/v1/catalog/classify` | Zero-shot category classifier | `product_names: List[str]` |

---

## 6. Database Schema

### 6.1 Relational Architecture (PostgreSQL & Prisma)
The primary production database is PostgreSQL 16 managed via Prisma ORM (`packages/database/prisma/schema.prisma`).

```mermaid
erDiagram
    TENANTS ||--o{ USERS : "has"
    TENANTS ||--o{ CATEGORIES : "contains"
    TENANTS ||--o{ PRODUCTS : "catalogs"
    TENANTS ||--o{ INVENTORY : "manages"
    TENANTS ||--o{ CUSTOMERS : "records"
    TENANTS ||--o{ ORDERS : "fulfills"
    TENANTS ||--o{ PROMOTIONS : "issues"
    TENANTS ||--o{ AGENT_ACTIONS : "audits"
    TENANTS ||--o{ CHAT_SESSIONS : "stores"

    CATEGORIES ||--o{ PRODUCTS : "groups"
    PRODUCTS ||--|| INVENTORY : "tracks"
    CUSTOMERS ||--o{ ORDERS : "places"
    ORDERS ||--o{ ORDER_ITEMS : "includes"
    PRODUCTS ||--o{ ORDER_ITEMS : "references"
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : "contains"

    TENANTS {
        uuid id PK
        string slug UK
        string name
        string currency
        json theme
        boolean is_active
        datetime created_at
    }

    USERS {
        uuid id PK
        uuid tenant_id FK
        string email
        string password_hash
        string role
        boolean is_active
    }

    PRODUCTS {
        uuid id PK
        uuid tenant_id FK
        uuid category_id FK
        string sku UK
        string name
        decimal price
        decimal cost
        boolean is_active
    }

    INVENTORY {
        uuid id PK
        uuid tenant_id FK
        uuid product_id FK,UK
        int quantity
        int reorder_level
    }

    CUSTOMERS {
        uuid id PK
        uuid tenant_id FK
        string name
        string email
        string phone
        string city
        string rfm_segment
    }

    ORDERS {
        uuid id PK
        uuid tenant_id FK
        uuid customer_id FK
        string status
        decimal total
        string payment_ref
        string shipping_awb
        datetime created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
        decimal discount
    }

    AGENT_ACTIONS {
        uuid id PK
        uuid tenant_id FK
        string tool_name
        json params
        string status
        datetime created_at
    }
```

---

### 6.2 Key Indexes & Constraints
1. **Multi-Tenant Unique Constraints:**
   - `tenants(slug)`: Unique store subdomains.
   - `products(tenant_id, sku)`: SKU uniqueness is strictly scoped per tenant.
   - `customers(tenant_id, email)`: Prevents customer email collisions across different stores.
   - `promotions(tenant_id, code)`: Allows multiple stores to issue coupon `"WELCOME10"` independently.
2. **Performance Indexes:**
   - `orders(tenant_id, customer_id, status, created_at DESC)`: Composite index optimizing RFM customer lookup and lifetime value calculations.
   - `products(tenant_id, category_id, is_active)`: Accelerates store catalog pagination and category filtering.
   - `calendar_events(country, starts_on, ends_on)`: Used by the time-series forecasting engine to quickly inject holiday weights into feature arrays.

---

## 7. Configuration & Deployment

### 7.1 Containerization with Docker Compose
The `docker/docker-compose.yml` file provisions a complete local enterprise infrastructure:

```bash
docker-compose -f docker/docker-compose.yml up -d
```

**Services Provisioned:**
- `postgres`: PostgreSQL 16 with `pgvector` extension and automatic RLS initialization scripts.
- `redis`: Redis 7 alpine on port 6379 for caching and frame storage.
- `meilisearch`: Fast bilingual search instance on port 7700.
- `mlflow` & `minio`: MLOps experiment tracking and S3-compatible artifact storage.
- `langfuse`: Distributed LLM tracing console on port 3000.
- `ml-api` & `ml-worker`: FastAPI ML microservice and Celery retraining worker.

---

### 7.2 Environment Differences

| Feature / Setting | Development | Staging | Production |
| :--- | :--- | :--- | :--- |
| **Database** | SQLite (`sqlite:///./techzone.db`) or local Docker Postgres | PostgreSQL 16 with RLS | Managed AWS RDS / Supabase with Read Replicas |
| **Authentication** | Local JWT with auto-seed admin account | JWT + Clerk Auth Gateway | Strict Clerk JWT / Auth0 with Multi-Factor Auth |
| **LLM Provider** | Google Gemini / Mock / Local GGUF | Gemini Flash / OpenAI GPT-4o-mini | Private vLLM Cluster / Claude 3.5 Sonnet |
| **Search Engine** | In-memory filtering or local Meilisearch | Meilisearch v1.6 Container | Managed Meilisearch Cloud / Elastic Cloud |
| **Worker Queue** | Synchronous execution or Celery local | Celery + Redis Container | Distributed Celery / AWS SQS Workers |

---

## 8. Known Issues, TODOs & Technical Debt

### 8.1 Incomplete Features & Areas for Improvement
1. **SQL Server `pyodbc` Driver Availability on Non-Windows Environments:**
   - The AdventureWorks2019 exploratory slice (`backend/db/dataset_30000_erp.sql`) is designed for Microsoft SQL Server. On Linux/macOS dev machines lacking Microsoft ODBC Driver 18, the system gracefully falls back to the SQLite/PostgreSQL analytical views (`v_order_profit_analytics`).
   - *Target Enhancement:* Containerize an official SQL Server 2019 Linux container inside `docker-compose.yml`.
2. **Scikit-learn Model Serialization Warning:**
   - When loading `apps/ml/models/sku_classifier.joblib`, an `InconsistentVersionWarning` may appear if the model was serialized on Scikit-learn 1.8.0 and loaded under Scikit-learn 1.9.1. The classifier remains functional, but a clean re-serialization with the exact runtime version is recommended.
3. **Decoupled Monorepo API vs. Monolith FastAPI:**
   - Currently, two API backends exist: the full-featured Python FastAPI backend (`backend/main.py`) which hosts all routes, and the NestJS gateway scaffold (`apps/api/`). While FastAPI is currently used as the primary production backend, the NestJS gateway is architected to proxy requests in multi-cloud enterprise setups.

---

## 9. Glossary

| Term / Abbreviation | Definition & Context in Codebase |
| :--- | :--- |
| **AST (Abstract Syntax Tree)** | Structural representation of source code or SQL. Used by `sqlglot` to parse queries and reject dangerous DDL/DML before execution. |
| **DUS (Days Until Stockout)** | Metric calculating how many days current inventory will last based on exponentially weighted daily sales velocity. |
| **EWMA (Exponentially Weighted Moving Average)** | Statistical filter weighting recent sales higher than older sales to estimate current demand velocity. |
| **EX (Execution Accuracy)** | Benchmark metric measuring the percentage of generated SQL queries that return the exact ground-truth relational result set. |
| **GenUI (Generative UI)** | Paradigm where the AI agent does not just output text, but renders interactive React components directly into the conversation stream. |
| **GGUF** | Binary format designed for fast CPU/GPU inference with `llama.cpp`. Used for the offline 4-bit `Qwen2.5-Coder-3B` model. |
| **HITL (Human-in-the-Loop)** | Security pattern requiring explicit human merchant approval before state-mutating actions (like bulk price discounts) are committed to the database. |
| **QLoRA** | Quantized Low-Rank Adaptation. A fine-tuning technique that freezes a 4-bit base LLM and trains small adapter weights to specialize in Egyptian Arabic SQL. |
| **RFM (Recency, Frequency, Monetary)** | Customer behavioral segmentation framework based on how recently they purchased, how often they purchase, and how much they spend. |
| **RLS (Row-Level Security)** | PostgreSQL security mechanism that filters query results at the database engine level according to the session variable `app.current_tenant_id`. |
| **ROP (Reorder Point)** | Inventory threshold ($(\mu_d \cdot L) + SS$) at which a replenishment purchase order must be issued to prevent stockouts. |
| **SHAP (SHapley Additive exPlanations)** | Game-theoretic method explaining model predictions by quantifying the marginal contribution of each feature to the output. |
| **SS (Safety Stock)** | Buffer inventory held to mitigate risk of stockouts caused by demand spikes or supplier lead-time delays ($Z_{\alpha} \cdot \sigma_d \cdot \sqrt{L}$). |
| **VSR (Valid SQL Rate)** | Percentage of generated SQL queries that parse without syntax errors. |
| **WAPE (Weighted Absolute Percentage Error)** | Standard retail forecasting metric measuring model accuracy relative to total sales volume. |
