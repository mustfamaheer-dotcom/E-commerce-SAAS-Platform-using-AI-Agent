# 🎓 TalkShow: Graduation Presentation Deck Specification & Speaker Notes
## Data Science & Artificial Intelligence Department — Graduation Project 2026

**Project Title:** TalkShow: Next-Generation Multi-Tenant Agentic E-Commerce & ERP Operating System  
**Presentation File:** [`TalkShow_Graduation_Presentation.pptx`](file:///D:/HITU/2/AI/Project-AI/Docs/TalkShow_Graduation_Presentation.pptx)  
**Mirror Path:** [`Docs/Presentation/TalkShow_Graduation_Presentation.pptx`](file:///D:/HITU/2/AI/Project-AI/Docs/Presentation/TalkShow_Graduation_Presentation.pptx)  
**Theme:** Ultra-Modern Tech Light Theme (`#F8FAFC` Slate-50, `#FFFFFF` Cards, `#0F172A` Slate-900 Typography)  
**Accents:** Sky Blue (`#0284C7`), Emerald Green (`#059669`), AI Violet (`#7C3AED`), Amber (`#D97706`), Rose (`#E11D48`)  
**Format:** 16:9 Widescreen (`13.33" × 7.5"`)  
**Team Members:** مصطفى ماهر | عادل أحمد | عبد الله سامح | ريتاج حكيم | رناد حكيم | رُؤى أشرف  

---

### Slide Breakdown & Speaking Guide

| # | Slide Title | Core Theme / Section | Visual Components | Speaker Notes Summary (Arabic) |
|---|-------------|----------------------|-------------------|--------------------------------|
| **1** | **TalkShow Cover** | Title & Team | High-res logo, university badge, full team roster with vertical roles | ترحيب بلجنة التحكيم، تقديم اسم المشروع "منصة توك شو (TalkShow)" كمعمارية ERP وذكاء اصطناعي للشرق الأوسط. |
| **2** | **Executive Summary** | Project Thesis | 3 horizontal pillar cards (Autonomous Execution, Dialectal NLP, MLOps BI) | شرح الفكرة الجوهرية والتحول من واجهات الإدخال اليدوي القديمة للمحادثة التنفيذية الذكية. |
| **3** | **Section 1: The Problem** | 1. Problem | 2x2 grid: Operational fragmentation, relational BI blindspot, stockout crisis, dialect gap | تفصيل أزمات التجارة والتجزئة في مصر (تشتت الأدوات، صعوبة استخراج الـ SQL، خسارة 23% مبيعات بسبب نفاد المخزون). |
| **4** | **Problem Deep Dive** | 1. Problem Deep-Dive | 4 danger cards: Price hallucination, unbounded writes, prompt injection, tenant leak | لماذا تفشل الـ LLMs التقليدية كـ Chatbots عادية في إدارة الـ ERP ومخاطر الهلوسة وقانون حماية المستهلك 181/2018. |
| **5** | **Section 2: Challenges** | 2. Challenges | 4 cards: Text-to-SQL on 71 tables, deterministic LangGraph, asymmetric forecasting, RLS isolation | التحديات الهندسية الأربعة: تعقيد الـ SQL، كسر حلقات ReAct، التنبؤ بالطلب المتقطع ومواسم الأعياد، وعزل المستأجرين. |
| **6** | **Section 3: Solution Architecture** | 3. Architectural Blueprint | 5 full-width layer cards (Presentation, Gateway, LangGraph, MLOps, PostgreSQL RLS) | استعراض المعمارية الخماسية للـ Monorepo وتدفق البيانات من البرومبت حتى الحفظ والتنفيذ. |
| **7** | **LangGraph & HITL Gate** | 3. Agentic Solution | Two deep-dive cards: MasterCommandGraph state machine & 4-step HITL protocol | شرح بروتوكول الـ Human-in-the-Loop والمحاكاة الجافة (Dry-run) وحماية هامش الربح قبل أي تعديل. |
| **8** | **AST Sandboxed Text-to-SQL** | 3. Conversational BI | 5-layer defense badges: Dialect normalizer, schema pruner, sqlglot AST, row clamp, self-correction | تفصيل جدار الحماية الخماسي لاستعلامات قواعد البيانات ومنع الـ SQL Injection وحظر الـ DDL/DML. |
| **9** | **Predictive MLOps & ML** | 3. Machine Learning | 4 ML engine cards: Quantile LightGBM, SHAP Explainability, Dynamic ROP, Log-RFM K-Means | شرح النماذج الإحصائية (WAPE=14.2%، نطاق ثقة 95%، معادلات المخزون الآمن SS/ROP، وتجزئة العملاء الـ 5). |
| **10** | **Section 4: Generative UI** | 4. Live Experience | 4 GenUI cards: `<BulkPricePreviewCard>`, `<SalesForecastCard>`, `<InventoryAlertsList>`, `<OrderTrackingCard>` | الانتقال من الردود النصية لبطاقات React تفاعلية ديناميكية تسمح باتخاذ القرار والموافقة بنقرة واحدة. |
| **11** | **Dialect NLP in Action** | 4. Live Experience | 3 concrete prompt-to-execution scenarios with actual Egyptian prompts and step-by-step logic | استعراض واقعي لثلاثة سيناريوهات حية (خصم جماعي بالعامية، استعلام مالي تحليلي، وإنذار نفاد مخزون). |
| **12** | **Section 5: Tech Stack Details** | 5. Tech Stack | 5-column technical stack table (Frontend, Gateway, Agent, Data Store, MLOps) | تفصيل التقنيات وإصداراتها وأدوارها: React 18, FastAPI, LangGraph, PostgreSQL 16 RLS, Redis, LightGBM, MLflow. |
| **13** | **Offline & Edge AI (GGUF)** | 5. Edge AI Capabilities | 2 cards: Fine-tuned Qwen2.5-Coder-3B 4-bit and hardware efficiency on RTX 3050 (2.2GB VRAM) | استعراض ميزة التشغيل المحلي التام (Air-Gapped) بدون إنترنت أو تكلفة APIs وبأعلى خصوصية وسرعة 38 token/s. |
| **14** | **Academic Benchmarks & QA** | 5. Evaluation & Benchmarks | 4 big KPI stat boxes (98% F1, 92.4% EX, 99.2% VSR, 100% Security) + 6 slice test suites | استعراض نتائج تقييم الـ 100 برومبت مع حزم الاختبارات الستة الخاصة بكل عضو من أعضاء الفريق. |
| **15** | **Section 6: Future Roadmap** | 6. Future Plan | 3 horizontal phase cards: Phase 1 (E-Invoicing/Voice), Phase 2 (Social/Vision), Phase 3 (Federated) | خارطة الطريق المستقبلية: الربط مع مصلحة الضرائب المصرية، المساعد الصوتي المصري بـ Whisper، والتجارة الموحدة. |
| **16** | **Conclusion & Outro** | 6. Outro & Team | 2 summary cards: Key milestones, Arabic team acknowledgment, and live demo invitation | خاتمة العرض وشكر لجنة التحكيم ودعوتهم للبدء في العرض الحي التفاعلي (Live Demo) على المتجر ولوحة التحكم. |
