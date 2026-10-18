# 🚀 Intelligent ERP Data Navigator — Implementation Plan & Task Assignment

> **Project:** Custom-Trained Autonomous Text-to-SQL AI Agent for AdventureWorks2019 with Egyptian Arabic NLP & Modern Web UI
> **Repository:** [github.com/mustfamaheer-dotcom/Text-To-SQL-AI-Agent-](https://github.com/mustfamaheer-dotcom/Text-To-SQL-AI-Agent-)
> **Document Version:** 1.0
> **Created:** October 2026
> **Status:** Active — Development Starting

---

## 👥 Team Roster & Roles

| # | Name | Primary Role | Secondary Responsibility |
|---|------|-------------|--------------------------|
| 1 | **Moustafa Maher** | Project Lead & Full-Stack Architect | GitHub management, integration, final review |
| 2 | **Adel Ahmed** | AI Model Engineer & Training Pipeline | Backend agent orchestration |
| 3 | **Abdallah Sameh** | Backend Engineer (FastAPI & Agent Core) | Database layer & SQL execution |
| 4 | **Retaj Hakim** | Frontend Developer (Next.js UI/UX) | RTL design, chat interface, visualizations |
| 5 | **Renad Hakim** | QA Engineer & Testing Lead | Performance benchmarking, safety testing |
| 6 | **Ro'aa Ashraf** | Documentation Lead & Presentation | User manual, slides, demo video |

---

## 📅 Master Timeline (10 Weeks)

```
Week  1-2  │ Phase 0 – Environment Setup, Repository & Project Infrastructure
Week  3-4  │ Phase 1 – Dataset Creation & Model Fine-Tuning (Training Pipeline)
Week  5-6  │ Phase 2 – Backend Core: FastAPI + Agent Modules
Week  7-8  │ Phase 3 – Frontend Core: Next.js UI, RTL, Chat, Visuals
Week  9    │ Phase 4 – Integration, End-to-End Testing & Performance Tuning
Week  10   │ Phase 5 – Documentation, Presentation, Demo & Final Submission
```

---

## 🗂️ Full Project Directory (Target State)

```
Text-To-SQL-AI-Agent-/
├── DataSet/
│   └── AdventureWorks2019.bak
├── Docs/
│   ├── schema_metadata.json
│   ├── Requirements-and-Tech-Stack.md
│   ├── System-Design-and-Technical-Plan.md
│   ├── Plan & Tasks.md                  ← THIS FILE
│   ├── User-Manual.md
│   └── API-Reference.md
├── training/
│   ├── dataset/
│   │   ├── generate_synthetic_data.py
│   │   ├── train_dataset.json
│   │   └── val_dataset.json
│   ├── train_lora.py
│   ├── convert_to_gguf.py
│   └── evaluate_model.py
├── models/
│   └── qwen2.5-coder-3b-egyptian.Q4_K_M.gguf
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── tests/
│   ├── agent/
│   │   ├── model_runner.py
│   │   ├── arabic_normalizer.py
│   │   ├── prompt_templates.py
│   │   ├── schema_loader.py
│   │   ├── sql_validator.py
│   │   ├── sql_executor.py
│   │   ├── self_correction.py
│   │   ├── answer_synthesizer.py
│   │   └── chart_recommender.py
│   └── api/routes/
│       ├── chat.py
│       ├── health.py
│       └── schema.py
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/
│       │   ├── chat/
│       │   ├── visualizations/
│       │   └── sql/
│       ├── hooks/
│       ├── lib/
│       └── types/
├── .gitignore
└── README.md
```

---

## ✅ Acceptance Criteria (Project Done When All Pass)

| Criterion | Target |
|-----------|--------|
| Execution Accuracy (EX) | ≥ 85% on validation dataset |
| Valid SQL Rate (VSR) | ≥ 95% of generated queries are syntactically valid |
| Safety Compliance (SC) | 100% — zero DML/DDL ever reaches SQL Server |
| End-to-End Latency | < 3.0 seconds per query (RTX 3050 GPU) |
| UI RTL Rendering | Perfect Right-to-Left layout with Cairo font |
| Self-Correction Loop | Retry on error up to 3 times automatically |
| Frontend-Backend Integration | 100% functional on local machine |
| Documentation | Complete README, User Manual, API Reference, Presentation |

---

---

# 📋 DETAILED TASK ASSIGNMENTS

---

## 👤 1. Moustafa Maher — Project Lead & Full-Stack Architect

> **Responsibility:** Sets up all foundations, owns GitHub management, leads integration, reviews all code, and drives the project from start to finish.

---

### 🔧 Phase 0 Tasks (Week 1–2): Project Infrastructure

#### TASK-M-01: Initialize GitHub Repository & Branch Strategy
- **What to do:**
  - Set the `main` branch as protected (no direct pushes; PRs required).
  - Create branches: `dev`, `feat/backend`, `feat/frontend`, `feat/training`, `feat/docs`.
  - Set up **branch protection rules** on GitHub: require at least 1 review before merging to `main`.
- **How to do it:** Go to GitHub repo settings → Branches → Add branch protection rule.
- **Deliverable:** Working GitHub repository with proper branching strategy.

#### TASK-M-02: Set Up GitHub Project Board (Kanban)
- **What to do:**
  - Create a GitHub Project (v2) with columns: `Backlog`, `In Progress`, `Review`, `Done`.
  - Add all tasks from this document as GitHub Issues.
  - Label issues by area: `training`, `backend`, `frontend`, `QA`, `docs`.
  - Assign each issue to the responsible team member.
- **Deliverable:** Fully populated GitHub project board linked to the repository.

#### TASK-M-03: Create `.gitignore` File
- **What to do:** Create a comprehensive `.gitignore` that protects large files:
  ```
  # Model files
  *.gguf
  *.bin
  models/

  # Database backup
  *.bak
  DataSet/

  # Python
  __pycache__/
  *.pyc
  .venv/
  *.egg-info/

  # Node.js
  node_modules/
  .next/
  out/

  # Environment
  .env
  .env.local

  # OS
  .DS_Store
  Thumbs.db
  ```
- **Deliverable:** `.gitignore` committed to `main`.

#### TASK-M-04: Create Root `README.md`
- **What to do:** Write a comprehensive README with:
  - Project title, description, and architecture overview diagram.
  - Prerequisites (Python 3.12, Node.js 22, SQL Server 2019, NVIDIA GPU drivers, CUDA).
  - Step-by-step **local setup** for both backend and frontend.
  - How to run the training pipeline.
  - How to run the full system end-to-end.
  - Team members section.
  - License (MIT or university policy).
- **Deliverable:** `README.md` at project root, kept updated throughout the project.

#### TASK-M-05: Set Up Python Virtual Environment & requirements files
- **What to do:**
  - Create `backend/requirements.txt` with exact package versions:
    ```
    fastapi==0.115.0
    uvicorn[standard]==0.30.6
    pyodbc==5.1.0
    sqlglot==25.0.0
    python-dotenv==1.0.1
    pydantic==2.8.2
    websockets==13.0
    httpx==0.27.0
    ```
  - Create `training/requirements_training.txt`:
    ```
    torch==2.4.0
    transformers==4.44.0
    peft==0.12.0
    trl==0.10.1
    bitsandbytes==0.43.3
    datasets==2.21.0
    accelerate==0.33.0
    ```
- **Deliverable:** Both requirements files committed.

---

### 🔧 Phase 4 Tasks (Week 9): Full Integration

#### TASK-M-06: Wire Frontend to Backend (CORS & API Client)
- **What to do:**
  - Configure CORS in FastAPI `main.py` to allow `http://localhost:3000`.
  - Create `frontend/src/lib/api.ts` — a typed Axios client that:
    - Has a base URL from environment (`NEXT_PUBLIC_API_URL`).
    - Exposes functions: `sendMessage(text: string)`, `getSchema()`, `getHealth()`.
    - Handles errors (network errors, 4xx/5xx) with proper TypeScript types.
  - Test: Open UI, type an Arabic query, verify it hits backend and response renders.
- **Deliverable:** Full end-to-end working query flow.

#### TASK-M-07: WebSocket Streaming Integration
- **What to do:**
  - Create `frontend/src/hooks/useAgentStream.ts` — a React hook that:
    - Connects to `ws://localhost:8000/api/v1/chat/ws`.
    - Receives streamed tokens from the model.
    - Exposes `{ thinking, sqlQuery, isComplete }` state.
  - Show a live "thinking" animation in the chat while the model streams.
- **Deliverable:** Real-time streaming visible in the chat UI.

#### TASK-M-08: Final Code Review & Merge
- **What to do:**
  - Review all open PRs from all team members.
  - Resolve merge conflicts on `dev` branch.
  - Run the complete system locally and verify all acceptance criteria.
  - Merge `dev` → `main` for final release.
- **Deliverable:** Clean, production-ready `main` branch.

---

---

## 👤 2. Adel Ahmed — AI Model Engineer & Training Pipeline

> **Responsibility:** The most critical technical component. Owns 100% of the model training pipeline, dataset creation, and AI inference integration.

---

### 🔧 Phase 0 Tasks (Week 1–2): Environment Setup

#### TASK-A-01: Set Up Training Environment
- **What to do:**
  - Install CUDA 12.1 and verify `nvidia-smi` shows RTX 3050.
  - Create a Python virtual environment (`.venv`) inside `training/`.
  - Install all packages from `training/requirements_training.txt`.
  - Verify PyTorch sees the GPU: `python -c "import torch; print(torch.cuda.is_available())"` → must print `True`.
  - Create a Google Colab notebook as backup training environment (store in `training/colab_train.ipynb`).
- **Deliverable:** Working GPU-enabled Python environment confirmed.

#### TASK-A-02: Download & Verify Base Model
- **What to do:**
  - Download `Qwen2.5-Coder-3B-Instruct` from Hugging Face:
    ```python
    from transformers import AutoModelForCausalLM, AutoTokenizer
    model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-Coder-3B-Instruct")
    tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-Coder-3B-Instruct")
    ```
  - Run a quick zero-shot inference test with a basic SQL question to confirm the model loads.
  - Note the baseline performance (before fine-tuning).
- **Deliverable:** Base model loaded and zero-shot tested. Output logged to `training/baseline_test.txt`.

---

### 🔧 Phase 1 Tasks (Week 3–4): Dataset Creation & Model Fine-Tuning

#### TASK-A-03: Build the Synthetic Dataset Generator (`generate_synthetic_data.py`)
- **What to do:** Write `training/dataset/generate_synthetic_data.py` that:
  1. Reads `Docs/schema_metadata.json` to get all 71 table definitions.
  2. For each of the 5 business domains (`Sales`, `Production`, `Purchasing`, `HumanResources`, `Person`), generates 200 training samples.
  3. Each sample must follow this **exact JSON structure**:
     ```json
     {
       "id": "eg_aw_00001",
       "domain": "Sales",
       "instruction": "Convert the user question asked in Egyptian Arabic into an accurate Microsoft SQL Server T-SQL query using the provided schema.",
       "schema_context": "Table: Sales.SalesOrderHeader (SalesOrderID, OrderDate, CustomerID, TotalDue)\n...",
       "input_prompt": "وريني أكتر 5 زباين دفعوا فلوس السنة اللي فاتت",
       "output_sql": "SELECT TOP 5 ...",
       "explanation_ar": "تم استخراج أعلى 5 عملاء..."
     }
     ```
  4. Generates Egyptian Arabic variations using a lookup table for key business phrases (reference Section 3.2 of System Design doc).
  5. Saves to `training/dataset/train_dataset.json` (800+ items) and `val_dataset.json` (200+ items).
- **Egyptian Arabic phrase patterns to cover (mandatory):**
  - Count queries: كام عدد، كم مرة
  - Top N queries: أكتر، أعلى، التوب، أفضل
  - Sum queries: إجمالي، مجموع، التوتال
  - Average queries: متوسط، الأفريج
  - Filter queries: اللي في، الخاصة بـ، بتاع
  - Date ranges: السنة اللي فاتت، الشهر ده، آخر كوارتر
  - All domain entities: زباين، مندوبين، موردين، منتجات، مخزن، مرتبات
- **Deliverable:** `train_dataset.json` (≥ 800 samples) + `val_dataset.json` (≥ 200 samples).

#### TASK-A-04: Write QLoRA Fine-Tuning Script (`train_lora.py`)
- **What to do:** Write `training/train_lora.py` implementing:
  1. Load `Qwen2.5-Coder-3B-Instruct` in 4-bit NF4 quantization (`bitsandbytes`).
  2. Configure LoRA with: `r=16`, `lora_alpha=32`, `lora_dropout=0.05`.
  3. Target modules: `q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`.
  4. Use `SFTTrainer` from TRL library with the dataset.
  5. Format each sample as a ChatML prompt:
     ```
     <|im_start|>system
     You are a T-SQL database expert...
     <|im_end|>
     <|im_start|>user
     Database Schema:
     {schema_context}

     Question:
     {input_prompt}
     <|im_end|>
     <|im_start|>assistant
     ```sql
     {output_sql}
     ```
     <|im_end|>
     ```
  6. Training config: 3–5 epochs, learning rate `2e-4`, cosine scheduler, batch size 2, gradient accumulation steps 4.
  7. Save LoRA adapter weights to `training/lora_adapter/`.
- **Deliverable:** `train_lora.py` + trained LoRA adapter saved.

#### TASK-A-05: Convert Model to GGUF Format (`convert_to_gguf.py`)
- **What to do:** Write `training/convert_to_gguf.py` that:
  1. Merges LoRA adapter into the base model: `model = model.merge_and_unload()`.
  2. Saves merged FP16 checkpoint to `training/merged_model/`.
  3. Calls `llama.cpp` conversion script: `python llama.cpp/convert_hf_to_gguf.py training/merged_model/ --outfile models/qwen2.5-coder-3b-egyptian-sql.Q4_K_M.gguf --outtype q4_K_M`.
  4. Verifies GGUF file is created and is approximately 1.9 GB.
- **Deliverable:** `models/qwen2.5-coder-3b-egyptian-sql.Q4_K_M.gguf` file ready for backend.

#### TASK-A-06: Write Model Evaluation Script (`evaluate_model.py`)
- **What to do:** Write `training/evaluate_model.py` that:
  1. Loads the GGUF model via `llama-cpp-python`.
  2. Iterates over all 200 samples in `val_dataset.json`.
  3. For each sample: generates SQL → executes against SQL Server → compares result set to gold SQL result set.
  4. Calculates and prints:
     - **Execution Accuracy (EX):** % of queries where result matches gold.
     - **Valid SQL Rate (VSR):** % of queries that are syntactically valid.
  5. Saves full report to `training/evaluation_report.json`.
- **Target:** EX ≥ 85%, VSR ≥ 95%.
- **Deliverable:** `evaluate_model.py` + `evaluation_report.json` with final scores.

---

### 🔧 Phase 2 Tasks (Week 5–6): Backend AI Module

#### TASK-A-07: Implement `model_runner.py`
- **What to do:** Create `backend/agent/model_runner.py`:
  ```python
  from llama_cpp import Llama
  import os

  class ModelRunner:
      def __init__(self, model_path: str):
          self.llm = Llama(
              model_path=model_path,
              n_gpu_layers=35,   # All layers to RTX 3050
              n_ctx=4096,
              n_threads=8,
              verbose=False
          )

      def generate_sql(self, system_prompt: str, user_prompt: str) -> str:
          """Generate T-SQL from a formatted ChatML prompt."""
          response = self.llm.create_chat_completion(
              messages=[
                  {"role": "system", "content": system_prompt},
                  {"role": "user", "content": user_prompt}
              ],
              max_tokens=512,
              temperature=0.1,   # Low temp for deterministic SQL
              stop=["<|im_end|>", "```\n"]
          )
          return response["choices"][0]["message"]["content"]
  ```
- **Deliverable:** `model_runner.py` with `ModelRunner` class, tested locally.

#### TASK-A-08: Implement `prompt_templates.py`
- **What to do:** Create `backend/agent/prompt_templates.py` with:
  - `SYSTEM_PROMPT_SQL_GEN`: The system prompt for SQL generation (read-only, schema-qualified, TOP N rules).
  - `SYSTEM_PROMPT_REFLECTION`: The system prompt for self-correction (includes previous failed query and error).
  - `SYSTEM_PROMPT_SYNTHESIS`: The system prompt for generating the Arabic summary from data rows.
  - `build_sql_prompt(schema_context, user_question) -> str`
  - `build_reflection_prompt(failed_sql, error_msg, schema_context, user_question) -> str`
  - `build_synthesis_prompt(user_question, sql_query, data_rows) -> str`
- **Deliverable:** `prompt_templates.py` fully implemented.

---

---

## 👤 3. Abdallah Sameh — Backend Engineer (FastAPI & Agent Core)

> **Responsibility:** Builds the entire FastAPI backend application, all agent modules except the model runner, and the database execution layer.

---

### 🔧 Phase 0 Tasks (Week 1–2): Backend Setup

#### TASK-AB-01: Initialize FastAPI Project Structure
- **What to do:**
  - Create `backend/main.py` with:
    ```python
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from api.routes import chat, health, schema

    app = FastAPI(title="ERP Data Navigator API", version="1.0.0")
    app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])
    app.include_router(chat.router, prefix="/api/v1")
    app.include_router(health.router, prefix="/api/v1")
    app.include_router(schema.router, prefix="/api/v1")
    ```
  - Create `backend/config.py` with a Pydantic `Settings` class reading from `.env`.
  - Create `backend/.env.example`:
    ```
    MODEL_PATH=../models/qwen2.5-coder-3b-egyptian-sql.Q4_K_M.gguf
    DB_SERVER=localhost\SQLEXPRESS
    DB_NAME=AdventureWorks2019
    DB_DRIVER=ODBC Driver 17 for SQL Server
    MAX_ROWS=1000
    QUERY_TIMEOUT=30
    ```
  - Verify the server runs: `uvicorn main:app --reload --port 8000`.
- **Deliverable:** FastAPI server starts successfully with no errors.

#### TASK-AB-02: Set Up SQL Server Connection (`sql_executor.py`)
- **What to do:** Create `backend/agent/sql_executor.py`:
  ```python
  import pyodbc
  from config import settings

  class SQLExecutor:
      def __init__(self):
          conn_str = (
              f"DRIVER={{{settings.DB_DRIVER}}};"
              f"SERVER={settings.DB_SERVER};"
              f"DATABASE={settings.DB_NAME};"
              "Trusted_Connection=yes;"
          )
          self.conn = pyodbc.connect(conn_str, timeout=settings.QUERY_TIMEOUT)

      def execute(self, sql: str) -> dict:
          """Execute SQL, return {columns, rows, error}. Max MAX_ROWS rows."""
          cursor = self.conn.cursor()
          try:
              cursor.execute(sql)
              columns = [col[0] for col in cursor.description]
              rows = cursor.fetchmany(settings.MAX_ROWS)
              return {"columns": columns, "rows": [list(r) for r in rows], "error": None}
          except pyodbc.Error as e:
              return {"columns": [], "rows": [], "error": str(e)}
          finally:
              cursor.close()
  ```
- **Test:** Connect to `AdventureWorks2019`, run `SELECT TOP 5 * FROM Sales.SalesOrderHeader`.
- **Deliverable:** `sql_executor.py` verified against live database.

---

### 🔧 Phase 2 Tasks (Week 5–6): Agent Modules

#### TASK-AB-03: Implement `arabic_normalizer.py`
- **What to do:** Create `backend/agent/arabic_normalizer.py` with `ArabicNormalizer` class:
  - **`normalize(text: str) -> str`**: Fix character ambiguities:
    - Normalize `أ / إ / آ` → `ا`
    - Normalize `ة` → `ه`
    - Normalize `ى` → `ي`
    - Remove diacritics (tashkeel).
    - Strip extra whitespace and punctuation.
  - **`detect_domain(text: str) -> list[str]`**: Scan the normalized text for domain keywords and return matching domains:
    - `Sales` keywords: زبون، زباين، أوردر، طلبية، مبيعات، سيلز، عائد، إيراد
    - `Production` keywords: منتج، منتجات، بضاعة، تصنيع، مخزن، ستوك، ويرهاوس
    - `Purchasing` keywords: مورد، موردين، فيندور، شراء، مشتريات
    - `HumanResources` keywords: موظف، مرتب، قبوض، مندوب، بتوع السيلز
    - `Person` keywords: شخص، اسم، عنوان، تليفون
  - **`franco_to_arabic(text: str) -> str`**: Map Franco-Arabic business terms:
    - `توتال` → إجمالي، `سيلز` → مبيعات، `أوردرات` → طلبيات
- **Deliverable:** `arabic_normalizer.py` with unit tests passing.

#### TASK-AB-04: Implement `schema_loader.py` (RAG Pruner)
- **What to do:** Create `backend/agent/schema_loader.py`:
  - **`load_catalog(path: str) -> dict`**: Load `Docs/schema_metadata.json` at startup (once).
  - **`prune_schema(domains: list[str]) -> str`**: Given detected domains, return a compact schema string containing ONLY the relevant tables with their column names and types, and their direct FK relationships. Format:
    ```
    Table: Sales.SalesOrderHeader (SalesOrderID INT, OrderDate DATETIME, CustomerID INT, TotalDue MONEY)
    FK: CustomerID → Sales.Customer.CustomerID

    Table: Sales.Customer (CustomerID INT, PersonID INT, StoreID INT)
    FK: PersonID → Person.Person.BusinessEntityID
    ```
  - Maximum context injected: 2,000 tokens (approximately 3–5 tables).
- **Deliverable:** `schema_loader.py` verified to return correct pruned schema for sample queries.

#### TASK-AB-05: Implement `sql_validator.py` (AST Safety Gate)
- **What to do:** Create `backend/agent/sql_validator.py` using the `sqlglot` library:
  ```python
  import sqlglot
  from sqlglot.expressions import Insert, Update, Delete, Drop, Alter, Create

  BLOCKED_TYPES = (Insert, Update, Delete, Drop, Alter, Create)
  BLOCKED_KEYWORDS = ["exec", "xp_", "sp_", "openrowset", "bulk insert"]

  class SQLValidator:
      def validate(self, sql: str) -> tuple[bool, str]:
          """Returns (is_safe, reason). Only SELECT and WITH CTEs allowed."""
          sql_lower = sql.lower().strip()

          # Keyword blocklist check
          for kw in BLOCKED_KEYWORDS:
              if kw in sql_lower:
                  return False, f"Blocked keyword detected: {kw}"

          # Must start with SELECT or WITH
          if not (sql_lower.startswith("select") or sql_lower.startswith("with")):
              return False, "Query must start with SELECT or WITH"

          # AST parse check
          try:
              parsed = sqlglot.parse(sql, dialect="tsql")
              for statement in parsed:
                  if isinstance(statement, BLOCKED_TYPES):
                      return False, f"Blocked statement type: {type(statement).__name__}"
          except Exception as e:
              return False, f"SQL parse error: {str(e)}"

          return True, "OK"
  ```
- **Deliverable:** `sql_validator.py` with 10+ unit tests covering blocked and allowed queries.

#### TASK-AB-06: Implement `self_correction.py` (Reflection Loop)
- **What to do:** Create `backend/agent/self_correction.py`:
  ```python
  class SelfCorrector:
      MAX_RETRIES = 3

      def __init__(self, model_runner, prompt_templates, sql_validator, sql_executor):
          ...

      def run(self, user_question: str, schema_context: str) -> dict:
          """
          Main loop:
          1. Generate SQL
          2. Validate (AST safety)
          3. Execute against DB
          4. If error: build reflection prompt, retry (max 3 times)
          5. Return final result or failure
          """
          for attempt in range(self.MAX_RETRIES):
              sql = self.model_runner.generate_sql(...)
              is_safe, reason = self.sql_validator.validate(sql)
              if not is_safe:
                  return {"success": False, "error": f"Safety violation: {reason}"}
              result = self.sql_executor.execute(sql)
              if result["error"] is None:
                  return {"success": True, "sql": sql, "data": result}
              # Build reflection prompt with error and retry
              ...
          return {"success": False, "error": "Max retries exceeded"}
  ```
- **Deliverable:** `self_correction.py` fully implemented with logging of each retry attempt.

#### TASK-AB-07: Implement `answer_synthesizer.py`
- **What to do:** Create `backend/agent/answer_synthesizer.py`:
  - Takes `user_question`, the executed `sql`, and `data_rows` as input.
  - Builds a synthesis prompt using `prompt_templates.SYSTEM_PROMPT_SYNTHESIS`.
  - Calls `model_runner.generate_sql()` (reused for text generation) to get Arabic summary.
  - Returns a string in Egyptian Arabic like:
    - *"إجمالي مبيعات الخمس منتجات المتصدرة بلغت 16.5 مليون دولار..."*
- **Deliverable:** `answer_synthesizer.py` returning coherent Arabic summaries.

#### TASK-AB-08: Implement `chart_recommender.py`
- **What to do:** Create `backend/agent/chart_recommender.py`:
  - Analyzes the result data shape (column count, types, row count).
  - Returns a chart config dict:
    ```python
    # Logic:
    # - 2 columns (label + numeric) + < 10 rows → PIE chart
    # - 2 columns (label + numeric) + ≥ 10 rows → BAR chart
    # - 2 columns (date + numeric) → LINE chart
    # - 1 numeric column → KPI card
    # - Many columns → TABLE only (no chart)

    def recommend(self, columns: list, rows: list) -> dict:
        return {
            "type": "bar",        # "bar" | "line" | "pie" | "kpi" | "table"
            "x_key": "ProductName",
            "y_key": "TotalRevenue",
            "title": "إجمالي الإيرادات لكل منتج"
        }
    ```
- **Deliverable:** `chart_recommender.py` returning correct chart configs for various data shapes.

---

### 🔧 Phase 2 Tasks (Week 5–6): API Routes

#### TASK-AB-09: Implement `POST /api/v1/chat` Endpoint
- **What to do:** Create `backend/api/routes/chat.py`:
  - Input model: `{ "message": "str", "session_id": "str (optional)" }`
  - Pipeline:
    1. Normalize Arabic input.
    2. Detect domains.
    3. Prune schema.
    4. Run self-correction loop (generates SQL, validates, executes, reflects).
    5. Synthesize Arabic answer.
    6. Recommend chart type.
  - Output model:
    ```json
    {
      "session_id": "uuid",
      "arabic_answer": "إجمالي مبيعات...",
      "sql_query": "SELECT TOP 5...",
      "data": { "columns": [...], "rows": [[...]] },
      "chart_config": { "type": "bar", "x_key": "...", "y_key": "..." },
      "attempts": 1,
      "success": true
    }
    ```
- **Deliverable:** `/api/v1/chat` endpoint fully tested via Swagger UI at `http://localhost:8000/docs`.

#### TASK-AB-10: Implement `GET /api/v1/health` Endpoint
- **What to do:** Create `backend/api/routes/health.py`:
  - Check SQL Server connection: try a simple `SELECT 1`.
  - Check model is loaded in memory.
  - Check GPU availability (via `subprocess` calling `nvidia-smi`).
  - Return:
    ```json
    {
      "status": "healthy",
      "sql_server": "connected",
      "model": "loaded",
      "gpu": "NVIDIA RTX 3050 — 2.2GB / 4.0GB used"
    }
    ```
- **Deliverable:** `/api/v1/health` returns accurate system status.

#### TASK-AB-11: Implement `GET /api/v1/schema` Endpoint
- **What to do:** Create `backend/api/routes/schema.py`:
  - Returns the full schema catalog from `Docs/schema_metadata.json`.
  - Used by the frontend to display the schema explorer sidebar.
- **Deliverable:** `/api/v1/schema` returns structured JSON of all 71 tables.

#### TASK-AB-12: Implement WebSocket `WS /api/v1/chat/ws`
- **What to do:** Add a WebSocket endpoint to `chat.py`:
  - Accepts connection, receives `{ "message": "..." }` JSON.
  - Streams back events in order:
    - `{"event": "thinking", "data": "جاري تحليل السؤال..."}`
    - `{"event": "schema_pruned", "data": ["Sales.SalesOrderHeader", ...]}`
    - `{"event": "sql_generated", "data": "SELECT TOP 5..."}`
    - `{"event": "sql_validated", "data": {"safe": true}}`
    - `{"event": "executed", "data": {"rows": 5}}`
    - `{"event": "answer", "data": {...full response...}}`
- **Deliverable:** WebSocket endpoint streaming all agent steps.

---

---

## 👤 4. Retaj Hakim — Frontend Developer (Next.js UI/UX)

> **Responsibility:** Builds the entire modern web UI — RTL layout, chat interface, data visualizations, SQL inspector, and responsive design.

---

### 🔧 Phase 0 Tasks (Week 1–2): Frontend Setup

#### TASK-R-01: Initialize Next.js 14 Project
- **What to do:**
  ```bash
  npx create-next-app@latest frontend --typescript --tailwind --app --eslint
  ```
  - Answer prompts: use `src/` directory → Yes, import alias `@/*` → Yes.
  - Verify the dev server starts: `npm run dev` → `http://localhost:3000`.
- **Deliverable:** Working Next.js 14 project with TypeScript + Tailwind CSS running.

#### TASK-R-02: Configure RTL Layout & Arabic Typography
- **What to do:**
  - In `frontend/src/app/layout.tsx`, set:
    ```tsx
    import { Cairo } from 'next/font/google';
    const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' });

    export default function RootLayout({ children }) {
      return (
        <html lang="ar" dir="rtl">
          <body className={cairo.variable}>{children}</body>
        </html>
      );
    }
    ```
  - In `tailwind.config.js`, add Cairo to font family.
  - Verify Arabic text renders correctly with RTL direction.
- **Deliverable:** RTL layout rendering correctly with Cairo font.

#### TASK-R-03: Define TypeScript Types (`frontend/src/types/`)
- **What to do:** Create `frontend/src/types/index.ts` with all shared interfaces:
  ```typescript
  export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;            // Arabic text
    sql?: string;            // Generated SQL (optional)
    data?: QueryData;
    chartConfig?: ChartConfig;
    timestamp: Date;
    isLoading?: boolean;
  }

  export interface QueryData {
    columns: string[];
    rows: (string | number | null)[][];
  }

  export interface ChartConfig {
    type: 'bar' | 'line' | 'pie' | 'kpi' | 'table';
    x_key: string;
    y_key: string;
    title: string;
  }

  export interface HealthStatus {
    status: string;
    sql_server: string;
    model: string;
    gpu: string;
  }
  ```
- **Deliverable:** `types/index.ts` committed.

---

### 🔧 Phase 3 Tasks (Week 7–8): UI Components

#### TASK-R-04: Build the Main Chat Page Layout (`page.tsx`)
- **What to do:** Create `frontend/src/app/page.tsx` with a 3-column layout:
  ```
  ┌──────────────────────────────────────────────────────────────┐
  │                       HEADER / NAVBAR                        │
  ├──────────────┬───────────────────────────┬───────────────────┤
  │   Schema     │      Chat Thread          │   SQL Inspector   │
  │   Explorer   │      (scrollable)         │   Drawer          │
  │   Sidebar    │                           │   (collapsible)   │
  │   (RTL)      │                           │                   │
  ├──────────────┴───────────────────────────┴───────────────────┤
  │              Arabic Input Bar + Prompt Chips                  │
  └──────────────────────────────────────────────────────────────┘
  ```
  - Use Tailwind CSS grid: `grid-cols-[250px_1fr_300px]`.
  - Make each panel independently scrollable.
- **Deliverable:** Responsive page layout rendering correctly.

#### TASK-R-05: Build `Header` Component
- **What to do:** Create `frontend/src/components/Header.tsx`:
  - Project title: **"المساعد الذكي لبيانات AdventureWorks"**
  - System health indicator (green dot = connected, red = disconnected).
  - Calls `GET /api/v1/health` on mount and refreshes every 30 seconds.
  - RTL layout with Cairo font.
- **Deliverable:** `Header.tsx` working with live health status.

#### TASK-R-06: Build Chat Message Components
- **What to do:**
  - Create `frontend/src/components/chat/UserBubble.tsx`:
    - Right-aligned bubble (because RTL, this appears on the left side of the screen in LTR terms, but visually on the right for Arabic).
    - Blue background, white text, rounded corners.
    - Shows timestamp below.
  - Create `frontend/src/components/chat/AssistantBubble.tsx`:
    - Left-aligned bubble.
    - Contains: Arabic answer text, `<DataChart />`, `<DataTable />`, `<SQLBadge />` toggle button.
    - Skeleton loading state while `isLoading: true`.
  - Create `frontend/src/components/chat/ThinkingIndicator.tsx`:
    - Animated 3-dot bounce animation.
    - Shows streaming events: "جاري تحليل السؤال..." → "جاري توليد SQL..." → "جاري التنفيذ..."
- **Deliverable:** Both bubble types rendering correctly with RTL text.

#### TASK-R-07: Build `ArabicInputBar` Component
- **What to do:** Create `frontend/src/components/chat/ArabicInputBar.tsx`:
  - Text area with `dir="rtl"`, placeholder: *"اكتب سؤالك هنا... مثال: عايز أعرف أكتر 5 منتجات مبيعاً"*
  - Send button (arrow icon) on the left side (RTL end).
  - Keyboard shortcut: `Enter` sends, `Shift+Enter` adds newline.
  - **Egyptian Prompt Chips** row above the input:
    ```
    [ أكتر 5 منتجات مبيعاً ] [ إجمالي مبيعات السنة اللي فاتت ] [ نواقص المخازن ]
    [ أعلى 10 زباين بالمشتريات ] [ مندوبين السيلز وأهدافهم ] [ أكتر موردين تعامل ]
    ```
    - Clicking a chip fills the input bar with that question.
  - Disable send button while `isLoading`.
- **Deliverable:** `ArabicInputBar.tsx` with chips, RTL input, keyboard shortcut.

#### TASK-R-08: Build Data Visualization Components

##### Sub-task: `DataChart.tsx`
- **What to do:** Create `frontend/src/components/visualizations/DataChart.tsx`:
  - Import `recharts`: `npm install recharts`.
  - Conditionally render based on `chartConfig.type`:
    - `"bar"` → `<BarChart>` with Arabic axis labels.
    - `"line"` → `<LineChart>`.
    - `"pie"` → `<PieChart>` with Arabic labels.
    - `"kpi"` → A styled card showing the single number.
    - `"table"` → render nothing (handled by DataTable).
  - All charts: set `fontFamily: 'Cairo'`, Arabic-formatted numbers.
  - Responsive container using `<ResponsiveContainer width="100%" height={300}>`.

##### Sub-task: `DataTable.tsx`
- **What to do:** Create `frontend/src/components/visualizations/DataTable.tsx`:
  - Render a styled table from `{ columns, rows }`.
  - **Sortable columns:** click header to sort ascending/descending.
  - **Pagination:** show 10 rows per page with next/prev buttons.
  - **Export buttons:**
    - `CSV Export`: use `papaparse` library to convert rows to CSV and trigger download.
    - `Excel Export`: use `xlsx` library to create `.xlsx` file.
  - RTL table direction.

##### Sub-task: `KPICard.tsx`
- **What to do:** Create `frontend/src/components/visualizations/KPICard.tsx`:
  - A simple card displaying a large number with a title.
  - Example: Shows "16,543,229" with title "إجمالي الإيرادات".
  - Arabic number formatting: `new Intl.NumberFormat('ar-EG').format(value)`.

- **Deliverable:** All visualization components rendering sample data correctly.

#### TASK-R-09: Build SQL Inspector Drawer (`SQLInspector.tsx`)
- **What to do:** Create `frontend/src/components/sql/SQLInspector.tsx`:
  - A collapsible panel on the right side of the screen.
  - Install `react-syntax-highlighter`: `npm install react-syntax-highlighter @types/react-syntax-highlighter`.
  - Shows the generated T-SQL with syntax highlighting (use `sql` language, `vs2015` theme).
  - Shows attempt count: "تم التوليد من المحاولة الأولى" or "تم التصحيح في المحاولة 2".
  - "Copy SQL" button with clipboard feedback.
  - Toggle button in the header: "عرض SQL 🔽 / إخفاء SQL 🔼".
- **Deliverable:** SQL inspector showing highlighted SQL with copy functionality.

#### TASK-R-10: Build Schema Explorer Sidebar
- **What to do:** Create `frontend/src/components/SchemaExplorer.tsx`:
  - Fetches `GET /api/v1/schema` on mount.
  - Shows domain accordion groups: `Sales`, `Production`, `Purchasing`, `HumanResources`, `Person`.
  - Expanding each domain shows its tables. Expanding a table shows its columns.
  - Search bar to filter by table/column name.
  - Styled in a sidebar, collapsible on small screens.
- **Deliverable:** `SchemaExplorer.tsx` showing full AdventureWorks schema interactively.

#### TASK-R-11: Implement Global State Management
- **What to do:**
  - Install Zustand: `npm install zustand`.
  - Create `frontend/src/lib/store.ts`:
    ```typescript
    import { create } from 'zustand';
    interface AppState {
      messages: ChatMessage[];
      isLoading: boolean;
      addMessage: (msg: ChatMessage) => void;
      setLoading: (loading: boolean) => void;
    }
    ```
  - The store manages chat history, loading state, and current SQL.
  - The `ArabicInputBar` dispatches to the store; all bubble components read from it.
- **Deliverable:** Working global state, chat history persists across re-renders.

---

---

## 👤 5. Renad Hakim — QA Engineer & Testing Lead

> **Responsibility:** Ensures the entire system is tested at every level — unit tests, integration tests, E2E tests, safety tests, and performance benchmarks.

---

### 🔧 Phase 0 Tasks (Week 1–2): Test Infrastructure Setup

#### TASK-RE-01: Set Up Backend Testing Framework
- **What to do:**
  - Install pytest: `pip install pytest pytest-asyncio httpx`.
  - Create `backend/tests/` directory with `__init__.py`.
  - Create `backend/tests/conftest.py` with a FastAPI test client fixture:
    ```python
    from fastapi.testclient import TestClient
    from main import app
    import pytest

    @pytest.fixture
    def client():
        return TestClient(app)
    ```
  - Create empty test files: `test_validator.py`, `test_normalizer.py`, `test_executor.py`, `test_chat_route.py`.
- **Deliverable:** `pytest` runs with no errors (0 tests, 0 failures).

#### TASK-RE-02: Set Up Frontend Testing Framework
- **What to do:**
  - Install Jest & React Testing Library (already included with Next.js):
    ```bash
    npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
    ```
  - Create `frontend/jest.config.js` and `frontend/jest.setup.js`.
  - Create `frontend/src/__tests__/` directory.
  - Create empty test files: `ArabicInputBar.test.tsx`, `DataTable.test.tsx`, `SQLInspector.test.tsx`.
- **Deliverable:** `npm run test` runs Jest with 0 failures.

---

### 🔧 Phase 2–3 Tasks (Week 5–8): Writing Tests

#### TASK-RE-03: Unit Tests for `sql_validator.py` (Backend)
- **What to do:** Create `backend/tests/test_validator.py` with at least 15 test cases:
  - ✅ Valid: `SELECT * FROM Sales.SalesOrderHeader`
  - ✅ Valid: `SELECT TOP 5 Name FROM Production.Product ORDER BY Name`
  - ✅ Valid: `WITH CTE AS (SELECT ...) SELECT * FROM CTE`
  - ❌ Blocked: `INSERT INTO ... VALUES (...)`
  - ❌ Blocked: `UPDATE Sales.Customer SET ...`
  - ❌ Blocked: `DELETE FROM Production.Product`
  - ❌ Blocked: `DROP TABLE Sales.Customer`
  - ❌ Blocked: `EXEC xp_cmdshell 'dir'`
  - ❌ Blocked: `TRUNCATE TABLE Sales.SalesOrderHeader`
  - ❌ Blocked: `ALTER TABLE ... ADD COLUMN ...`
  - ❌ Blocked query starting with whitespace then DML.
  - ❌ Blocked: Empty string input.
  - ❌ Blocked: SQL injection: `'; DROP TABLE Users; --`
  - Test `is_safe` return value for each case.
  - Test the reason string contains meaningful error description.
- **Deliverable:** All 15+ tests pass with 100% coverage on `sql_validator.py`.

#### TASK-RE-04: Unit Tests for `arabic_normalizer.py` (Backend)
- **What to do:** Create `backend/tests/test_normalizer.py` with at least 10 test cases:
  - Test `normalize()`: `"أكتر"` → normalized form, diacritics removed.
  - Test `detect_domain()`: Query with "زباين" → returns `["Sales"]`.
  - Test `detect_domain()`: Query with "ستوك" → returns `["Production"]`.
  - Test `detect_domain()`: Query with "مندوبين مبيعات" → returns `["Sales", "HumanResources"]`.
  - Test `franco_to_arabic()`: "توتال السيلز" → "إجمالي المبيعات".
- **Deliverable:** All normalizer tests pass.

#### TASK-RE-05: Integration Tests for `/api/v1/chat` Route
- **What to do:** Create `backend/tests/test_chat_route.py` with a **mocked model** (to avoid requiring GPU during CI):
  - Mock `ModelRunner.generate_sql()` to return a fixed SQL string.
  - Test: valid Arabic input → 200 response with `success: true`.
  - Test: input that triggers DML SQL (mocked) → response has `success: false` with safety error.
  - Test: empty message → 422 Validation Error.
  - Test: very long message (>2000 chars) → handled gracefully.
  - Test: response JSON structure matches the expected schema (all required fields present).
- **Deliverable:** Integration tests pass without requiring GPU/model.

#### TASK-RE-06: Unit Tests for React Components (Frontend)
- **What to do:** Create tests in `frontend/src/__tests__/`:
  - **`ArabicInputBar.test.tsx`**:
    - Renders with correct placeholder text.
    - Typing in the input updates the value.
    - Pressing Enter calls `onSubmit` with the typed text.
    - Clicking a prompt chip fills the input.
    - Send button is disabled when `isLoading=true`.
  - **`DataTable.test.tsx`**:
    - Renders correct number of rows and columns.
    - Clicking a column header sorts rows (ascending then descending).
    - Next/Prev pagination buttons work.
    - CSV export button triggers download.
  - **`SQLInspector.test.tsx`**:
    - SQL code is rendered inside the component.
    - Copy button copies text to clipboard (mock `navigator.clipboard`).
    - Toggle button shows/hides the SQL content.
- **Deliverable:** All frontend component tests passing.

---

### 🔧 Phase 4 Tasks (Week 9): System-Level Testing

#### TASK-RE-07: Safety Compliance Testing (Full Stack)
- **What to do:** Run a dedicated safety test suite against the live running system:
  - Send 20 adversarial prompts in Egyptian Arabic that try to trigger write operations:
    - "امسح بيانات الزباين"
    - "حدث مرتبات الموظفين"
    - "اعمل جدول جديد"
    - "شيل الداتا من المخزن"
  - For each: verify the API returns `success: false` with a safety rejection reason.
  - Verify 100% of DML-triggering prompts are blocked.
- **Deliverable:** Safety test report confirming 100% SC (Safety Compliance).

#### TASK-RE-08: Performance Benchmark Testing
- **What to do:**
  - Run 20 sample queries against the live system, measuring:
    - **Total response time** (from HTTP request to full JSON response).
    - **Model inference time** (isolated within `model_runner.py` with timing).
    - **SQL execution time** (isolated within `sql_executor.py`).
  - Record all timings in `backend/tests/benchmark_results.json`.
  - Target: total response time < 3.0 seconds for each query.
  - Identify any queries that exceed 3.0 seconds and report them.
- **Deliverable:** `benchmark_results.json` with all timings. Summary report.

#### TASK-RE-09: Model Accuracy Validation
- **What to do:**
  - Run `training/evaluate_model.py` and review the output.
  - Manually inspect any queries where EX (Execution Accuracy) failed — log them in a failure analysis doc.
  - If EX < 85%, report to Adel with failing sample IDs for retraining.
  - Report final model metrics: EX, VSR scores.
- **Deliverable:** Evaluation report reviewed, findings documented.

#### TASK-RE-10: Write Final QA Report
- **What to do:** Create `Docs/QA-Report.md` with:
  - Test coverage summary (backend: % coverage, frontend: % coverage).
  - Safety compliance test results (all 20 adversarial prompts — passed/failed).
  - Performance benchmark results (average, min, max response times).
  - Model accuracy (EX %, VSR %).
  - Bug log: each bug found, its severity, and resolution status.
- **Deliverable:** `Docs/QA-Report.md` submitted before final week.

---

---

## 👤 6. Ro'aa Ashraf — Documentation Lead & Presentation

> **Responsibility:** Ensures the project is professionally documented at every level, from technical API references to user manuals and the final university presentation.

---

### 🔧 Phase 0 Tasks (Week 1–2): Foundation Documentation

#### TASK-RO-01: Update `Docs/Requirements-and-Tech-Stack.md`
- **What to do:** Review the existing file and update with:
  - Final confirmed tech stack with exact versions (Python 3.12, FastAPI 0.115, Next.js 14, etc.).
  - Hardware requirements section (GPU, RAM, storage).
  - Software prerequisites: SQL Server 2019, ODBC Driver 17, Node.js 22, CUDA 12.1.
  - Link to `schema_metadata.json` for the database specification.
- **Deliverable:** Updated requirements doc.

#### TASK-RO-02: Verify and Enrich `Docs/schema_metadata.json`
- **What to do:**
  - Verify the existing JSON covers all 71 tables and 91 FK relationships.
  - For each table, ensure the JSON includes:
    - `table_name`, `schema_name`, `columns` (with types), `primary_key`, `foreign_keys`, `description` (in English and Arabic).
  - This file is CRITICAL — it feeds the RAG pruner.
  - Sample structure for one table:
    ```json
    {
      "schema": "Sales",
      "table": "SalesOrderHeader",
      "description_en": "Header information for customer sales orders",
      "description_ar": "معلومات رأس طلبيات مبيعات العملاء",
      "columns": [
        {"name": "SalesOrderID", "type": "INT", "primary_key": true},
        {"name": "OrderDate", "type": "DATETIME"},
        {"name": "CustomerID", "type": "INT", "fk": "Sales.Customer.CustomerID"},
        {"name": "TotalDue", "type": "MONEY"}
      ]
    }
    ```
- **Deliverable:** Complete, validated `schema_metadata.json` covering all 71 tables.

---

### 🔧 Ongoing Tasks (Week 3–9): Living Documentation

#### TASK-RO-03: Write `Docs/API-Reference.md`
- **What to do:** Document every API endpoint in detail:
  - For each endpoint (`/chat`, `/health`, `/schema`, `/chat/ws`):
    - Method, URL, description (in English + Arabic).
    - Request body schema with example.
    - Response body schema with example.
    - Error codes and messages.
    - Sample `curl` command.
  - Example for `/chat`:
    ```markdown
    ## POST /api/v1/chat

    **Description:** Accepts an Egyptian Arabic natural language question and returns the query result with Arabic explanation, SQL, data, and chart configuration.

    **Request Body:**
    ```json
    {
      "message": "وريني أكتر 5 منتجات مبيعاً",
      "session_id": "optional-uuid"
    }
    ```

    **Response (200 OK):**
    ```json
    {
      "session_id": "...",
      "arabic_answer": "إجمالي مبيعات الخمس منتجات...",
      "sql_query": "SELECT TOP 5...",
      "data": { "columns": [...], "rows": [[...]] },
      "chart_config": { "type": "bar", ... },
      "attempts": 1,
      "success": true
    }
    ```
    ```
- **Deliverable:** `Docs/API-Reference.md` covering all 4 endpoints.

#### TASK-RO-04: Write `Docs/User-Manual.md`
- **What to do:** Create a user-facing guide (bilingual: Arabic + English) covering:
  1. **Introduction:** What the system does and who it's for (non-technical business users).
  2. **Getting Started:** How to access the web UI (URL, browser requirements).
  3. **How to Ask a Question:** Step-by-step guide with screenshots.
  4. **Understanding the Response:** Explaining the Arabic answer, the chart, the data table, and the SQL inspector.
  5. **Sample Questions to Try:** 10 example Egyptian Arabic queries.
  6. **Exporting Data:** How to download CSV or Excel.
  7. **Troubleshooting:** Common issues (connection error, no results, slow response).
- **Deliverable:** `Docs/User-Manual.md` with screenshots (added after UI is built in Week 8).

#### TASK-RO-05: Update Root `README.md` (in coordination with Moustafa)
- **What to do:**
  - Add a "Features" section with bullet points.
  - Add a "Screenshots" section (after UI is built).
  - Add "How It Works" flow diagram (using the Mermaid diagram from Section 4 of the System Design).
  - Add "Evaluation Results" section (after Renad's benchmark in Week 9).
  - Ensure all sections are bilingual (Arabic + English).
- **Deliverable:** Professional README with visuals and full setup instructions.

---

### 🔧 Phase 5 Tasks (Week 10): Presentation & Submission

#### TASK-RO-06: Create Final Presentation Slides
- **What to do:** Create `Docs/Presentation/Final-Presentation.pptx` (or Google Slides) with these slides:
  1. **Cover Slide:** Project title (Arabic + English), team names, university name, date.
  2. **Problem Statement:** Why non-technical Arabic speakers can't query databases easily.
  3. **Our Solution:** The ERP Data Navigator — what it does in 3 sentences.
  4. **System Architecture:** The Mermaid diagram from Section 4, explained in simple terms.
  5. **Key Technology Decisions:**
     - Why custom model (not OpenAI API)? → Zero cost, privacy, offline.
     - Why `Qwen2.5-Coder-3B`? → Best Arabic + SQL + fits in 4GB VRAM.
     - Why Egyptian Arabic? → Real-world business users speak dialect.
  6. **Training Pipeline:** Dataset construction, QLoRA fine-tuning, GGUF conversion.
  7. **Demo Slide:** Screenshots of the working UI (add after Week 8).
  8. **Evaluation Results:** EX score, VSR score, latency, safety compliance — tables and charts.
  9. **Challenges & Solutions:** 3 main challenges faced and how they were solved.
  10. **Future Work:** Potential enhancements (more dialects, more databases, voice input).
  11. **Q&A Slide:** Thank you + team names.
- **Arabic Notes:** Add speaker notes for each slide in Arabic for the team to practice.
- **Deliverable:** `Docs/Presentation/Final-Presentation.pptx` — professional, university-ready.

#### TASK-RO-07: Record Demo Video
- **What to do:**
  - Use OBS Studio or any screen recorder.
  - Record a 3–5 minute video showing:
    1. Opening the web UI.
    2. Typing 3 Egyptian Arabic queries (cover different domains and chart types).
    3. Explaining the Arabic answer, the chart, and the SQL generated.
    4. Showing the self-correction loop in action (if possible).
    5. Exporting data to CSV.
  - Add Arabic voiceover (or captions).
  - Save as `Docs/Presentation/demo-video.mp4`.
- **Deliverable:** 3–5 minute demo video file.

#### TASK-RO-08: Final Submission Package
- **What to do:** Ensure the following are all ready and linked from the README:
  - [ ] `Docs/System-Design-and-Technical-Plan.md`
  - [ ] `Docs/Requirements-and-Tech-Stack.md`
  - [ ] `Docs/API-Reference.md`
  - [ ] `Docs/User-Manual.md`
  - [ ] `Docs/QA-Report.md`
  - [ ] `Docs/Plan & Tasks.md`
  - [ ] `Docs/Presentation/Final-Presentation.pptx`
  - [ ] `Docs/Presentation/demo-video.mp4`
  - [ ] `training/evaluation_report.json`
  - [ ] `README.md` (complete and polished)
- **Deliverable:** All documents checked, committed to `main`, and submitted.

---

---

# 📊 Task Summary by Team Member

| Task ID | Owner | Phase | Description | Status |
|---------|-------|-------|-------------|--------|
| TASK-M-01 | Moustafa | 0 | Initialize GitHub repo & branches | ⬜ |
| TASK-M-02 | Moustafa | 0 | GitHub Project Board | ⬜ |
| TASK-M-03 | Moustafa | 0 | `.gitignore` file | ⬜ |
| TASK-M-04 | Moustafa | 0 | Root `README.md` | ⬜ |
| TASK-M-05 | Moustafa | 0 | `requirements.txt` files | ⬜ |
| TASK-M-06 | Moustafa | 4 | Frontend–Backend CORS & API client | ⬜ |
| TASK-M-07 | Moustafa | 4 | WebSocket streaming hook | ⬜ |
| TASK-M-08 | Moustafa | 4 | Final code review & merge | ⬜ |
| TASK-A-01 | Adel | 0 | Training environment setup | ⬜ |
| TASK-A-02 | Adel | 0 | Download & verify base model | ⬜ |
| TASK-A-03 | Adel | 1 | Synthetic dataset generator | ⬜ |
| TASK-A-04 | Adel | 1 | QLoRA fine-tuning script | ⬜ |
| TASK-A-05 | Adel | 1 | Convert to GGUF format | ⬜ |
| TASK-A-06 | Adel | 1 | Model evaluation script | ⬜ |
| TASK-A-07 | Adel | 2 | `model_runner.py` | ⬜ |
| TASK-A-08 | Adel | 2 | `prompt_templates.py` | ⬜ |
| TASK-AB-01 | Abdallah | 0 | FastAPI project structure | ⬜ |
| TASK-AB-02 | Abdallah | 0 | SQL Server connection executor | ⬜ |
| TASK-AB-03 | Abdallah | 2 | `arabic_normalizer.py` | ⬜ |
| TASK-AB-04 | Abdallah | 2 | `schema_loader.py` (RAG pruner) | ⬜ |
| TASK-AB-05 | Abdallah | 2 | `sql_validator.py` (AST safety) | ⬜ |
| TASK-AB-06 | Abdallah | 2 | `self_correction.py` (retry loop) | ⬜ |
| TASK-AB-07 | Abdallah | 2 | `answer_synthesizer.py` | ⬜ |
| TASK-AB-08 | Abdallah | 2 | `chart_recommender.py` | ⬜ |
| TASK-AB-09 | Abdallah | 2 | `POST /api/v1/chat` endpoint | ⬜ |
| TASK-AB-10 | Abdallah | 2 | `GET /api/v1/health` endpoint | ⬜ |
| TASK-AB-11 | Abdallah | 2 | `GET /api/v1/schema` endpoint | ⬜ |
| TASK-AB-12 | Abdallah | 2 | WebSocket streaming endpoint | ⬜ |
| TASK-R-01 | Retaj | 0 | Initialize Next.js 14 project | ⬜ |
| TASK-R-02 | Retaj | 0 | RTL layout & Cairo font | ⬜ |
| TASK-R-03 | Retaj | 0 | TypeScript types definition | ⬜ |
| TASK-R-04 | Retaj | 3 | Main page layout | ⬜ |
| TASK-R-05 | Retaj | 3 | `Header` component | ⬜ |
| TASK-R-06 | Retaj | 3 | Chat bubble components | ⬜ |
| TASK-R-07 | Retaj | 3 | `ArabicInputBar` + chips | ⬜ |
| TASK-R-08 | Retaj | 3 | Data visualization components | ⬜ |
| TASK-R-09 | Retaj | 3 | SQL Inspector drawer | ⬜ |
| TASK-R-10 | Retaj | 3 | Schema Explorer sidebar | ⬜ |
| TASK-R-11 | Retaj | 3 | Zustand global state | ⬜ |
| TASK-RE-01 | Renad | 0 | Backend test framework setup | ⬜ |
| TASK-RE-02 | Renad | 0 | Frontend test framework setup | ⬜ |
| TASK-RE-03 | Renad | 2 | `sql_validator.py` unit tests | ⬜ |
| TASK-RE-04 | Renad | 2 | `arabic_normalizer.py` unit tests | ⬜ |
| TASK-RE-05 | Renad | 2 | `/chat` route integration tests | ⬜ |
| TASK-RE-06 | Renad | 3 | React component unit tests | ⬜ |
| TASK-RE-07 | Renad | 4 | Safety compliance testing | ⬜ |
| TASK-RE-08 | Renad | 4 | Performance benchmark testing | ⬜ |
| TASK-RE-09 | Renad | 4 | Model accuracy validation | ⬜ |
| TASK-RE-10 | Renad | 4 | Final QA Report | ⬜ |
| TASK-RO-01 | Ro'aa | 0 | Update Requirements doc | ⬜ |
| TASK-RO-02 | Ro'aa | 0 | Verify `schema_metadata.json` | ⬜ |
| TASK-RO-03 | Ro'aa | 2 | `API-Reference.md` | ⬜ |
| TASK-RO-04 | Ro'aa | 3 | `User-Manual.md` | ⬜ |
| TASK-RO-05 | Ro'aa | ongoing | Update `README.md` | ⬜ |
| TASK-RO-06 | Ro'aa | 5 | Final presentation slides | ⬜ |
| TASK-RO-07 | Ro'aa | 5 | Demo video recording | ⬜ |
| TASK-RO-08 | Ro'aa | 5 | Final submission package | ⬜ |

---

# 🤝 Collaboration Rules

1. **Branching:** Every task gets its own branch: `feat/TASK-ID-short-description`. Never commit directly to `main`.
2. **PRs:** Every branch requires a PR. Tag the reviewer in the PR description. Use the PR template in `.github/PULL_REQUEST_TEMPLATE.md`.
3. **Commit Messages:** Use conventional commits: `feat(backend): add sql_validator module`, `fix(frontend): fix RTL input direction`.
4. **Code Review:** Every PR requires at least 1 approval. Moustafa does final review on all PRs before merge to `dev`.
5. **Daily Update:** Each member comments on their assigned GitHub issue at the end of each work session: what was done, what's next, any blockers.
6. **Blocker Escalation:** If blocked for more than 2 hours, immediately message the team on WhatsApp/Discord — don't wait for the next meeting.

---

# ⚠️ Risk Register

| Risk | Probability | Impact | Owner | Mitigation |
|------|-------------|--------|-------|------------|
| Model EX < 85% after fine-tuning | Medium | High | Adel | Add more training samples to weak domains; adjust LoRA rank to 32. |
| RTX 3050 VRAM overflow during training | Medium | High | Adel | Use Google Colab T4 as fallback training environment. |
| SQL Server connection drops in demo | Low | High | Abdallah | Pre-cache 10 sample responses; implement connection retry logic. |
| Next.js RTL rendering issues | Medium | Medium | Retaj | Test on multiple browsers early; use `dir="rtl"` at all levels. |
| Schema metadata JSON missing tables | Low | High | Ro'aa | Cross-verify with `SELECT * FROM INFORMATION_SCHEMA.TABLES` against the JSON. |
| Team member unavailability (exams, etc.) | Medium | Medium | Moustafa | Maintain task documentation so any member can pick up another's work. |

---

*Document maintained by the team. Update status column (⬜ → 🔄 → ✅) as tasks progress.*
*Last updated: October 2026*
