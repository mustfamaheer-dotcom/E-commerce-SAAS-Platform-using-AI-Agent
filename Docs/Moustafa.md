# Moustafa Maher: Tasks & Technical Plan

**Project:** Intelligent ERP Data Navigator (Text-to-SQL AI Agent for AdventureWorks2019)
**Role:** Lead Architect & Full-Stack / Autonomous Agent Engineer
**Target DB:** SQL Server 2019 (AdventureWorks2019)
**Base Model:** Qwen2.5-Coder-3B
**Timeline:** 10 weeks (Phase 0 to Phase 5)
**Plan Version:** 1.0 (Oct 2026)

---

## 1. My Role Summary

I co-architect the repository and the Python/Node environments, build the autonomous self-correction agent, implement real-time WebSocket streaming across FastAPI and Next.js, build the typed frontend API client and WebSocket hook, lead integration and code reviews, and co-author the System Architecture documentation.

**Squad:** B (Backend Core, NLP & Agent Intelligence) and C (Next.js RTL Frontend, Visualizations & Streaming)

**Pair Partners:**
- Adel Ahmed (self-correction loop, AI pipeline)
- Abdallah Sameh (WebSocket route, backend orchestration)
- Retaj Hakim (frontend API client, WebSocket hook)
- Renad Hakim, Ro'aa Ashraf (integration and reviews)

**Total tasks:** 10 (80% core engineering, 20% testing and documentation)

---

## 2. Task Overview

| Task ID | Description | Partner | Phase | Week | Status |
|---|---|---|---|---|---|
| TASK-M-01 | GitHub repo, branch protection, Kanban board | Solo | 0 | 1–2 | PENDING |
| TASK-M-02 | Root `.gitignore` and locked dependencies | Solo | 0 | 1–2 | PENDING |
| TASK-M-03 | Autonomous `self_correction.py` (3x reflection loop) | Adel Ahmed | 2 | 5–6 | PENDING |
| TASK-M-04 | WebSocket `/api/v1/chat/ws` streaming route | Abdallah Sameh | 2 | 5–6 | PENDING |
| TASK-M-05 | Typed frontend REST API client (`src/lib/api.ts`) | Retaj Hakim | 3 | 7–9 | PENDING |
| TASK-M-06 | `useAgentStream.ts` WebSocket React hook | Retaj Hakim | 4 | 7–9 | PENDING |
| TASK-M-07 | End-to-end CORS, env config, full-stack integration | All | 4 | 9–10 | PENDING |
| TASK-M-08 | PR code reviews, conflict resolution, release merge | All | 4 | 9–10 | PENDING |
| TASK-M-09 | System Architecture section in `README.md` and design doc | Solo | 5 | 10 | PENDING |
| TASK-M-10 | Present Architecture & Self-Correction in final defense | Solo | 5 | 10 | PENDING |

---

## 3. Detailed Tasks

### TASK-M-01: GitHub Architecture, Branch Protection & Kanban
- **Phase:** 0 | **Week:** 1–2 | **Status:** PENDING
- **Actions:**
  - Configure protected `main` and integration `dev` branches.
  - Set up the feature branch workflow.
  - Create a GitHub Project v2 Kanban board with balanced technical labels.
- **Deliverable:** Protected repository and Kanban board.

### TASK-M-02: Environment & `.gitignore`
- **Phase:** 0 | **Week:** 1–2 | **Status:** PENDING
- **Actions:**
  - Author the root `.gitignore`, blocking `*.gguf`, `*.bak`, `.venv/`, and `node_modules/`.
  - Lock dependencies in `backend/requirements.txt` and `training/requirements_training.txt`.
- **Deliverable:** Locked dependency specifications.

### TASK-M-03: Autonomous Self-Correction Agent (`self_correction.py`)
- **Phase:** 2 | **Week:** 5–6 | **Status:** PENDING
- **Pair:** Adel Ahmed, Abdallah Sameh
- **Actions:**
  - Build `SelfCorrector` in `backend/agent/self_correction.py`, orchestrating up to `MAX_RETRIES = 3`.
  - Execute the pipeline: initial SQL generation → AST validation → DB execution.
  - On a pyodbc error, inject the failed T-SQL and the SQL Server error message into `build_reflection_prompt()` so the model repairs the query autonomously.
- **Deliverable:** `self_correction.py` with structured retry telemetry and unit tests.

### TASK-M-04: WebSocket Streaming Route (`WS /api/v1/chat/ws`)
- **Phase:** 2 | **Week:** 5–6 | **Status:** PENDING
- **Pair:** Abdallah Sameh
- **Actions:**
  - Implement an asynchronous WebSocket endpoint in `backend/api/routes/chat.py`.
  - Stream live agent stages to the client in order: `thinking`, `schema_pruned`, `sql_generated`, `sql_validated`, `executed`, `answer`.
- **Deliverable:** Streaming endpoint verified with Postman or `wscat`.

### TASK-M-05: Typed Frontend API Client (`frontend/src/lib/api.ts`)
- **Phase:** 3 | **Week:** 7–9 | **Status:** PENDING
- **Pair:** Retaj Hakim
- **Actions:**
  - Build a typed Axios/Fetch client connecting Next.js to FastAPI.
  - Expose `sendMessage`, `getSchema`, and `getHealth`.
  - Add interceptors and error boundaries.
- **Deliverable:** Typed REST client.

### TASK-M-06: WebSocket React Hook (`frontend/src/hooks/useAgentStream.ts`)
- **Phase:** 4 | **Week:** 7–9 | **Status:** PENDING
- **Pair:** Retaj Hakim
- **Actions:**
  - Implement a custom hook that manages the WebSocket connection lifecycle.
  - Handle state transitions and live stage progression for the chat UI.
- **Deliverable:** Complete frontend-to-backend REST and WebSocket integration layer.

### TASK-M-07: Full-Stack Integration (CORS, Env, Startup)
- **Phase:** 4 | **Week:** 9–10 | **Status:** PENDING
- **Pair:** All engineers
- **Actions:**
  - Wire end-to-end CORS and environment configuration.
  - Verify Docker and local startup scripts.
- **Deliverable:** Working full-stack startup.

### TASK-M-08: Code Reviews & Release Merge
- **Phase:** 4 | **Week:** 9–10 | **Status:** PENDING
- **Pair:** All engineers
- **Actions:**
  - Lead cross-branch PR reviews.
  - Resolve integration conflicts on `dev`.
  - Merge the production release into `main`.
- **Deliverable:** Production release on `main`.

### TASK-M-09: System Architecture Documentation
- **Phase:** 5 | **Week:** 10 | **Status:** PENDING
- **Actions:**
  - Author the System Architecture and Deployment sections of `README.md`.
  - Write `Docs/System-Design-and-Technical-Plan.md`.
- **Deliverable:** Architecture documentation.

### TASK-M-10: Final Defense Presentation
- **Phase:** 5 | **Week:** 10 | **Status:** PENDING
- **Actions:** Present the Architecture and Self-Correction slides in the final defense.
- **Deliverable:** Presented slides and defense participation.

---

## 4. Technical Plan

### 4.1 Components I Own
| Component | Path | Purpose |
|---|---|---|
| Self-Correction Agent | `backend/agent/self_correction.py` | Retry loop (max 3) that repairs failed T-SQL using DB error messages |
| WebSocket Route | `backend/api/routes/chat.py` (`/api/v1/chat/ws`) | Streams agent stages live to the UI |
| API Client | `frontend/src/lib/api.ts` | Typed REST client for `sendMessage`, `getSchema`, `getHealth` |
| Streaming Hook | `frontend/src/hooks/useAgentStream.ts` | WebSocket lifecycle and stage state for the chat UI |
| Architecture Docs | `README.md`, `Docs/System-Design-and-Technical-Plan.md` | System design and deployment documentation |

### 4.2 Agent Pipeline (Self-Correction Flow)
1. Receive the user question and the pruned schema.
2. Generate T-SQL with the model runner.
3. Validate the SQL through the AST security gate (`sqlglot`, `tsql` dialect).
4. Execute through the pyodbc executor.
5. On error, build a reflection prompt containing the failed SQL and the SQL Server error, then regenerate.
6. Stop after a successful execution or after 3 retries, and return structured telemetry for each attempt.

### 4.3 Streaming Stages (WebSocket Events)
Emitted in order: `thinking` → `schema_pruned` → `sql_generated` → `sql_validated` → `executed` → `answer`.

### 4.4 Frontend Integration
- **REST:** `api.ts` covers `sendMessage`, `getSchema`, and `getHealth`, with interceptors and error boundaries.
- **WebSocket:** `useAgentStream.ts` opens the connection, tracks stage transitions, and feeds the chat bubbles and thinking indicator built by Retaj.

### 4.5 Project Acceptance Criteria Relevant to My Work
| Criterion | Target |
|---|---|
| Self-Correction Loop | Automatic reflection retry up to 3 times |
| End-to-End Latency | < 3.0 seconds per query (RTX 3050) |
| Safety Compliance | 100% (zero DML/DDL reaches the DB) |
| Shared Documentation | Co-authored README, API reference, QA, and slides |

### 4.6 Risks I Help Mitigate
| Risk | Mitigation |
|---|---|
| Next.js RTL layout glitches | Test in Chrome and Edge early; enforce explicit `dir="rtl"` at container level |
| SQL Server drops during live demo | Pre-cached golden demo responses and automatic pyodbc reconnect (with Abdallah) |
| Team member unavailable (exams) | Pair partners take over open branches |

---

## 5. Collaboration Rules
- **Branching:** Every task uses a dedicated branch named `feat/TASK-ID-shortdescription`. Direct pushes to `main` are blocked.
- **Commits:** Use Conventional Commits, for example `feat(agent): add self-correction loop`.
- **Reviews:** Partners review each other's PRs.
- **Docs-as-you-code:** Document the API, algorithm, or component I build before my PR is merged.
- **Blockers:** If blocked for more than 2 hours, tag my pair partner immediately for a live debugging session.

---

## 6. Personal Checklist
- [ ] TASK-M-01: Repo, branch protection, Kanban
- [ ] TASK-M-02: `.gitignore` and locked requirements
- [ ] TASK-M-03: `self_correction.py` with tests
- [ ] TASK-M-04: WebSocket streaming route
- [ ] TASK-M-05: `api.ts` typed client
- [ ] TASK-M-06: `useAgentStream.ts` hook
- [ ] TASK-M-07: Full-stack integration
- [ ] TASK-M-08: PR reviews and release merge
- [ ] TASK-M-09: Architecture documentation
- [ ] TASK-M-10: Defense presentation
