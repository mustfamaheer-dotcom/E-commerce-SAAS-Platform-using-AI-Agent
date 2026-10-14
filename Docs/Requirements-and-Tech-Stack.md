# 📦 Project Requirements, Technology Stack & Frameworks Specification
### Custom-Trained Text-to-SQL AI Agent for AdventureWorks2019 (Zero-API Architecture)

> **Project Name:** Intelligent ERP Data Navigator  
> **Target Database:** Microsoft SQL Server (`AdventureWorks2019`)  
> **Core AI Strategy:** **Custom-Trained / Fine-Tuned Open-Weights Model** (100% Offline, Zero Cloud/Commercial APIs)  
> **Target Input Language:** Egyptian Colloquial Arabic (اللهجة المصرية العامية) + Code-Switched Business English  
> **Output Language:** Bilingual (Egyptian Arabic Summary & English Analytics)  
> **Document Location:** `Docs/Requirements-and-Tech-Stack.md`  
> **Status:** Specification Document  

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Functional Requirements (FR)](#2-functional-requirements-fr)
3. [Egyptian Arabic NLP Requirements](#3-egyptian-arabic-nlp-requirements)
4. [Custom Model Training & Local Inference Requirements](#4-custom-model-training--local-inference-requirements)
5. [Non-Functional Requirements (NFR)](#5-non-functional-requirements-nfr)
6. [Complete Technology Stack Matrix (Zero-API)](#6-complete-technology-stack-matrix-zero-api)
7. [Custom Model Training & ML Stack](#7-custom-model-training--ml-stack)
8. [Backend Frameworks & Local Serving](#8-backend-frameworks--local-serving)
9. [Frontend Frameworks & Libraries](#9-frontend-frameworks--libraries)
10. [Database & Connectivity Stack](#10-database--connectivity-stack)
11. [Hardware, Development & Runtime Environment](#11-hardware-development--runtime-environment)
12. [Security, Safety & Governance Requirements](#12-security-safety--governance-requirements)

---

## 1. Executive Summary

This document establishes the official technical requirements, frameworks, and architecture for the **Intelligent ERP Data Navigator**.

### 🎯 Zero-API Architecture Mandate
The core objective of this project is to **create, train/fine-tune, and deploy a custom AI agent model locally** without relying on any paid, closed-source cloud APIs (such as OpenAI, Anthropic, or Google Cloud). 

The custom model is trained on a dedicated dataset pairing **Egyptian Colloquial Arabic (العامية المصرية)** with Microsoft SQL Server (`AdventureWorks2019`) T-SQL statements. It is quantized to 4-bit precision and served 100% locally on the host's **NVIDIA RTX 3050 Laptop GPU (4GB VRAM)** and **16GB System RAM**, delivering rapid offline query generation with total data privacy.

---

## 2. Functional Requirements (FR)

| ID | Category | Requirement Description |
|:---|:---|:---|
| **FR-01** | **Dialect Input Processing** | Process business questions expressed in Egyptian Colloquial Arabic, Modern Standard Arabic, or mixed Franco-Arab terms. |
| **FR-02** | **Custom Model Training** | Build a synthetic and curated training dataset of Egyptian Arabic queries paired with gold T-SQL queries over AdventureWorks2019, and fine-tune an open-source base model using QLoRA. |
| **FR-03** | **Local Model Serving** | Deploy the trained model 100% locally using 4-bit GGUF quantization with CUDA acceleration on the local RTX 3050 GPU. |
| **FR-04** | **Schema Navigation** | Autonomously select and prune tables and columns across all 5 schemas of `AdventureWorks2019` (71 tables). |
| **FR-05** | **Dialect-Accurate T-SQL** | Produce syntactically valid Microsoft SQL Server (T-SQL) queries utilizing `TOP N`, schema qualifiers, and foreign key `JOIN`s. |
| **FR-06** | **Read-Only Verification** | Validate every generated query through an AST parser before execution to ensure zero write/mutation operations. |
| **FR-07** | **Self-Correction Feedback Loop** | Capture database runtime errors, prompt the local model with the traceback, refactor the query, and re-execute automatically (up to 3 retries). |
| **FR-08** | **Bilingual Answer Synthesis** | Deliver a clear, natural-language executive summary in Egyptian Arabic explaining the findings and metrics. |
| **FR-09** | **Chart Recommendation** | Automatically configure the best visual chart (Bar, Line, Pie, Area, or KPI card) based on the result data structure. |
| **FR-10** | **Interactive Data Grid** | Display query results in a responsive, sortable, and paginated data table. |
| **FR-11** | **Data Export** | Allow one-click export of queried datasets to CSV and Excel (`.xlsx`) formats. |
| **FR-12** | **SQL Transparency** | Provide an expandable/collapsible drawer allowing technical users to inspect the exact T-SQL query executed. |
| **FR-13** | **Session Memory** | Maintain multi-turn conversational context to support follow-up questions. |
| **FR-14** | **Suggested Questions** | Present clickable prompt chips with curated business questions in Egyptian Arabic to help users get started immediately. |

---

## 3. Egyptian Arabic NLP Requirements

1. **Orthographic Normalization:**
   - Normalize character variations: `أ / إ / آ` $\rightarrow$ `ا`, `ة` $\rightarrow$ `ه`, `ى` $\rightarrow$ `ي`.
   - Strip Arabic diacritics (Tashkeel: Fatha, Damma, Kasra, Sukun, Tanween).
2. **Colloquial Question Term Mapping:**
   - Map Egyptian query prefixes: `"عايز أعرف"` (I want to know), `"وريني"` (show me), `"طلعلي"` (extract for me), `"كام"` (how much / how many) to `SELECT`, `COUNT()`, or `SUM()`.
   - Map Egyptian ranking terms: `"أكتر / أعلى / التوب"` $\rightarrow$ `ORDER BY ... DESC`, `"أقل / أوطى"` $\rightarrow$ `ORDER BY ... ASC`.
3. **Business Slang & Code-Switching (Arabizi / Franco):**
   - Translate mixed terms: `"الأوردرات"` $\rightarrow$ `Sales.SalesOrderHeader`, `"الزباين"` $\rightarrow$ `Sales.Customer`, `"السيلز"` $\rightarrow$ `Sales.SalesPerson`, `"الستوك"` $\rightarrow$ `Production.ProductInventory`, `"الموردين"` $\rightarrow$ `Purchasing.Vendor`.
4. **Temporal Grounding with Dataset Anchor:**
   - Translate relative temporal phrases: `"السنة اللي فاتت"` (last year), `"الشهر ده"` (this month), `"الربع الأخير"` (last quarter) into T-SQL `DATEADD` and `DATEDIFF` logic, anchored to the maximum date in `AdventureWorks2019`.

---

## 4. Custom Model Training & Local Inference Requirements

1. **Base Model:** `Qwen2.5-Coder-3B-Instruct` (Selected for its state-of-the-art coding abilities, native Arabic tokenization, and lightweight memory footprint).
2. **Training Dataset:** 1,000+ verified triples of `(Schema Context, Egyptian Arabic Prompt, Ground Truth T-SQL Query)`.
3. **Fine-Tuning Methodology:**
   - Parameter-Efficient Fine-Tuning (PEFT) using **QLoRA** (4-bit NormalFloat quantization via `bitsandbytes`).
   - LoRA Hyperparameters: Rank $r = 16$, Alpha $\alpha = 32$, Target modules: `q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj`.
4. **Quantization & Format:**
   - Conversion of fine-tuned weights to **GGUF `Q4_K_M`** (Medium 4-bit quantization).
   - Target model disk size: $\le 2.0\text{ GB}$.
   - Target VRAM footprint during inference: $\le 2.4\text{ GB}$ (fitting fully into the 4GB RTX 3050 GPU).
5. **Inference Engine:** `llama-cpp-python` with CUDA acceleration, running 100% locally with zero internet dependency.

---

## 5. Non-Functional Requirements (NFR)

| ID | Requirement Area | Target Metric / Specification |
|:---|:---|:---|
| **NFR-01** | **Local Generation Speed** | $25\text{–}40\text{ tokens/second}$ on the NVIDIA RTX 3050 Laptop GPU. |
| **NFR-02** | **End-to-End Latency** | $< 3.5\text{ seconds}$ total round-trip time (prompt $\rightarrow$ local model $\rightarrow$ SQL Server $\rightarrow$ UI). |
| **NFR-03** | **Memory Budget (VRAM)** | $\le 3.0\text{ GB}$ total GPU VRAM usage, leaving 1GB headroom for display and OS tasks. |
| **NFR-04** | **System RAM Budget** | $\le 6.0\text{ GB}$ system RAM used by Python backend and database services. |
| **NFR-05** | **Offline Capability** | $100\%$ operational with zero internet connection required after model download. |
| **NFR-06** | **Safety & Mutation Protection** | $0.0\%$ execution of non-SELECT statements (zero write risk). |
| **NFR-07** | **Query Timeout** | 30-second hard limit on SQL Server execution. |
| **NFR-08** | **Result Set Limit** | Maximum 1,000 rows returned per query to protect network bandwidth. |
| **NFR-09** | **RTL/LTR Support** | Native Right-to-Left (RTL) for Arabic with dynamic Left-to-Right (LTR) toggling. |

---

## 6. Complete Technology Stack Matrix (Zero-API)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│         Next.js 14+ | React 18+ | TypeScript | Tailwind CSS            │
│         Recharts | Lucide React | Cairo Font (RTL Arabic)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / WebSocket
┌───────────────────────────────────▼────────────────────────────────────┐
│                        API & BACKEND LAYER                             │
│         Python 3.12+ | FastAPI | Uvicorn | Pydantic v2                 │
│         SQLAlchemy 2.0+ | pyodbc 5.1+ | Pandas 2.2+                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ In-Process CUDA
┌───────────────────────────────────▼────────────────────────────────────┐
│                    LOCAL MODEL & ML ENGINE (Zero APIs)                 │
│         llama-cpp-python (CUDA) | GGUF 4-Bit Model                     │
│         Base Model: Qwen2.5-Coder-3B-Instruct (Fine-Tuned)             │
│         Training Stack: PyTorch, Hugging Face PEFT, TRL, bitsandbytes   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ODBC Driver 17/18
┌───────────────────────────────────▼────────────────────────────────────┐
│                          LOCAL DATABASE LAYER                          │
│         Microsoft SQL Server 2019 (SQLEXPRESS)                         │
│         AdventureWorks2019 (71 Tables, 91 Foreign Keys)                │
└────────────────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Version | Purpose in Project | Rationale |
|:---|:---|:---|:---|:---|
| **Local AI Model** | Custom `Qwen2.5-Coder-3B` | Fine-Tuned (GGUF Q4) | Local Text-to-SQL reasoning & Arabic NLP | 100% offline, zero API fees, fits 4GB VRAM |
| **Local Inference Engine** | `llama-cpp-python` | 0.2.80+ | Local CUDA-accelerated model serving | High-performance C++ engine with Python bindings |
| **ML Training Framework** | PyTorch | 2.2+ (CUDA 12) | Deep learning foundation | Standard framework for transformer training |
| **Fine-Tuning Library** | Hugging Face `peft` & `trl` | 0.10+ / 0.8+ | Parameter-efficient fine-tuning (QLoRA) | Enables fine-tuning large models on limited VRAM |
| **Quantization Toolkit** | `bitsandbytes` | 0.43+ | 4-bit NF4 quantization during training | Drastically cuts memory requirements during training |
| **Transformers Core** | Hugging Face `transformers` | 4.40+ | Model loading, tokenization, dataset mapping | Universal NLP and model conversion tools |
| **Web Framework (Frontend)** | Next.js (App Router) | 14.2+ | Full-stack frontend framework | Server-side rendering, SEO, file-based routing |
| **UI Library** | React | 18.3+ | Component-based interface | Industry standard, massive ecosystem |
| **Language (Frontend)** | TypeScript | 5.4+ | Type-safe frontend codebase | Prevents runtime bugs; self-documenting APIs |
| **Styling Engine** | Tailwind CSS | 3.4+ | Utility-first CSS framework | Rapid modern styling, built-in Dark Mode & RTL |
| **Visualization** | Recharts | 2.12+ | Responsive SVG/Canvas charts | Declarative React integration; Bar, Line, Pie |
| **Icons** | Lucide React | 0.350+ | Modern iconography | Lightweight, clean, consistent stroke icons |
| **State Management** | Zustand | 4.5+ | Client-side session store | Minimal boilerplate; faster than Redux |
| **API Framework (Backend)** | FastAPI | 0.110+ | Asynchronous REST & WebSocket API | High throughput, automatic Swagger docs, async |
| **ASGI Web Server** | Uvicorn | 0.28+ | Lightning-fast ASGI server | Production-grade async server for FastAPI |
| **Data Validation** | Pydantic | 2.6+ | Request / Response schema contracts | Strict type validation, serializes directly to JSON |
| **DB Connector** | pyodbc | 5.1+ | Low-level ODBC database driver | High performance T-SQL execution against SQL Server |
| **DB Abstraction** | SQLAlchemy | 2.0+ | Connection pooling & engine lifecycle | Enterprise connection pooling and health checks |
| **Data Manipulation** | Pandas | 2.2+ | Tabular data processing & formatting | DataFrame transformations, aggregations, CSV export |
| **Database** | Microsoft SQL Server | 2019 / SQLEXPRESS | Enterprise Relational Database | Hosts `AdventureWorks2019` dataset locally |
| **ODBC Driver** | ODBC Driver 17/18 for SQL Server | 17.10 / 18.3 | Windows native SQL Server driver | Verified and installed on host machine |

---

## 7. Custom Model Training & ML Stack

### 7.1 Python Training Dependencies (`training/requirements.txt`)

```text
torch>=2.2.0
transformers>=4.40.0
peft>=0.10.0
trl>=0.8.0
bitsandbytes>=0.43.0
datasets>=2.18.0
accelerate>=0.28.0
scipy>=1.12.0
sentencepiece>=0.2.0
```

### 7.2 Training Pipeline Modules
1. `generate_synthetic_data.py`:
   - Inspects `Docs/schema_metadata.json` (71 tables).
   - Generates 1,000+ realistic Egyptian Arabic business scenarios (Sales, Inventory, HR, Purchasing).
   - Pairs each scenario with a validated, executed Microsoft SQL Server T-SQL query.
2. `train_lora.py`:
   - Loads base `Qwen2.5-Coder-3B-Instruct` with 4-bit quantization.
   - Configures QLoRA adapters on linear layers.
   - Trains using `SFTTrainer` with a chat template for 3–5 epochs.
3. `convert_to_gguf.py`:
   - Merges LoRA weights back into FP16 model.
   - Converts checkpoint into GGUF format and applies `Q4_K_M` quantization.
4. `evaluate_model.py`:
   - Runs validation queries and calculates Execution Accuracy (EX) and Valid SQL Rate (VSR).

---

## 8. Backend Frameworks & Local Serving

### 8.1 Backend Dependencies (`backend/requirements.txt`)

```text
fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pydantic>=2.6.0
pydantic-settings>=2.2.0
python-dotenv>=1.0.1
sqlalchemy>=2.0.28
pyodbc>=5.1.0
pandas>=2.2.1
llama-cpp-python>=0.2.80
httpx>=0.27.0
pytest>=8.1.0
```

*(Note: Completely free of cloud LLM client libraries like `openai` or `anthropic`).*

---

## 9. Frontend Frameworks & Libraries

### 9.1 Frontend Dependencies (`frontend/package.json`)

```json
{
  "name": "ai-sql-agent-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.350.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.0"
  }
}
```

---

## 10. Database & Connectivity Stack

- **Database Engine:** Microsoft SQL Server 2019 (Instance: `localhost\SQLEXPRESS`).
- **Database Name:** `AdventureWorks2019` (Restored and verified).
- **Scale:** 71 tables, 91 foreign keys, ~500 columns across 5 operational schemas.
- **Connection Protocol:** `pyodbc` with connection pooling over `ODBC Driver 17 for SQL Server`.
- **Security Role:** Dedicated read-only role (`db_datareader`).

---

## 11. Hardware, Development & Runtime Environment

- **Host Machine:** Windows 10/11 64-bit.
- **CPU:** AMD Ryzen 7 5800H (8 Cores, 16 Threads, 3.20 GHz - 4.40 GHz).
- **System RAM:** 16 GB DDR4.
- **GPU:** NVIDIA GeForce RTX 3050 Laptop GPU (4 GB GDDR6 VRAM).
- **Python:** 3.12.4 (Installed).
- **Node.js:** v22.14.0 (Installed).
- **npm:** 11.14.1 (Installed).
- **SQL Server:** MSSQL$SQLEXPRESS service running.

---

## 12. Security, Safety & Governance Requirements

1. **100% Local Privacy:** Zero data leaves the machine. No queries, business metrics, or database credentials are ever transmitted to third-party cloud APIs.
2. **AST Parser Gatekeeper:** Rejection of any query containing:
   - `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`
   - `DROP`, `ALTER`, `CREATE`
   - `EXEC`, `EXECUTE`, `xp_`, `sp_`
   - `GRANT`, `REVOKE`, `DENY`
3. **Database Principal Isolation:** The database user is restricted solely to the `db_datareader` database role with zero write/modify grants.
4. **Execution Bounds:** 30-second query timeout and max 1,000 returned rows per execution.

---

*Document Author: AI System Architect*  
*Target File: `Docs/Requirements-and-Tech-Stack.md`*  
*Reference Repository: [github.com/mustfamaheer-dotcom/Text-To-SQL-AI-Agent-](https://github.com/mustfamaheer-dotcom/Text-To-SQL-AI-Agent-)*
