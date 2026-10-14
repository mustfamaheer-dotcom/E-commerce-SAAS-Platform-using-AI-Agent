# 🏛️ Intelligent ERP Data Navigator
### Autonomous Text-to-SQL AI Agent for AdventureWorks2019 (Custom-Trained Model & Zero-API Architecture)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: 3.12](https://img.shields.io/badge/Python-3.12-brightgreen.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js: 14](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![Database: SQL Server](https://img.shields.io/badge/Database-SQL_Server_2019-CC292B.svg)](https://www.microsoft.com/sql-server)
[![AI: Custom Model (Zero-API)](https://img.shields.io/badge/AI-Custom_Trained_QLoRA-purple.svg)](https://huggingface.co/)

---

## 🌟 Overview

The **Intelligent ERP Data Navigator** is an enterprise-grade autonomous AI agent that enables non-technical decision-makers to query complex relational databases using natural **Egyptian Colloquial Arabic (اللهجة المصرية العامية)** and mixed business English through a modern web UI.

### 🎯 Key Engineering Highlights
- **100% Custom-Trained AI Model (Zero External APIs):** No dependencies on closed cloud APIs (OpenAI / Claude / Google). The agent is powered by our own fine-tuned open-weights model (`Qwen2.5-Coder-3B` + QLoRA adapter) quantized to 4-bit GGUF, running completely offline with CUDA acceleration on consumer GPU hardware (NVIDIA RTX 3050 4GB VRAM).
- **Egyptian Arabic Dialect NLP:** Native understanding of Egyptian query prefixes (*"عايز أعرف"*, *"وريني"*), business jargon (*"الأوردرات"*, *"السيلز"*, *"الستوك"*), and colloquial temporal expressions (*"السنة اللي فاتت"*, *"آخر كوارتر"*).
- **Autonomous Schema Navigation:** Analyzes all 71 tables and 91 foreign keys across the 5 schemas of **Microsoft SQL Server AdventureWorks2019** (`Sales`, `Production`, `Purchasing`, `HumanResources`, `Person`).
- **Self-Correction Feedback Loop:** Automatically intercepts database runtime errors, reflects on tracebacks, refactors T-SQL, and retries up to 3 times without human intervention.
- **Modern Web Dashboard:** Next.js 14+ with native Arabic Right-to-Left (RTL) layout, *Cairo* typography, dynamic data charts (Recharts), sortable data grids, and Excel/CSV export.
- **Strict Read-Only Guardrails:** Multi-layered security (AST parsing, SQL Server `db_datareader` role) preventing any data modification.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       USER PROMPT (Egyptian Arabic)                         │
│       "طلعلي مبيعات كل فرع الشهر اللي فات وقارنها بالشهر اللي قبله"        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 LOCAL CUSTOM AGENT PIPELINE (Zero-API)                      │
│  1. Dialect Normalization (Egyptian Slang & Franco-Arab terms)              │
│  2. Schema Context Pruning (71 tables -> 2-4 target tables)                 │
│  3. Custom Fine-Tuned Model (Qwen2.5-Coder-3B GGUF 4-Bit via CUDA)         │
│  4. AST Safety Validator (Enforces Read-Only SELECT, blocks DDL/DML)        │
│  5. Self-Correction Loop (Reflects on execution error tracebacks)           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   LOCAL DATABASE EXECUTION & REPORTING                      │
│  • Local Microsoft SQL Server 2019 (AdventureWorks2019)                     │
│  • Arabic Analytical Insight ("إجمالي مبيعات الفروع زادت بنسبة 14%...")      │
│  • Dynamic Recharts Visual (Bar / Line / Pie / KPI Cards)                   │
│  • Interactive Data Grid with CSV / Excel Export & SQL Drawer               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
Text-To-SQL-AI-Agent-/
├── DataSet/
│   └── AdventureWorks2019.bak            # Database backup file (Ignored in Git)
│
├── Docs/
│   ├── Github.txt                         # Remote repository configuration
│   ├── schema_metadata.json               # Extracted 71-table metadata & FK catalog
│   ├── Requirements-and-Tech-Stack.md     # Technology stack & requirements specification
│   └── System-Design-and-Technical-Plan.md# Master System Design Document
│
├── OverView/
│   ├── Doc 1 white.pdf                    # Project overview & architectural vision
│   ├── Document 1.pdf                     # Requirement specifications
│   └── explain for Doc 1.pdf              # In-depth architectural explanation
│
├── SQL Q/
│   └── Select all schemes.sql             # SQL script for schema introspection
│
├── training/                              # Custom Model Training Pipeline (To be built)
│   ├── dataset/                           # Egyptian Arabic <-> T-SQL training pairs
│   ├── train_lora.py                      # QLoRA fine-tuning script
│   └── convert_to_gguf.py                 # Exports model to GGUF 4-bit
│
├── backend/                               # FastAPI Backend Application (To be built)
│   ├── agent/                             # Local model runner & self-correction loop
│   ├── api/                               # REST & WebSocket routes
│   └── database/                          # pyodbc connection pooling
│
├── frontend/                              # Next.js 14 Web Application (To be built)
│   └── src/                               # RTL Arabic UI, Recharts & Chat interface
│
├── .gitignore                             # Protects backups, models, node_modules
└── README.md                              # This file
```

---

## 🛠️ Technology Stack (100% Offline & Free)

| Component | Technology | Role |
|:---|:---|:---|
| **AI Model** | Custom `Qwen2.5-Coder-3B` (QLoRA Fine-Tuned) | Reasoning, dialect translation, and T-SQL generation |
| **Model Quantization** | GGUF 4-Bit (`Q4_K_M`) via `llama-cpp-python` | High-speed CUDA inference within 4GB VRAM |
| **Training Framework** | PyTorch, Hugging Face `peft`, `trl`, `bitsandbytes` | Parameter-efficient fine-tuning on Egyptian-SQL dataset |
| **Backend API** | FastAPI + Uvicorn (Python 3.12) | Asynchronous REST & WebSocket gateway |
| **Database Connector** | `pyodbc` + `SQLAlchemy 2.0` | Connection pooling and T-SQL execution |
| **Database Engine** | Microsoft SQL Server 2019 (`SQLEXPRESS`) | Hosts `AdventureWorks2019` dataset locally |
| **Frontend UI** | Next.js 14+ (React 18, TypeScript, Tailwind CSS) | Responsive chat UI with native Arabic RTL support |
| **Visualizations** | Recharts | Dynamic Bar, Line, Pie charts and KPI stat cards |

---

## 📖 Detailed Documentation

- 📐 **[System Design & Technical Plan](Docs/System-Design-and-Technical-Plan.md)**: Master architectural specification, dialect mapping rules, self-correction algorithms, and evaluation benchmarks.
- 📦 **[Requirements & Tech Stack Specification](Docs/Requirements-and-Tech-Stack.md)**: Complete functional, non-functional, and hardware requirements.
- 🗄️ **[Schema Metadata Catalog](Docs/schema_metadata.json)**: Extracted catalog of all 71 tables, columns, descriptions, and 91 foreign keys in AdventureWorks2019.

---

## 👥 Authors & Acknowledgments

- **Lead AI System Architect:** Moustafa Maher
- **Target Organization:** HITU AI Project
- **Repository:** [github.com/mustfamaheer-dotcom/Text-To-SQL-AI-Agent-](https://github.com/mustfamaheer-dotcom/Text-To-SQL-AI-Agent-)
