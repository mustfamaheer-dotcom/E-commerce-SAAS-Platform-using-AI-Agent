# Technical Plan: Ro'aa Ashraf
**Project:** Intelligent ERP Data Navigator (Text-to-SQL agent, AdventureWorks2019, Egyptian Arabic)
**Role:** Data / NLP Engineer, RAG Schema Architect, Full-Stack Contributor
**Scope:** TASK-RO-01 to TASK-RO-10 (10 tasks, Weeks 1-10)

---

## 1. Overview

| Task | Phase / Week | Pair | Deliverable |
|---|---|---|---|
| RO-01 | 0 / W1-2 | Abdallah | `training/dataset/extract_schema.py`, `Docs/schema_metadata.json` |
| RO-02 | 1 / W3-4 | Adel | Dialect + DDL injector in `generate_synthetic_data.py` |
| RO-03 | 1 / W3-4 | Adel | `training/evaluate_model.py`, `evaluation_report.json` |
| RO-04 | 2 / W5-6 | Abdallah, Renad | `backend/agent/schema_loader.py` (RAG pruner) |
| RO-05 | 2 / W5-6 | - | `backend/api/routes/schema.py`, `tests/test_schema_loader.py` |
| RO-06 | 3 / W7-8 | Retaj | `frontend/src/components/SchemaExplorer.tsx` |
| RO-07 | 3 / W7-8 | Retaj | Schema search filter + click-to-prompt (Zustand slice) |
| RO-08 | 4 / W9 | - | `Docs/API-Reference.md` |
| RO-09 | 5 / W10 | All | `demo-video.mp4` (3-5 min) |
| RO-10 | 5 / W10 | - | Defense slides: RAG Pruner + Dataset Pipeline |

### Dependency chain (what blocks what)

```
RO-01 schema_metadata.json
   |-- RO-02 (DDL builder reads it)
   |-- RO-04 (pruner loads it)  --> RO-05 (/schema route) --> RO-06/07 (frontend)
RO-02 DDL format ==must match==> RO-04 prune output format   (critical: train/inference consistency)
RO-02 val_dataset.json --> RO-03 evaluator --> Adel's TASK-A-08 tuning
Renad's arabic_normalizer.py --> RO-04 (query normalization before scoring)
Moustafa's api.ts (M-05) + Retaj's store.ts (R-08) --> RO-06/07
```

### Weekly schedule

| Week | Focus |
|---|---|
| 1 | RO-01 queries + JSON structure; pair review with Abdallah |
| 2 | RO-01 bilingual descriptions + validation; merge to `dev` |
| 3 | RO-02 lexicon, phrasing engine, DDL builder |
| 4 | RO-02 split + dedup; RO-03 evaluator; first baseline run |
| 5 | RO-04 pruner (scoring + FK expansion + token budget) |
| 6 | RO-05 route + tests; integrate with `/chat` pipeline |
| 7 | RO-06 SchemaExplorer UI |
| 8 | RO-07 search filter, store slice, RTL fixes |
| 9 | RO-08 API reference; support Adel's EX tuning with evaluator |
| 10 | RO-09 demo video, RO-10 slides, rehearsal |

---

## 2. Phase 0: RO-01 Schema Metadata Extractor

**Branch:** `feat/TASK-RO-01-schema-extractor`
**Files:** `training/dataset/extract_schema.py`, `Docs/schema_metadata.json`

### Steps
1. **Connection:** read `DB_CONN_STRING` from `.env` (via `python-dotenv`), connect with `pyodbc`. Never hardcode credentials.
2. **Tables:** query `INFORMATION_SCHEMA.TABLES` where `TABLE_TYPE = 'BASE TABLE'`. Keep `TABLE_SCHEMA` (this gives the domain: Sales, Production, Purchasing, HumanResources, Person, dbo).
3. **Columns:** query `INFORMATION_SCHEMA.COLUMNS` for name, data type, max length, nullability, ordinal position.
4. **Primary keys:** join `INFORMATION_SCHEMA.TABLE_CONSTRAINTS` and `KEY_COLUMN_USAGE` where `CONSTRAINT_TYPE = 'PRIMARY KEY'`.
5. **Foreign keys:** use `sys.foreign_keys` + `sys.foreign_key_columns`, resolving names with `OBJECT_SCHEMA_NAME`, `OBJECT_NAME`, `COL_NAME`. Store parent table/column and referenced table/column.
6. **Descriptions (EN):** read `MS_Description` from `sys.extended_properties` (AdventureWorks ships with these) as the English description.
7. **Descriptions (AR):** maintain a curated `AR_TABLE_DESCRIPTIONS` dict (and a short column-hint dict for key columns like `TotalDue`, `OrderQty`, `ListPrice`). Use Egyptian business vocabulary: عملاء، مبيعات، موردين، مخزون، موظفين. Review with Renad for dialect naturalness.
8. **Output** `Docs/schema_metadata.json`.

### Output structure
```json
{
  "meta": {"database": "AdventureWorks2019", "table_count": 71, "fk_count": 91, "generated_at": "..."},
  "domains": {"Sales": ["Sales.SalesOrderHeader", "..."], "Production": ["..."]},
  "tables": {
    "Sales.SalesOrderHeader": {
      "schema": "Sales", "domain": "Sales",
      "description_en": "...", "description_ar": "...",
      "primary_key": ["SalesOrderID"],
      "columns": [{"name": "TotalDue", "type": "money", "nullable": false, "pk": false}],
      "foreign_keys": [{"column": "CustomerID", "ref_table": "Sales.Customer", "ref_column": "CustomerID"}]
    }
  }
}
```

### Acceptance
- Script asserts `table_count == 71` and `fk_count == 91`. If the numbers differ on the restored DB, log the difference and check whether views or system tables are leaking in or out.
- Every table has `description_en` and `description_ar` (no empty strings).
- Script is idempotent: rerunning produces an identical file (sort keys).
- Reviewed by Abdallah (he owns the DB restore, TASK-AB-02).

### Risks
- DB not ready: Abdallah restores the `.bak` in Week 1; agree on a date, and in the meantime develop against a local SQL Server.
- Composite FKs: group columns by `constraint_object_id` so multi-column FKs are not split into separate entries.

---

## 3. Phase 1: RO-02 Dialect and Schema Injector

**Branch:** `feat/TASK-RO-02-dialect-injector`
**File:** `training/dataset/generate_synthetic_data.py` (shared with Adel, who owns SQL templates, TASK-A-03)

### Responsibility split
- **Adel:** gold T-SQL templates (JOINs, CTEs, window functions, aggregations) with placeholders.
- **You:** (a) Egyptian Arabic question generator, (b) DDL schema context builder, (c) sample assembly and split.

### 3.1 Linguistic variation engine
Build a `DialectEngine` with:
- **Lexicon** mapping business intents to Egyptian variants, e.g. `{"top_n": ["أكتر", "أعلى"], "total": ["إجمالي", "المجموع"], "customers": ["عملاء", "زباين"], "inventory": ["مخزون", "المخزن"], "suppliers": ["موردين"], "last_year": ["السنة اللي فاتت", "العام الماضي"]}`.
- **Question frames** per intent, e.g. `"هات لي {n} {entity} {ranking} {metric} {period}"`, `"عايز أعرف {metric} {entity} {period}"`, `"إيه هو {metric} ..."`.
- **Franco-Arabic variants** (low frequency, about 5-10% of samples): `sales`, `stock`, `total`, `top 5 customers`.
- **Noise options** (small probability): drop hamza, swap ة/ه, ى/ي, so the model sees unnormalized input as well as normalized.
- Seeded `random.Random(seed)` for reproducibility.

### 3.2 DDL schema context builder
- Input: list of table names + `schema_metadata.json`. Output: compact `CREATE TABLE` text with PK and FK lines.
- **Critical:** this function defines the exact prompt format the model sees in training. The RAG pruner (RO-04) must call the same builder at inference. Put it in a shared module (`schema_format.py`) importable from both `training/` and `backend/agent/`, or copy with a test asserting byte-equal output for the same input.
- For each sample, include the gold tables plus 2-4 distractor tables from the same domain, so the model learns to ignore irrelevant tables (matches what the pruner will actually return).

### 3.3 Assembly and split
- Format (ChatML-ready): `{"messages": [{"role": "system", "content": "<instructions + DDL>"}, {"role": "user", "content": "<Arabic question>"}, {"role": "assistant", "content": "<gold SQL>"}], "domain": "Sales", "template_id": "..."}`.
- Target 1,000+ pairs across Sales, Production, Purchasing, HumanResources, Person; balanced per domain.
- **Split by `template_id`, not by random sample**, so the same SQL template with different phrasing never appears in both train (800) and val (200). This avoids leakage that would inflate EX.
- Dedupe on normalized question text. Save `train_dataset.json`, `val_dataset.json`.
- **Verify every gold SQL executes** on the DB (use the evaluator from RO-03) and drop any that fail or return empty results unless intended.

### Acceptance
- 1,000+ samples, 800/200 split, balanced domains, zero template overlap between splits.
- 100% of gold SQL executes without error.
- Renad audits a random 50-sample subset for dialect naturalness (TASK-RE-02).

---

## 4. Phase 1: RO-03 Automated Model Evaluator

**Branch:** `feat/TASK-RO-03-evaluator`
**File:** `training/evaluate_model.py` -> `evaluation_report.json`

### Design
```
python evaluate_model.py --model models/qwen2.5-coder-3b-egyptiansql.Q4_K_M.gguf \
                         --val training/dataset/val_dataset.json --out evaluation_report.json
```
- Make generation **pluggable** (`generate_fn(question, schema) -> sql`) so you can test the evaluator with gold SQL as "predictions" before the model exists (should give EX = 100%). Also run it against the zero-shot baseline from TASK-A-02.

### Metrics
- **VSR (Valid SQL Rate):** predicted SQL parses (`sqlglot`, dialect `tsql`) and executes without SQL Server error.
- **EX (Execution Accuracy):** executed result set of predicted SQL equals gold result set.
  - Compare as multisets of rows (order-insensitive) unless the gold query has `ORDER BY`, in which case compare ordered.
  - Normalize types: `Decimal`/`float` with tolerance (e.g. 1e-6), `None` handling, strip strings.
  - Compare column count and values, not column aliases (the model may alias differently).
- **Per-domain breakdown** (Sales, Production, ...) since Adel's TASK-A-08 tunes weak domains.
- Safety: execute with a **read-only** login or wrap in `SET NOCOUNT ON` plus a 30s timeout, and row cap so a bad query cannot hang the run.

### Report structure
```json
{"overall": {"n": 200, "ex": 0.0, "vsr": 0.0},
 "by_domain": {"Sales": {"n": 0, "ex": 0.0, "vsr": 0.0}},
 "failures": [{"id": "...", "question": "...", "gold": "...", "pred": "...", "error": "..."}]}
```
Keep the failures list: it is the input for Adel's error analysis.

### Acceptance
- Gold-vs-gold sanity run = 100% EX/VSR.
- Report generated for zero-shot baseline and for each trained checkpoint.
- Runs the 200 val samples in a reasonable time (cache gold results to a local file so reruns skip re-executing gold).

---

## 5. Phase 2: RO-04 RAG Schema Pruner

**Branch:** `feat/TASK-RO-04-schema-pruner`
**File:** `backend/agent/schema_loader.py`

### Interface
```python
class SchemaLoader:
    def load_catalog(self, path: str = "Docs/schema_metadata.json") -> None: ...
    def prune_schema(self, domains: list[str], query: str, max_tokens: int = 2000) -> PrunedSchema: ...
```
`PrunedSchema` = `{tables: [...], ddl: str, fk_paths: [...], token_estimate: int}`.

### Algorithm (no heavy dependencies)
1. **Load once** at startup (singleton), build indexes: table -> tokens (name split on CamelCase, EN + AR description, column names), adjacency dict from FKs.
2. **Normalize query** with Renad's `ArabicNormalizer` (`normalize`, `franco_to_arabic`) so scoring sees the same forms as the index. Until his module lands, use a local stub with the same signature.
3. **Candidate set:** tables whose domain is in `domains` (from `detect_domain`). If domains is empty or low-confidence, fall back to all 71 tables.
4. **Score** each candidate: BM25-lite / TF-IDF over table name, description (EN+AR), column names. Weight: table name > description > column. Add a Arabic-term-to-column dictionary for frequent business words (`سعر` -> `ListPrice`, `كمية` -> `OrderQty`, `إجمالي` -> `TotalDue`).
5. **Select seed tables:** top-K (start with K=4).
6. **FK expansion:** BFS over the FK graph (depth <= 2) to add bridge tables needed to join the seeds (e.g. `SalesOrderHeader` -> `SalesOrderDetail` -> `Product`). Prefer the shortest path between seed pairs; add only the tables on those paths, not all neighbours.
7. **Token budget:** estimate tokens (`len(text)/3.5` as a safe approximation, or the llama tokenizer if available). If DDL > 2,000 tokens, drop lowest-score non-bridge tables first, then trim rarely used columns (keep PK, FK, and columns matching query terms).
8. **Render DDL** through the shared formatter from RO-02. **Must be identical in format to training data.**

### Tests (`backend/tests/test_schema_loader.py`)
- Sales query returns `Sales.SalesOrderHeader` / `SalesOrderDetail`.
- Cross-domain query (products sold by vendor) includes bridge tables.
- Output never exceeds 2,000 tokens.
- Unknown / empty query falls back safely and does not crash.
- Franco and unnormalized Arabic input return the same tables as the normalized version.
- **Recall check:** over `val_dataset.json`, the gold tables appear in the pruned set for >= 95% of samples. This is the real quality metric for the pruner; report it in the slides.

### Acceptance
- Recall >= 95% on validation set, token cap respected, latency per prune well under 50 ms (so it does not eat into the 3.0s end-to-end budget).

---

## 6. Phase 2: RO-05 `GET /api/v1/schema`

**Branch:** `feat/TASK-RO-05-schema-route`
**File:** `backend/api/routes/schema.py`

- Query params: `domain` (optional, one of the five), `q` (optional search text).
- Response (Pydantic models): `{"domains": [{"name": "Sales", "tables": [{"name": "...", "description_ar": "...", "columns": [{"name": "...", "type": "..."}]}]}], "total_tables": 71}`.
- Filtering reuses `SchemaLoader` search scoring, so the explorer search and the pruner behave consistently.
- Invalid `domain` returns HTTP 422 with a clear message; catalog not loaded returns 503.
- Register the router in `main.py` (coordinate with Abdallah) under `/api/v1`.
- Tests with `httpx` `AsyncClient` fixtures from Renad's `conftest.py`: no filter, domain filter, search, invalid domain.

---

## 7. Phase 3: RO-06 and RO-07 Schema Explorer (Frontend)

**Branches:** `feat/TASK-RO-06-schema-explorer`, `feat/TASK-RO-07-schema-search`
**Files:** `frontend/src/components/SchemaExplorer.tsx`, schema slice in `store.ts`

### Contracts to agree on first (Week 7, day 1)
- With **Retaj:** the shape of the Zustand store (add a `schemaSlice` rather than editing others' slices) and the shared TypeScript types in `types/index.ts` (add `SchemaDomain`, `SchemaTable`, `SchemaColumn`).
- With **Moustafa:** `getSchema(params)` in `api.ts` (M-05). Do not call `fetch` directly in the component.

### Component behavior (RO-06)
- Fetch on mount; show loading skeleton and error state with retry.
- **Five collapsible accordions** (Sales, Production, Purchasing, HR, Person), RTL-aware: chevron on the correct side, text alignment right, `dir="rtl"` inherited from container (this is on the risk register).
- Table rows expand to show columns with types (types stay LTR: wrap in `dir="ltr"`, as English identifiers break layout in RTL otherwise).
- Keyboard accessible (`button` elements, `aria-expanded`).

### Search and click-to-insert (RO-07)
- Search input with **200 ms debounce**; filter tables and columns client-side from the fetched catalog (use the API `q` param only if the payload is too large). Highlight matches; auto-expand domains with hits.
- Normalize Arabic in the search term (alef variants, ة/ه, tashkeel) so أ/ا differences still match.
- Click a table -> `insertHint(tableName)` in store appends a hint such as `من جدول Sales.SalesOrderHeader` to the chat input draft (without overwriting existing text, and without auto-sending).
- Integrated into the left/right sidebar column of Retaj's 3-column layout.

### Tests
- Jest + RTL: accordion toggle, search filtering, click inserts hint into the store (Renad set up the Jest framework, TASK-RE-01).

### Acceptance
- Works in Chrome and Edge (both listed in the risk mitigation), no layout break in RTL, hint insertion visible in `ArabicInputBar`.

---

## 8. Phase 4: RO-08 API Reference

**Branch:** `docs/TASK-RO-08-api-reference`
**File:** `Docs/API-Reference.md`

### Outline
1. Base URL, versioning (`/api/v1`), headers, error format.
2. **REST:** `POST /chat`, `GET /health`, `GET /schema`. For each: purpose, params, request example, response example, status codes, curl command.
3. **WebSocket `WS /api/v1/chat/ws`:** connection lifecycle, client message format, and the event sequence `thinking -> schema_pruned -> sql_generated -> sql_validated -> executed -> answer`, plus the error event and retry telemetry from the self-correction loop.
4. **Shared models:** `ChatMessage`, `QueryData`, `ChartConfig` (bar, pie, line, kpi, table), `HealthStatus`, mirrored from `frontend/src/types/index.ts`.
5. Security notes: what is blocked by the AST validator and what the client sees when a query is rejected.

### Method
- Export `/openapi.json` from the running FastAPI app and use it as the source of truth for REST; verify every example by actually calling the endpoint (do not copy-paste untested JSON).
- WebSocket events are not in OpenAPI: confirm payloads with Moustafa and test with `wscat`.
- Doc-as-you-code rule: your `/schema` section is written in RO-05's PR; this task compiles and unifies the rest.

---

## 9. Phase 5: RO-09 Demo Video and RO-10 Defense

### RO-09: Demo video (3-5 min)
**Script outline**
| Time | Content |
|---|---|
| 0:00-0:30 | Problem: non-technical users cannot query ERP data; Egyptian Arabic input |
| 0:30-1:30 | Live queries: sales, inventory, a Franco-Arabic query, a chart + table result |
| 1:30-2:15 | SQL Inspector, thinking stages via WebSocket |
| 2:15-3:00 | Self-correction: a query that fails and is repaired automatically |
| 3:00-3:45 | Security: a write-intent prompt (e.g. "امسح جدول العملاء") blocked |
| 3:45-4:30 | Schema Explorer click-to-insert, health badge, results (EX / latency) |

**Prep:** use the 10 pre-cached golden queries from Abdallah's fallback plan; rehearse twice; record at 1080p with OBS, narrate after capture if live audio is noisy; export `demo-video.mp4` (keep out of git, large files are blocked by `.gitignore` conventions, share via Drive link in README).

### RO-10: Defense section (RAG Pruner + Dataset Pipeline)
Your slides in the shared 11-slide deck:
1. Dataset pipeline: schema extraction -> templates -> dialect engine -> 800/200 split by template.
2. Why pruning: 71 tables will not fit a 4096-context 3B model; show tokens before vs. after pruning.
3. Pruner algorithm diagram: domain filter -> scoring -> FK expansion -> token budget.
4. Numbers: pruner recall, EX/VSR from `evaluation_report.json`, per-domain results.

Prepare answers to likely questions: why split by template, how you avoid leakage, what happens when the pruner misses a needed table, how Franco-Arabic is handled.

---

## 10. Cross-cutting rules (from the project governance)

- **Branches:** `feat/TASK-RO-0X-short-description`; no direct pushes to `main`.
- **Commits:** Conventional Commits, e.g. `feat(nlp): add dialect engine`, `feat(agent): add rag schema pruner`, `test(schema): add pruner recall test`, `docs(api): add websocket events`.
- **Doc-as-you-code:** document each module in its own PR before merge.
- **Blocker rule:** blocked > 2 hours -> tag your pair partner on WhatsApp/Discord.
- **PR review:** you review your partners' PRs and they review yours (Abdallah for RO-01/04, Adel for RO-02/03, Retaj for RO-06/07).

## 11. Risks specific to your tasks

| Risk | Mitigation |
|---|---|
| DDL format differs between training and inference | Single shared formatter + byte-equality test (RO-02/RO-04) |
| Train/val leakage inflates EX | Split by `template_id`, dedupe questions |
| Pruner drops a required table | Recall metric on val set; FK bridge expansion; fallback to full domain |
| RTL glitches in the explorer | Explicit `dir` at container level; LTR wrappers for identifiers; test Chrome and Edge early |
| Waiting on other modules | Stub the normalizer, mock `getSchema`; develop against agreed interfaces |
| Exam weeks | Pair partner can take over open branches; keep PRs small |

## 12. Final checklist

- [ ] RO-01: `schema_metadata.json` with 71 tables / 91 FKs, bilingual descriptions
- [ ] RO-02: 1,000+ samples, 800/200 split, no template leakage, gold SQL all executes
- [ ] RO-03: evaluator reports EX, VSR, per-domain; gold-vs-gold = 100%
- [ ] RO-04: pruner recall >= 95%, <= 2,000 tokens, same DDL format as training
- [ ] RO-05: `/schema` route with filters and passing tests
- [ ] RO-06: SchemaExplorer RTL accordions integrated in layout
- [ ] RO-07: search filter + click-to-insert via Zustand slice
- [ ] RO-08: `API-Reference.md` verified against the running API
- [ ] RO-09: narrated 3-5 min demo video
- [ ] RO-10: defense slides and rehearsed answers
