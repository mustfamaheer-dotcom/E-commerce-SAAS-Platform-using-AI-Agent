# TechZone: Agentic E-commerce Platform

## System Design, Technology Guide, and AI Agent

This document describes the full architecture of the platform, the proposed technologies and tools for each layer, the design of the AI Agent and its tools, and a practical implementation plan.

## 1. Project Overview

The core idea is that merchants do not have to deal with dozens of complex forms and dashboards. Instead, they interact with an AI Agent that has execution permissions. The Agent can build the store, manage inventory and products, answer analytical questions using data, and run Machine Learning models to forecast sales, all through conversation.

The platform is built on 3 main components:

1. **Chat Interface and Command Center**: where the merchant writes or speaks to the Agent, and sees results presented interactively (tables, charts, change previews).
2. **AI Agent (The Brain)**: understands intent, plans the steps, selects the right tool, and executes it.
3. **Data and ML Layer**: a relational database and a Machine Learning service that trains models and produces predictions.

## 2. System Philosophy: Chatbot vs. AI Agent

The most important point in this project is to clearly distinguish between a traditional chatbot and an agent.

| Aspect | Traditional Chatbot | AI Agent in the Platform |
| --- | --- | --- |
| Core role | Answers questions (FAQ) or searches fixed text | Operates the system: builds the store, modifies the database, runs ML models |
| Database interaction | Read-only or no connection at all | Read, write, and execute through specific, secured Tools |
| User interface | Isolated chat window separate from the site | Generative UI: the chat updates the interface in real time |
| AI technology | LLM for text generation only | LLM + Agentic Workflow + Classical ML |

The technical concept behind all of this is **Function Calling / Tool Use**: the LLM does not execute commands itself. Instead, it requests the execution of a specific function with defined parameters, and our code executes it after validation and permission checks.

## 3. Merchant Journey (User Journey)

### 3.1 Building a Store Through Conversation

The merchant writes, for example: "I want to create a store selling mobile and laptop accessories called TechZone, with a dark mode design, and prices in Egyptian pounds."

Steps performed by the Agent:

1. **Intent and Entity Extraction**: extracts the intent (create a store) and the entities (store name, product type, theme, currency).
2. **Slot Filling**: intelligently asks for missing data: payment methods, shipping policy, and an Excel file with initial products.
3. **Tool Call**: calls `create_store_tenant()` with the completed data.
4. **Generation**: generates the storefront and connects it to the database immediately.

### 3.2 Daily Management (Autonomous Operations)

Examples of merchant commands:

- "Add a 15% discount to all products in the speakers category that have more than 50 units in stock." The Agent converts the request into a query, displays a **Preview** of the expected changes, and executes only after the merchant confirms. This is the **Human-in-the-loop** principle, which is essential for any operation that modifies data.
- "What are the top 5 products that generated the highest net profit last week in Cairo?" The Agent translates the question into SQL (Text-to-SQL) and displays the result in a table or chart.

### 3.3 Intelligent Forecasting (ML Forecasting)

The merchant asks: "How many units of product X do I expect to sell next month? Do I need to order stock now?"

The Agent calls `run_sales_forecast(product_id, horizon=30)`. This tool runs a real ML model on the backend (XGBoost, LightGBM, or Prophet) trained on historical sales, seasonality, and discounts. It returns the result with confidence intervals, and the Agent explains it to the merchant in simple language along with a clear recommendation.

## 4. Proposed Technology Stack

### 4.1 Frontend Layer

- **Next.js (React + TypeScript)**: for the storefront and the dashboard. Well suited for store SEO, and supports Server Components and API Routes.
- **Tailwind CSS + shadcn/ui**: for building fast, well-organized interfaces with easy Dark Mode support.
- **Vercel AI SDK**: for streaming LLM responses, and supports rendering Tool Results as components (Generative UI).
- **Recharts or Apache ECharts**: for displaying charts generated from analytical queries.
- **i18n (next-intl)**: for Arabic and English support with RTL.

### 4.2 Backend Layer

- **Node.js (NestJS or Express)**: the core API for the store (Products, Orders, Cart, Payments).
- **Python (FastAPI)**: for the ML Service and any service that depends on data science libraries. This separation matters because ML lives in a Python environment.
- **Redis**: for caching, session management, and rate limiting.
- **BullMQ or Celery**: for long-running background jobs such as model training, report generation, and sending emails.

Note: you may choose a single language for the backend (all Python or all Node) if the team is small. However, separating the API from the ML Service provides greater flexibility and is easier to explain in an academic context.

### 4.3 Data Layer

- **PostgreSQL**: the primary database. Strong relational capabilities, JSONB support for flexible data, and the pgvector extension if you need embeddings for semantic search.
- **SQL Server**: an excellent alternative if you want to use the AdventureWorks database directly, since it was designed for it.
- **Prisma or Drizzle (Node)** / **SQLAlchemy (Python)**: as ORMs for safe database interaction.
- **S3 or Cloudinary**: for storing product images and uploaded files.
- **Elasticsearch or Meilisearch**: for fast full-text product search with Arabic support.

### 4.4 AI and Agent Layer

**Language Models (LLMs):**

- **Anthropic Claude** or **OpenAI GPT**: the primary LLM that understands intent and calls tools. Claude is excellent at Tool Use and following instructions.
- **Open-source model (Llama, Qwen, or Mistral)** via vLLM or Ollama: if you want to reduce costs or run locally for academic purposes.

**Frameworks:**

- **LangGraph**: for building the Agent as a State Graph. Well suited for multi-step workflows and Human-in-the-loop.
- **Semantic Kernel (Microsoft)**: a strong alternative if the team is experienced with .NET or Azure.
- **LlamaIndex**: if you need RAG over store documents (shipping policies, FAQs).
- **Custom Agent Loop**: a simple cycle: Prompt, LLM, Tool Call, Execute, Observation, then repeat. Very useful for academic understanding.

**Text-to-SQL:**

- **LangChain SQL Agent** or a custom pipeline.
- **Vanna.ai**: a library that learns the database schema and converts questions into SQL.
- **sqlglot**: a Python library for parsing and validating SQL before execution (critical for security).

**AI Observability:**

- **LangSmith** or **Langfuse** (open source): for tracing every step the Agent takes, reading traces, and evaluating quality.

### 4.5 Machine Learning Layer

**Forecasting Libraries:**

- **Prophet (Meta)**: easy to use, excellent for time series with seasonality and holidays.
- **LightGBM or XGBoost**: powerful Gradient Boosting models for tabular data, with features such as price, discount, day of week, month, and seasons.
- **statsmodels (SARIMA)**: classical statistical models as a baseline for comparison.
- **Darts or sktime**: unified time series libraries that make it easy to compare many models.

**Segmentation and Analysis:**

- **scikit-learn**: for preprocessing, K-Means, and RFM Analysis.
- **pandas and NumPy**: for data handling.
- **SHAP**: for explaining the impact of each feature on a prediction (explainability). This is very helpful when explaining results to the merchant and in academic discussion.

**MLOps:**

- **MLflow**: for experiment tracking, model storage, and version comparison.
- **Docker**: for packaging the ML Service.
- **Airflow or Prefect**: for scheduling model retraining weekly or monthly.

### 4.6 Infrastructure and DevOps

- **Docker and Docker Compose**: for local development and running all services together.
- **GitHub Actions**: for CI/CD.
- **Vercel**: for hosting the frontend.
- **Railway, Render, or AWS / Azure**: for the backend, the ML Service, and the database.
- **Cloudflare**: for the CDN and DDoS protection.

### 4.7 Payments and Shipping (Local Integrations)

To make the platform viable in Egypt, it is best to integrate with:

- **Paymob, Fawry, Kashier**: Egyptian payment gateways that support Visa, InstaPay, and Fawry.
- **Bosta, Aramex**: shipping companies that provide APIs for creating and tracking shipments.
- **Google Maps API**: for addresses and delivery.

Note: check the current documentation for each service before implementation, since prices and APIs change.

### 4.8 Security and Authentication

- **Clerk, Auth0, or NextAuth**: for managing sign-in and roles (merchant, customer, admin).
- **JWT**: for session tokens.
- **Row Level Security (RLS) in PostgreSQL**: to ensure each merchant can only see their own data (multi-tenancy).
- **Secrets Manager**: for securely storing API keys.

## 5. System Architecture

The proposed architecture is organized into clear layers:

```
[ Merchant / Customer ]
        |
        v
[ Next.js Frontend: Storefront + Dashboard + Chat UI ]
        |
        v
[ API Backend (NestJS) ] <----> [ Redis Cache ]
        |
        |----> [ AI Agent Service (LangGraph + LLM) ]
                     |                 |
                     v                 v
              [ Tools Layer ]   [ Guardrails & Audit ]
                |        |          |
                v        v          v
        StoreBuilder  DB Query   ML Forecast API
                |        |          |
                v        v          v
        [ PostgreSQL ]  [ Read-only Replica ]  [ FastAPI ML Service + MLflow ]
        |
        v
[ S3 / Object Storage ]
```

### 5.1 Layer Description

**Presentation Layer:** Next.js serves the storefront to customers, the dashboard to merchants, and the Chat UI for interacting with the Agent. The Chat UI receives responses as a stream. When the Agent returns structured output, the frontend renders it as the appropriate component (table, chart, product card, or confirmation button).

**API Layer:** handles authentication and authorization, receives requests from the frontend, and routes them to the appropriate services. It is responsible for verifying that a given merchant has permission to edit a given product.

**Agent Layer:** receives the merchant's message along with context (store ID, user permissions, previous conversation), and decides on the steps. It is critical that the Agent operates with a fixed Tenant Context, meaning it cannot access another store's data even if the user requests it.

**Tools Layer:** each tool has a defined schema (input and output), permissions, and validation rules that run before execution.

**Data Layer:** PostgreSQL is the Source of Truth. Analytical queries (Text-to-SQL) run on a Read-only Replica or through a database user with read-only permissions, so that any error or Prompt Injection cannot modify the data.

**ML Layer:** a separate service that receives forecasting requests and returns results. Training happens periodically (Batch Jobs), while prediction happens in real time (Inference) using the saved model.

## 6. Database Design

The schema is inspired by AdventureWorks and adapted to a multi-tenant e-commerce context.

```
tenants (id, name, currency, theme, created_at)
users (id, tenant_id, email, role, created_at)
categories (id, tenant_id, name, parent_id)
products (id, tenant_id, category_id, sku, name, price, cost, is_active)
inventory (id, product_id, quantity, reorder_level, updated_at)
customers (id, tenant_id, name, email, phone, city, created_at)
orders (id, tenant_id, customer_id, status, total, created_at)
order_items (id, order_id, product_id, quantity, unit_price, discount)
promotions (id, tenant_id, name, discount_pct, starts_at, ends_at)
agent_actions (id, tenant_id, user_id, tool_name, params, status, created_at)
```

Key design points:

- **tenant_id in every table**: the foundation of multi-tenancy. Combined with RLS, it guarantees isolation between merchants.
- **agent_actions table**: an Audit Log of every tool the Agent executed. This is important for security, error tracing, and system evaluation.
- **Separating cost from price**: allows calculating Net Profit in analytical queries.

## 7. Detailed AI Agent Design

### 7.1 Agent Loop

1. The merchant sends a message.
2. The Agent analyzes the intent and determines whether it needs additional information (Slot Filling).
3. It plans the steps (Planning) if the request involves multiple stages.
4. It selects the appropriate tool (Tool Selection) and determines the parameters.
5. Guardrails verify permissions and inputs.
6. The tool executes and returns an Observation.
7. The Agent decides: continue, ask the merchant, or respond with the result.
8. Every step is recorded in the Audit Log and traced in Langfuse.

### 7.2 Agent Toolkit

| Tool | Function | Operation Type | Requires Confirmation? |
| --- | --- | --- | --- |
| create_store_tenant(name, currency, theme, payment_methods) | Create a new store | Write | Yes |
| update_product(product_id, fields) | Edit a product | Write | Yes |
| bulk_update_prices(filter, discount_pct) | Bulk price changes | Write | Yes, with Preview |
| search_products(query, filters) | Search products | Read | No |
| query_sales_data(natural_language) | Convert a question to SQL and execute it | Read | No |
| run_sales_forecast(product_id, horizon) | Sales forecasting | Read (ML) | No |
| get_inventory_alerts() | Products nearing stockout | Read | No |
| create_promotion_for_segment(segment, discount) | Coupon for a customer segment | Write | Yes |
| get_customer_segments() | RFM segments | Read (ML) | No |

Important principle: any tool that modifies data must show a Preview and require explicit confirmation before execution.

### 7.3 Design of Each Tool

Every tool must have:

- **A clear schema** (JSON Schema) for its parameters, so the LLM can use it correctly.
- **An accurate description**: the LLM selects tools based on their descriptions, so vague descriptions cause errors.
- **Validation** of inputs before execution.
- **A permission check**: does the user and the tenant have authorization?
- **Idempotency**: if the tool is accidentally executed twice, it should not produce the same effect twice.

### 7.4 Secure Text-to-SQL

This is the riskiest part of the Agent, because the LLM may generate incorrect or dangerous SQL. Protection is implemented in layers:

1. **Read-only User**: the database connection uses read-only privileges.
2. **Schema Scoping**: the LLM can only see permitted tables, and results are automatically filtered by tenant_id.
3. **SQL Validation**: sqlglot ensures the query is a SELECT only, with no DROP, DELETE, or UPDATE allowed.
4. **Query Timeout and Row Limit**: prevents heavy queries from overloading the database.
5. **Self-correction**: if a query fails, the Agent reads the error and attempts to fix it, up to a maximum number of retries.

### 7.5 Prompt Injection and Security

The Agent processes user text, and someone may attempt to make it ignore its instructions. Protections include:

- Clearly separating the System Prompt from user data.
- Tools do not accept raw commands, only defined parameters.
- Any content from external sources (for example, a product description from a supplier) is treated as Data, not as Instructions.
- Permissions do not rely on the LLM. The backend makes the decisions, not the prompt.

### 7.6 Memory

- **Short-term Memory**: the most recent messages in the same session.
- **Long-term Memory**: merchant preferences (for example: "always show prices in pounds") stored in a separate table.
- **Store Context**: stable store information (name, currency, payment methods) is included in the System Context on every request.

### 7.7 Generative UI

Instead of replying with long text, the Agent returns Structured Output, and the frontend converts it into a component:

- Query result: an interactive table.
- Sales forecast: a chart with a confidence band.
- Price change: a Preview card with confirm and cancel buttons.
- Store creation: a storefront Preview next to the chat.

## 8. ML Pipeline Design

### 8.1 Data Sources

- **AdventureWorks (Microsoft)**: a comprehensive database for a fictional company, well suited for training on schema design and queries.
- **Olist Brazilian E-commerce Dataset (Kaggle)**: real, anonymized order data from a Brazilian store, well suited for sales forecasting and customer analysis.
- **Online Retail Dataset (UCI)**: transaction data from a UK store, widely used for RFM analysis.
- **The merchant's own data** after they start using the platform.

### 8.2 Pipeline Steps

1. **Data Ingestion**: pull data from the database or CSV files.
2. **Cleaning**: handle missing values, outliers, and returns.
3. **Feature Engineering**: create features such as lag features (sales over the last 7, 14, and 28 days), rolling averages, day of week, month, holidays, discount percentage, and price changes.
4. **Time-based Train/Test Split**: critically important. Never use a random split for time series. Training must be on the past and testing on the future.
5. **Training**: compare Prophet, LightGBM, and SARIMA as a baseline.
6. **Evaluation**: use MAE, RMSE, and MAPE or WAPE.
7. **Explainability**: SHAP values to explain each decision.
8. **Deployment**: store the model in MLflow and serve it through FastAPI.
9. **Monitoring**: track data drift and performance degradation.

### 8.3 Example Features

| Feature | Description |
| --- | --- |
| sales_lag_7 | Product sales 7 days ago |
| sales_rolling_mean_28 | Average sales over the last 28 days |
| discount_pct | Discount percentage on that day |
| day_of_week | Day of the week |
| is_holiday | Whether the day is a holiday or a seasonal period |
| stock_level | Current inventory level |

### 8.4 Customer Segmentation

We use **RFM Analysis**:

- **Recency**: how long ago the customer last made a purchase.
- **Frequency**: how many times they have purchased.
- **Monetary**: the total amount they have spent.

Afterward, K-Means can be used to group customers into segments (VIP, customers at risk of churning, new customers). With the merchant's approval, the Agent can automatically suggest a coupon for a specific segment.

## 9. Academic Perspective: Why This Project Is Strong in AI Coursework

The project covers three major AI areas within one cohesive system:

1. **Natural Language Processing (NLP and LLMs)**: understanding intent, Slot Filling, and converting natural language into programmatic commands and SQL queries.
2. **Agentic Systems and Reasoning**: planning, tool selection, and executing multi-step tasks with Human-in-the-loop.
3. **Predictive Machine Learning (Supervised and Time Series)**: building and evaluating sales forecasting models and connecting their outputs to Agent decisions.

The project also offers an important discussion on **evaluation**: how to measure the quality of the Agent itself (tool selection accuracy, Text-to-SQL success rate, merchant satisfaction). This is a genuine research topic.

## 10. Proposed Implementation Plan (Roadmap)

**Phase 1: Foundation (Weeks 1-2)**

- Design the schema, set up PostgreSQL, and load AdventureWorks or Olist.
- Build the core backend (CRUD for products and orders).

**Phase 2: Core Agent (Weeks 3-4)**

- Set up LangGraph and the first tools: search_products and query_sales_data.
- Build Text-to-SQL with full protections.

**Phase 3: Machine Learning (Weeks 5-6)**

- Train and compare forecasting models.
- Build a FastAPI service and connect it to the Agent as a tool.

**Phase 4: Management and Editing (Weeks 7-8)**

- Add Write tools with Preview and Confirmation.
- Audit Log and Langfuse for tracing.

**Phase 5: Frontend and Generative UI (Weeks 9-10)**

- Chat UI that renders tables and charts as components.
- Storefront and Dashboard.

**Phase 6: Evaluation and Documentation (Weeks 11-12)**

- Build a test suite for the Agent (Evaluation Dataset).
- Measure performance, compare models, and write the report.

## 11. Closing Notes

- **Start with reading before editing**: an Agent that reads data safely is much easier to build than one that modifies it. Start with Read tools and add Write tools only after you have verified the Guardrails.
- **Preview and confirmation are mandatory** for any operation that changes data. This protects the merchant and the project.
- **Clear tool documentation** (Tool Descriptions) has a major impact on Agent quality. Treat it as part of the design, not a minor detail.
- **Define the project scope**: the full platform is large. Focus deeply on one part (for example, the Agent and Forecasting) and keep the remaining parts mocked or simplified. This makes for a stronger graduation project and a clearer presentation.
