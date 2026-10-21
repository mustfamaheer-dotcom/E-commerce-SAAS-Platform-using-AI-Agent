# Moustafa — Full Implementation Plan

> **Role:** Conversational Store Builder & Multi‑Tenant Architecture Lead
> **Vertical Slice:** Store Builder & Multi‑Tenancy
> **PDF Sections:** 3.1, 4.1, 4.8 & 6
> **Owner:** Moustafa Maher
> **Date:** 2026‑10‑21

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Role Overview & Ownership Scope](#2-role-overview--ownership-scope)
3. [Task 1 — Frontend & Generative UI (React 18)](#3-task-1--frontend--generative-ui-react-18)
4. [Task 2 — Backend & API Layer (NestJS)](#4-task-2--backend--api-layer-nestjs)
5. [Task 3 — Database & Security Layer (PostgreSQL + RLS)](#5-task-3--database--security-layer-postgresql--rls)
6. [Task 4 — AI Agent & LLM Layer (LangGraph)](#6-task-4--ai-agent--llm-layer-langgraph)
7. [Task 5 — Machine Learning & Data Science Layer (Python)](#7-task-5--machine-learning--data-science-layer-python)
8. [Cross‑Cutting Concerns](#8-cross-cutting-concerns)
9. [12‑Week Phased Roadmap](#9-12-week-phased-roadmap)
10. [Risk Register & Mitigations](#10-risk-register--mitigations)
11. [Definition of Done (DoD)](#11-definition-of-done-dod)
12. [References](#12-references)

---

## 1. Executive Summary

Moustafa owns the **end‑to‑end conversational store creation pipeline**. A merchant types a message like _"I want to create a store selling mobile accessories called TechZone in dark mode with EGP currency"_ and receives a fully isolated, live multi‑tenant storefront — provisioned via a LangGraph slot‑filling agent, secured by PostgreSQL Row‑Level Security, and bootstrapped with ML‑cleaned product data.

This plan covers all **5 layers** of Moustafa's vertical slice:

| # | Layer | Deliverable |
|---|-------|-------------|
| 1 | **Frontend & GenUI** | Live Storefront Preview & RTL Theme UI |
| 2 | **Backend & API** | Tenant Provisioning API & Clerk/JWT Guards |
| 3 | **Database & Security** | `tenants`, `users` + PostgreSQL RLS |
| 4 | **AI Agent & LLM** | Slot‑Filling Graph + `create_store_tenant` |
| 5 | **ML & Data Science** | Cold‑Start Excel Cleaner & SKU Classifier |

---

## 2. Role Overview & Ownership Scope

```mermaid
flowchart TD
    Merchant["🧑‍💼 Merchant (Arabic / English)"]
    Chat["💬 Chat Interface"]
    Agent["🤖 LangGraph Onboarding Agent"]
    SlotFill["📋 Slot‑Filling Router"]
    Preview["🖥️ StoreCreationPreviewCard"]
    Confirm["✅ Confirm / Cancel"]
    API["⚙️ NestJS Provisioning API"]
    DB["🗄️ PostgreSQL + RLS"]
    ML["🧠 Excel Cleaner + SKU Classifier"]
    Store["🏪 Live Storefront"]

    Merchant --> Chat --> Agent
    Agent --> SlotFill
    SlotFill -->|"Missing slots"| Chat
    SlotFill -->|"All slots filled"| Preview
    Preview --> Confirm
    Confirm -->|"Approved"| API
    API --> DB
    API --> ML
    DB --> Store
    ML --> Store
```

**Ownership boundaries:**

- Moustafa is the **sole owner** of tenant provisioning, authentication scaffolding, RLS policies, the onboarding LangGraph sub‑graph, and the catalog ingest ML pipeline.
- Integration points with other team members: Adel (products schema), Abdallah (analytics views), Retaj (forecast endpoints), Renad (orders/customers schema), Roaa (agent_actions audit table, memory, guardrails).

---

## 3. Task 1 — Frontend & Generative UI (React 18)

### 3.1 Title

**Multi‑Tenant Storefront Engine, RTL Theme System & Live Onboarding Preview Card**

### 3.2 Summary

Build the customer‑facing dynamic React storefront and the split‑screen Generative UI preview that updates live as the merchant chats with the Agent.

### 3.3 Implementation Steps

#### Step 1: Dynamic Storefront Routes

| Item | Detail |
|------|--------|
| **What** | Create React Router v6 storefront routes that resolve tenant branding dynamically |
| **Files** | `apps/web/src/pages/storefront/StorePage.tsx`, `apps/web/src/pages/storefront/StoreLayout.tsx` |
| **How** | Use TanStack Query (`useQuery`) to fetch tenant config (`name`, `theme`, `currency`, `logo_url`) from `GET /api/v1/tenants/:slug`. Inject CSS variables (e.g., `--brand-primary`, `--brand-bg`) into the layout root. |
| **Routing** | `/:tenantSlug` → `StoreLayout` → nested `StorePage`, `ProductPage`, `CartPage` |
| **Lazy Loading** | `React.lazy(() => import('./StorePage'))` with `Suspense` fallback skeleton |

```tsx
// apps/web/src/pages/storefront/StoreLayout.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTenantConfig } from '@/api/tenants';

export default function StoreLayout() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', tenantSlug],
    queryFn: () => fetchTenantConfig(tenantSlug!),
  });

  if (isLoading) return <StoreSkeleton />;

  return (
    <div
      dir={tenant.language === 'ar' ? 'rtl' : 'ltr'}
      style={{
        '--brand-primary': tenant.theme.primaryColor,
        '--brand-bg': tenant.theme.backgroundColor,
      } as React.CSSProperties}
    >
      <StoreHeader tenant={tenant} />
      <Outlet />
      <StoreFooter tenant={tenant} />
    </div>
  );
}
```

#### Step 2: Generative UI Preview Card

| Item | Detail |
|------|--------|
| **What** | Build `<StoreCreationPreviewCard />` — rendered inside the chat stream when the Agent collects onboarding slots |
| **File** | `apps/web/src/components/gen-ui/StoreCreationPreviewCard.tsx` |
| **Props** | `storeName`, `theme` (dark/light), `currency`, `paymentMethods[]`, `shippingPolicy`, `logoUrl`, `onConfirm()`, `onCancel()` |
| **Visual** | Shows live color palette swatch, currency badge (`EGP`/`USD`/`SAR`), payment gateway icons, and a **"Launch Store Now"** CTA button |
| **Streaming** | Component re‑renders as each slot arrives via SSE stream; partial state shows placeholder shimmer for unfilled slots |

```tsx
// apps/web/src/components/gen-ui/StoreCreationPreviewCard.tsx
interface StorePreviewProps {
  storeName: string;
  theme: 'dark' | 'light';
  currency: 'EGP' | 'USD' | 'SAR';
  paymentMethods: string[];
  shippingPolicy: string;
  logoUrl?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StoreCreationPreviewCard(props: StorePreviewProps) {
  return (
    <Card className={cn('w-full max-w-md', props.theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white')}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {props.logoUrl
            ? <img src={props.logoUrl} alt="logo" className="w-10 h-10 rounded-lg" />
            : <Skeleton className="w-10 h-10 rounded-lg" />}
          <div>
            <CardTitle>{props.storeName || <Skeleton className="h-5 w-32" />}</CardTitle>
            <Badge variant="outline">{props.currency}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Color palette preview */}
        <ThemePaletteSwatch theme={props.theme} />
        {/* Payment gateways */}
        <PaymentGatewayIcons methods={props.paymentMethods} />
        {/* Shipping policy */}
        <p className="text-sm text-muted-foreground">{props.shippingPolicy}</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={props.onConfirm} className="flex-1">🚀 Launch Store Now</Button>
        <Button variant="ghost" onClick={props.onCancel}>Cancel</Button>
      </CardFooter>
    </Card>
  );
}
```

#### Step 3: Internationalisation & Theme Switching

| Item | Detail |
|------|--------|
| **What** | Configure `react-i18next` with Arabic (`ar-EG` RTL) and English (`en-US` LTR) dictionaries |
| **Files** | `apps/web/src/i18n/index.ts`, `public/locales/ar-EG/common.json`, `public/locales/en-US/common.json` |
| **Theme** | CSS variables for dark/light mode; toggle via `useTheme()` hook backed by `localStorage` |
| **RTL** | `document.documentElement.dir = 'rtl'` set on language change |

```ts
// apps/web/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    supportedLngs: ['en-US', 'ar-EG'],
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng.startsWith('ar') ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;
```

### 3.4 Technical Specifications

| Category | Details |
|----------|---------|
| **Key Files** | `apps/web/src/components/gen-ui/StoreCreationPreviewCard.tsx`, `apps/web/src/pages/storefront/StoreLayout.tsx`, `apps/web/src/i18n/index.ts` |
| **Libraries** | `react@18`, `vite`, `react-router-dom@6`, `tailwindcss`, `shadcn/ui`, `react-i18next`, `@tanstack/react-query` |
| **State** | TanStack Query for server state; React Context for auth/tenant |
| **Testing** | Jest + RTL unit tests for preview card; Cypress E2E for full onboarding flow |

### 3.5 Deliverable & Acceptance Criteria

> **Deliverable:** Interactive split‑screen onboarding UI where typing store preferences in Arabic or English updates the live React storefront preview in **< 200 ms**.

| # | Acceptance Criterion | Verification |
|---|---------------------|--------------|
| AC‑1 | Preview card renders with all slots (name, theme, currency, payments, shipping) | Visual regression test |
| AC‑2 | RTL layout switches correctly for Arabic language | Cypress screenshot comparison |
| AC‑3 | Dark/Light theme CSS variables apply within < 100 ms | Performance profiler |
| AC‑4 | "Launch Store Now" button triggers `onConfirm` callback and disables (no double‑click) | Unit test |
| AC‑5 | Partial slot state shows shimmer placeholders for unfilled fields | Storybook visual test |

---

## 4. Task 2 — Backend & API Layer (NestJS)

### 4.1 Title

**Tenant Provisioning Service, JWT Session Context & Role‑Based Access Control (RBAC)**

### 4.2 Summary

Build the core NestJS Tenant & Auth module that provisions new stores and enforces strict tenant isolation across every API and Agent request.

### 4.3 Implementation Steps

#### Step 1: Tenant Provisioning API

| Item | Detail |
|------|--------|
| **Endpoints** | `POST /api/v1/tenants/provision` — creates tenant + schema + seed data |
| | `GET /api/v1/tenants/:slug` — returns tenant config |
| | `PATCH /api/v1/tenants/settings` — updates theme, currency, etc. |
| **Files** | `apps/api/src/tenants/tenants.controller.ts`, `apps/api/src/tenants/tenants.service.ts` |
| **Caching** | Redis key `tenant:config:{id}` with TTL 15 min for zero‑latency storefront loading |

```typescript
// apps/api/src/tenants/tenants.service.ts
@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async provision(dto: CreateTenantDto): Promise<Tenant> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Insert tenant record
      const tenant = await tx.tenant.create({
        data: {
          slug: dto.slug,
          name: dto.name,
          currency: dto.currency,
          theme: dto.theme,
          paymentMethods: dto.paymentMethods,
          shippingPolicy: dto.shippingPolicy,
        },
      });

      // 2. Create owner user
      await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.ownerEmail,
          role: 'merchant',
        },
      });

      // 3. Execute RLS setup for new tenant
      await tx.$executeRawUnsafe(
        `SELECT setup_tenant_rls($1)`, tenant.id
      );

      // 4. Warm cache
      await this.redis.set(
        `tenant:config:${tenant.id}`,
        JSON.stringify(tenant),
        'EX', 900
      );

      return tenant;
    });
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const cached = await this.redis.get(`tenant:slug:${slug}`);
    if (cached) return JSON.parse(cached);

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { slug },
    });

    await this.redis.set(`tenant:slug:${slug}`, JSON.stringify(tenant), 'EX', 900);
    return tenant;
  }
}
```

#### Step 2: Tenant Context Guard & RBAC

| Item | Detail |
|------|--------|
| **What** | `TenantContextGuard` extracts `tenant_id` and `user_id` from Clerk/JWT; `RolesGuard` enforces role |
| **File** | `apps/api/src/common/guards/tenant-context.guard.ts`, `apps/api/src/common/guards/roles.guard.ts` |
| **Critical Rule** | `tenant_id` is **never** accepted from client request body or LLM prompt — always injected server‑side from verified JWT |

```typescript
// apps/api/src/common/guards/tenant-context.guard.ts
@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const payload = request.user; // decoded JWT from Passport

    if (!payload?.tenant_id || !payload?.user_id) {
      throw new ForbiddenException('Missing tenant context in JWT');
    }

    // Attach to request for downstream use
    request.tenantContext = {
      tenantId: payload.tenant_id,
      userId: payload.user_id,
      role: payload.role,
    };

    return true;
  }
}

// apps/api/src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const { role } = context.switchToHttp().getRequest().tenantContext;
    return requiredRoles.includes(role);
  }
}
```

#### Step 3: Prisma RLS Transaction Middleware

| Item | Detail |
|------|--------|
| **What** | Prisma Client Extension that automatically sets `app.current_tenant_id` at the start of every query |
| **File** | `packages/database/src/prisma-rls.extension.ts` |

```typescript
// packages/database/src/prisma-rls.extension.ts
import { Prisma } from '@prisma/client';

export const rlsExtension = Prisma.defineExtension((client) =>
  client.$extends({
    query: {
      $allOperations({ args, query, operation, model }) {
        return client.$transaction(async (tx) => {
          const tenantId = AsyncLocalStorage.getStore()?.tenantId;
          if (tenantId) {
            await tx.$executeRawUnsafe(
              `SET LOCAL app.current_tenant_id = '${tenantId}'`
            );
          }
          return query(args);
        });
      },
    },
  })
);
```

### 4.4 Technical Specifications

| Category | Details |
|----------|---------|
| **Endpoints** | `POST /api/v1/tenants/provision`, `GET /api/v1/tenants/:slug`, `PATCH /api/v1/tenants/settings` |
| **Key Files** | `apps/api/src/tenants/tenants.service.ts`, `apps/api/src/tenants/tenants.controller.ts`, `apps/api/src/common/guards/tenant-context.guard.ts`, `apps/api/src/common/guards/roles.guard.ts`, `packages/database/src/prisma-rls.extension.ts` |
| **DTOs** | `CreateTenantDto { slug, name, currency, theme, paymentMethods[], shippingPolicy, ownerEmail }` |
| **Caching** | Redis — `tenant:config:{id}` (TTL 15 min), `tenant:slug:{slug}` (TTL 15 min) |
| **Auth** | Clerk JWT → Passport strategy → `TenantContextGuard` → `RolesGuard` |

### 4.5 Deliverable & Acceptance Criteria

> **Deliverable:** Secured NestJS API layer with automated unit tests verifying that cross‑tenant requests return `403 Forbidden`.

| # | Acceptance Criterion | Verification |
|---|---------------------|--------------|
| AC‑1 | `POST /api/v1/tenants/provision` creates tenant, user, and RLS in a single transaction | Integration test with rollback check |
| AC‑2 | Tenant config is cached in Redis and returned in < 5 ms on cache hit | k6 load test |
| AC‑3 | Request with Tenant A's JWT cannot access Tenant B's data → `403` | Supertest cross‑tenant test |
| AC‑4 | `tenant_id` injection from JWT cannot be overridden by request body | Pen‑test scenario |
| AC‑5 | Role guard blocks `customer` role from accessing `PATCH /settings` | Unit test |

---

## 5. Task 3 — Database & Security Layer (PostgreSQL + RLS)

### 5.1 Title

**Multi‑Tenant Core Schema (`tenants`, `users`) & PostgreSQL RLS Isolation Policies**

### 5.2 Summary

Design the foundational multi‑tenant tables and implement database‑level Row‑Level Security (RLS) so tenant data leaks are **mathematically impossible**.

### 5.3 Implementation Steps

#### Step 1: Prisma Schema & Migrations

| Item | Detail |
|------|--------|
| **File** | `packages/database/prisma/schema.prisma` |

```prisma
// packages/database/prisma/schema.prisma

model Tenant {
  id              String   @id @default(uuid()) @db.Uuid
  slug            String   @unique @db.VarChar(63)
  name            String   @db.VarChar(255)
  currency        String   @default("EGP") @db.VarChar(3)
  theme           Json     @default("{\"mode\":\"light\",\"primaryColor\":\"#4F46E5\",\"backgroundColor\":\"#F8FAFC\"}")
  paymentMethods  String[] @default([]) @map("payment_methods")
  shippingPolicy  String?  @map("shipping_policy") @db.Text
  logoUrl         String?  @map("logo_url") @db.VarChar(512)
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  users           User[]
  products        Product[]
  orders          Order[]
  policies        Policy[]

  @@map("tenants")
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  email        String   @db.VarChar(255)
  passwordHash String?  @map("password_hash") @db.VarChar(255)
  role         String   @default("customer") @db.VarChar(20) // merchant | customer | admin
  displayName  String?  @map("display_name") @db.VarChar(100)
  clerkUserId  String?  @unique @map("clerk_user_id") @db.VarChar(255)
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  orders       Order[]

  @@unique([tenantId, email])
  @@index([tenantId])
  @@map("users")
}
```

#### Step 2: Row‑Level Security Policies

| Item | Detail |
|------|--------|
| **File** | `packages/database/sql/enable_rls.sql` |

```sql
-- packages/database/sql/enable_rls.sql

-- ============================================
-- Enable RLS on all tenant‑scoped tables
-- ============================================

-- 1. TENANTS table (admin‑only, no RLS needed — or restrict to own row)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_self_access ON tenants
  USING (id = current_setting('app.current_tenant_id')::uuid);

-- 2. USERS table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 3. PRODUCTS table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_tenant_isolation ON products
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 4. ORDERS table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY order_tenant_isolation ON orders
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 5. CUSTOMERS table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customer_tenant_isolation ON customers
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 6. PROMOTIONS table
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY promotion_tenant_isolation ON promotions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 7. INVENTORY table (joined via product → tenant_id)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_tenant_isolation ON inventory
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = inventory.product_id
        AND products.tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );

-- 8. AGENT_ACTIONS table
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_actions_tenant_isolation ON agent_actions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 9. POLICIES table
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY policies_tenant_isolation ON policies
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 10. PAYMENTS table (joined via order → tenant_id)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_tenant_isolation ON payments
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
        AND orders.tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );

-- ============================================
-- Helper function for provisioning
-- ============================================
CREATE OR REPLACE FUNCTION setup_tenant_rls(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  -- Force RLS applies even to table owner
  EXECUTE format(
    'ALTER TABLE tenants FORCE ROW LEVEL SECURITY'
  );
  RAISE NOTICE 'RLS configured for tenant %', p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Step 3: Prisma Client Extension (Auto RLS)

| Item | Detail |
|------|--------|
| **What** | Wraps every query in `SET LOCAL app.current_tenant_id` automatically |
| **File** | `packages/database/src/prisma-rls.extension.ts` (see Backend section above) |
| **Testing** | Dedicated test script that attempts raw SQL cross‑tenant access and asserts zero rows returned |

```sql
-- Test: Cross‑tenant isolation proof
-- Run as application user, NOT superuser

SET app.current_tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT * FROM users; -- Should return ONLY tenant A's users

SET app.current_tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT * FROM users; -- Should return ONLY tenant B's users

-- Attempt to read tenant A's data while set to tenant B → 0 rows
SELECT * FROM users WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
-- Returns 0 rows ✅
```

### 5.4 Technical Specifications

| Category | Details |
|----------|---------|
| **Tables Owned** | `tenants`, `users` |
| **RLS Scope** | All 10 tenant‑scoped tables (Section 6 of system design) |
| **Key Files** | `packages/database/prisma/schema.prisma`, `packages/database/sql/enable_rls.sql`, `packages/database/src/prisma-rls.extension.ts` |
| **Indexes** | `users(tenant_id)`, `tenants(slug)` unique, `users(tenant_id, email)` unique composite |
| **Constraints** | `role IN ('merchant', 'customer', 'admin')` via app‑level validation |

### 5.5 Deliverable & Acceptance Criteria

> **Deliverable:** PostgreSQL database with active RLS policies and a test script proving User A cannot query User B's rows even with raw SQL.

| # | Acceptance Criterion | Verification |
|---|---------------------|--------------|
| AC‑1 | `tenants` and `users` tables created with correct types and constraints | `prisma migrate deploy` succeeds |
| AC‑2 | RLS policies enabled on all 10 tables | `SELECT tablename, rowsecurity FROM pg_tables` returns `true` |
| AC‑3 | Cross‑tenant raw SQL returns 0 rows | Automated SQL test script |
| AC‑4 | Prisma extension auto‑sets tenant context per query | Integration test |
| AC‑5 | Superuser bypass disabled (`FORCE ROW LEVEL SECURITY`) | Security audit |

---

## 6. Task 4 — AI Agent & LLM Layer (LangGraph)

### 6.1 Title

**Conversational Slot‑Filling State Graph & `create_store_tenant` Tool Execution**

### 6.2 Summary

Build the LangGraph onboarding sub‑graph that extracts store entities from natural language, asks follow‑up questions for missing slots, and provisions the store — with Human‑in‑the‑Loop confirmation.

### 6.3 Implementation Steps

#### Step 1: Onboarding State & Structured Output

| Item | Detail |
|------|--------|
| **What** | Define `OnboardingState` Pydantic model for structured LLM output extraction |
| **File** | `apps/agent/graphs/onboarding_graph.py` |

```python
# apps/agent/graphs/onboarding_graph.py
from pydantic import BaseModel, Field
from typing import Optional, Literal
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.types import interrupt, Command


class OnboardingSlots(BaseModel):
    """Structured output for store onboarding slot extraction."""
    store_name: Optional[str] = Field(None, description="Name of the store, e.g. 'TechZone'")
    product_category: Optional[str] = Field(None, description="Main product category, e.g. 'Mobile Accessories'")
    theme_mode: Optional[Literal["dark", "light"]] = Field(None, description="Theme mode preference")
    currency: Optional[Literal["EGP", "USD", "SAR"]] = Field(None, description="Store currency")
    payment_methods: Optional[list[str]] = Field(None, description="e.g. ['paymob', 'cod', 'instapay']")
    shipping_policy: Optional[str] = Field(None, description="Shipping policy description")


class OnboardingState(MessagesState):
    """Full state for the onboarding sub-graph."""
    slots: OnboardingSlots = OnboardingSlots()
    missing_slots: list[str] = []
    language: str = "en"  # detected language: "en" or "ar"
    confirmed: bool = False
    tenant_id: Optional[str] = None
```

#### Step 2: Slot‑Filling Router

| Item | Detail |
|------|--------|
| **What** | If required fields are missing, the Agent asks targeted follow‑up questions in the merchant's language |
| **Logic** | `router_node` checks `OnboardingSlots` for `None` fields → routes to `ask_followup` or `preview` |

```python
# apps/agent/graphs/onboarding_graph.py (continued)

REQUIRED_SLOTS = ["store_name", "currency", "payment_methods"]
OPTIONAL_SLOTS = ["product_category", "theme_mode", "shipping_policy"]

def extract_slots_node(state: OnboardingState) -> dict:
    """Use LLM structured output to extract slots from conversation."""
    llm = get_llm().with_structured_output(OnboardingSlots)
    extracted = llm.invoke(state["messages"])

    # Merge with existing slots (don't overwrite filled ones)
    current = state["slots"]
    merged = OnboardingSlots(**{
        field: getattr(extracted, field) or getattr(current, field)
        for field in OnboardingSlots.model_fields
    })

    # Detect language from first user message
    language = detect_language(state["messages"][0].content)

    # Find missing required slots
    missing = [s for s in REQUIRED_SLOTS if getattr(merged, s) is None]

    return {"slots": merged, "missing_slots": missing, "language": language}


def router(state: OnboardingState) -> str:
    """Route based on slot completeness."""
    if state["missing_slots"]:
        return "ask_followup"
    return "preview_and_confirm"


def ask_followup_node(state: OnboardingState) -> dict:
    """Generate targeted follow-up question for missing slots."""
    missing = state["missing_slots"]
    lang = state["language"]

    prompts = {
        "en": {
            "store_name": "What would you like to name your store?",
            "currency": "Which currency? (EGP, USD, or SAR)",
            "payment_methods": "Which payment methods? (Paymob, Cash on Delivery, InstaPay)",
        },
        "ar": {
            "store_name": "ما اسم المتجر الذي تريده؟",
            "currency": "ما العملة؟ (جنيه مصري، دولار، أو ريال سعودي)",
            "payment_methods": "ما وسائل الدفع؟ (باي موب، دفع عند الاستلام، إنستاباي)",
        },
    }

    question = prompts.get(lang, prompts["en"]).get(missing[0], f"Please provide: {missing[0]}")
    return {"messages": [AIMessage(content=question)]}
```

#### Step 3: Human‑in‑the‑Loop Confirmation & Tool Registration

| Item | Detail |
|------|--------|
| **What** | `create_store_tenant` tool with HITL interrupt — store only created after merchant clicks Confirm on preview card |
| **File** | `apps/agent/tools/store_builder_tools.py` |

```python
# apps/agent/tools/store_builder_tools.py
from langchain_core.tools import tool


@tool
def create_store_tenant(
    name: str,
    currency: str,
    theme: dict,
    payment_methods: list[str],
    shipping_policy: str,
) -> dict:
    """
    Create a new store tenant in the database.
    This is a WRITE operation that requires human confirmation.

    Args:
        name: Store name (e.g., 'TechZone')
        currency: Currency code (EGP, USD, SAR)
        theme: Theme config dict {"mode": "dark"|"light", "primaryColor": "#hex"}
        payment_methods: List of payment gateway names
        shipping_policy: Shipping policy text
    """
    import httpx

    response = httpx.post(
        f"{BACKEND_URL}/api/v1/tenants/provision",
        json={
            "slug": slugify(name),
            "name": name,
            "currency": currency,
            "theme": theme,
            "paymentMethods": payment_methods,
            "shippingPolicy": shipping_policy,
            "ownerEmail": get_current_user_email(),
        },
        headers={"Authorization": f"Bearer {get_service_token()}"},
    )
    response.raise_for_status()
    return response.json()
```

```python
# apps/agent/graphs/onboarding_graph.py (continued)

def preview_and_confirm_node(state: OnboardingState) -> dict:
    """Stream preview card to UI and wait for human confirmation."""
    slots = state["slots"]

    # This sends the preview data to the GenUI renderer
    preview_payload = {
        "type": "store_creation_preview",
        "data": slots.model_dump(),
    }

    # HITL interrupt — graph pauses here until merchant confirms
    confirmation = interrupt(preview_payload)

    if confirmation.get("approved"):
        # Execute the tool
        result = create_store_tenant.invoke({
            "name": slots.store_name,
            "currency": slots.currency,
            "theme": {"mode": slots.theme_mode or "light", "primaryColor": "#4F46E5"},
            "payment_methods": slots.payment_methods,
            "shipping_policy": slots.shipping_policy or "Standard shipping in 3-5 business days",
        })
        return {
            "messages": [AIMessage(content=f"✅ Store '{slots.store_name}' created successfully!")],
            "tenant_id": result["id"],
            "confirmed": True,
        }
    else:
        return {
            "messages": [AIMessage(content="❌ Store creation cancelled. Let me know if you'd like to try again.")],
            "confirmed": False,
        }


# Build the graph
def build_onboarding_graph():
    graph = StateGraph(OnboardingState)

    graph.add_node("extract_slots", extract_slots_node)
    graph.add_node("ask_followup", ask_followup_node)
    graph.add_node("preview_and_confirm", preview_and_confirm_node)

    graph.add_edge(START, "extract_slots")
    graph.add_conditional_edges("extract_slots", router, {
        "ask_followup": "ask_followup",
        "preview_and_confirm": "preview_and_confirm",
    })
    graph.add_edge("ask_followup", "extract_slots")  # loop back
    graph.add_edge("preview_and_confirm", END)

    checkpointer = PostgresSaver.from_conn_string(DATABASE_URL)
    return graph.compile(checkpointer=checkpointer)
```

### 6.4 Graph Visualization

```mermaid
stateDiagram-v2
    [*] --> ExtractSlots
    ExtractSlots --> AskFollowup : Missing required slots
    ExtractSlots --> PreviewConfirm : All slots filled
    AskFollowup --> ExtractSlots : User replies
    PreviewConfirm --> StoreCreated : Merchant confirms ✅
    PreviewConfirm --> Cancelled : Merchant cancels ❌
    StoreCreated --> [*]
    Cancelled --> [*]
```

### 6.5 Technical Specifications

| Category | Details |
|----------|---------|
| **Tool Name** | `create_store_tenant` (Write Operation — Requires Confirmation: **Yes**) |
| **Key Files** | `apps/agent/graphs/onboarding_graph.py`, `apps/agent/tools/store_builder_tools.py` |
| **LLM** | Claude 3.5 Sonnet (default) with structured output; fallback GPT‑4o |
| **Checkpointer** | `PostgresSaver` for durable state across interrupts |
| **HITL** | `interrupt()` pauses graph; `Command(resume={"approved": True})` resumes |

### 6.6 Deliverable & Acceptance Criteria

> **Deliverable:** End‑to‑end conversational flow turning a 2‑turn Arabic/English chat into a live, database‑backed store tenant.

| # | Acceptance Criterion | Verification |
|---|---------------------|--------------|
| AC‑1 | LLM extracts all slots from single well‑formed message | pytest with fixture messages |
| AC‑2 | Missing slots trigger follow‑up in merchant's language (AR/EN) | Conversation replay test |
| AC‑3 | Preview card streams to UI before tool execution | Integration test with mock UI |
| AC‑4 | Store only created in DB after explicit human confirmation | DB assertion: 0 rows before confirm |
| AC‑5 | Cancellation gracefully terminates graph, no orphan data | State inspection after cancel |
| AC‑6 | Graph survives process restart (PostgresSaver checkpoint) | Kill & resume test |

---

## 7. Task 5 — Machine Learning & Data Science Layer (Python)

### 7.1 Title

**Intelligent Excel/CSV Catalog Onboarding Cleaner & Zero‑Shot Category Classifier**

### 7.2 Summary

Build the Python data pipeline that processes the initial Excel product file uploaded during store creation, cleans dirty data, and assigns product categories automatically.

### 7.3 Implementation Steps

#### Step 1: File Ingestion Endpoint

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /ml/v1/catalog/ingest-file` |
| **File** | `apps/ml/src/catalog/ingest.py` |
| **Input** | Multipart file upload (`.xlsx`, `.csv`) |
| **Column Mapping** | Auto‑detect Arabic/English headers → standard schema |

```python
# apps/ml/src/catalog/ingest.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import pandas as pd
import io

router = APIRouter(prefix="/ml/v1/catalog", tags=["Catalog ML"])

# Column mapping: merchant headers → standard schema
COLUMN_MAP = {
    # Arabic
    "الاسم": "name", "اسم المنتج": "name",
    "السعر": "price", "سعر البيع": "price",
    "التكلفة": "cost", "سعر الشراء": "cost",
    "الكمية": "quantity", "المخزون": "quantity",
    "الوصف": "description",
    "الفئة": "category", "التصنيف": "category",
    "الكود": "sku", "رقم المنتج": "sku",
    # English
    "title": "name", "product name": "name", "product_name": "name",
    "unit price": "price", "selling price": "price",
    "unit cost": "cost", "purchase price": "cost",
    "stock": "quantity", "qty": "quantity",
    "desc": "description",
    "cat": "category", "product category": "category",
    "barcode": "sku", "item code": "sku",
}


class IngestResult(BaseModel):
    total_rows: int
    valid_rows: int
    cleaned_rows: int
    duplicates_removed: int
    outliers_flagged: int
    categories_assigned: int
    warnings: list[str]
    products: list[dict]


@router.post("/ingest-file", response_model=IngestResult)
async def ingest_catalog_file(
    file: UploadFile = File(...),
    tenant_id: str = Depends(get_tenant_id),
):
    # 1. Parse file
    content = await file.read()
    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(content))
    elif file.filename.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
    else:
        raise HTTPException(400, "Unsupported file format. Use .csv or .xlsx")

    # 2. Normalize columns
    df.columns = [COLUMN_MAP.get(col.strip().lower(), col.strip().lower()) for col in df.columns]

    # 3. Clean
    result = clean_catalog(df)

    # 4. Classify uncategorized
    result = classify_categories(result)

    return result
```

#### Step 2: Data Cleaning Pipeline

| Item | Detail |
|------|--------|
| **File** | `apps/ml/src/catalog/cleaner.py` |
| **Operations** | Impute missing costs, strip currency symbols, detect duplicate SKUs, flag price outliers (IQR) |

```python
# apps/ml/src/catalog/cleaner.py
import pandas as pd
import numpy as np
from typing import Tuple


def clean_catalog(df: pd.DataFrame) -> Tuple[pd.DataFrame, dict]:
    warnings = []
    original_count = len(df)

    # ── 1. Strip currency symbols & convert to float ──
    for col in ["price", "cost"]:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace(r"[^\d.\-]", "", regex=True)
                .replace("", np.nan)
                .astype(float)
            )

    # ── 2. Impute missing cost using category median margins ──
    if "cost" in df.columns and "category" in df.columns:
        missing_cost = df["cost"].isna()
        if missing_cost.any():
            median_margins = df.groupby("category").apply(
                lambda g: (g["price"] - g["cost"]).median() / g["price"].median()
                if g["cost"].notna().any() else 0.30
            )
            for idx in df[missing_cost].index:
                cat = df.loc[idx, "category"]
                margin = median_margins.get(cat, 0.30)
                df.loc[idx, "cost"] = df.loc[idx, "price"] * (1 - margin)
            warnings.append(f"Imputed {missing_cost.sum()} missing cost values using category median margins")

    # ── 3. Detect & remove duplicate SKUs ──
    duplicates = 0
    if "sku" in df.columns:
        dup_mask = df.duplicated(subset=["sku"], keep="first")
        duplicates = dup_mask.sum()
        if duplicates > 0:
            df = df[~dup_mask]
            warnings.append(f"Removed {duplicates} duplicate SKU entries")

    # ── 4. Flag statistical price outliers (IQR method) ──
    outliers = 0
    if "price" in df.columns:
        Q1 = df["price"].quantile(0.25)
        Q3 = df["price"].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        outlier_mask = (df["price"] < lower) | (df["price"] > upper)
        outliers = outlier_mask.sum()
        df.loc[outlier_mask, "_outlier_flag"] = True
        if outliers > 0:
            warnings.append(f"Flagged {outliers} price outliers (IQR method)")

    # ── 5. Generate SKU if missing ──
    if "sku" not in df.columns or df["sku"].isna().any():
        df["sku"] = df["sku"].fillna(
            df.apply(lambda r: f"SKU-{hash(str(r.get('name', '')))[:8].upper()}", axis=1)
        )

    return df, {
        "total_rows": original_count,
        "valid_rows": len(df),
        "duplicates_removed": duplicates,
        "outliers_flagged": outliers,
        "warnings": warnings,
    }
```

#### Step 3: Zero‑Shot Category Classifier

| Item | Detail |
|------|--------|
| **File** | `apps/ml/src/catalog/classifier.py` |
| **Model** | TF‑IDF + Logistic Regression trained on Olist/AdventureWorks product titles; fallback to Multilingual MiniLM for zero‑shot |
| **Target** | > 88 % accuracy on held‑out test set |

```python
# apps/ml/src/catalog/classifier.py
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from pathlib import Path

MODEL_PATH = Path("apps/ml/models/sku_classifier.joblib")

# ── Training (run once offline) ──
def train_classifier(training_df):
    """Train on Olist + AdventureWorks product titles → category labels."""
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            sublinear_tf=True,
            strip_accents="unicode",
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            C=1.0,
            class_weight="balanced",
            solver="lbfgs",
            multi_class="multinomial",
        )),
    ])

    pipeline.fit(training_df["name"], training_df["category"])
    joblib.dump(pipeline, MODEL_PATH)
    return pipeline


# ── Inference ──
def classify_categories(df, confidence_threshold=0.6):
    """Classify uncategorized products using trained model."""
    if "category" in df.columns and df["category"].notna().all():
        return df  # All already categorized

    pipeline = joblib.load(MODEL_PATH)

    uncategorized = df["category"].isna() | (df["category"] == "")
    if not uncategorized.any():
        return df

    names = df.loc[uncategorized, "name"].fillna("")
    predictions = pipeline.predict(names)
    probabilities = pipeline.predict_proba(names).max(axis=1)

    # Only assign if confidence > threshold
    for idx, (pred, prob) in zip(df[uncategorized].index, zip(predictions, probabilities)):
        if prob >= confidence_threshold:
            df.loc[idx, "category"] = pred
            df.loc[idx, "_category_confidence"] = round(prob, 3)
        else:
            df.loc[idx, "category"] = "Uncategorized"
            df.loc[idx, "_category_confidence"] = round(prob, 3)

    return df
```

### 7.4 Pipeline Architecture

```mermaid
flowchart LR
    Upload["📄 Excel / CSV Upload"] --> Parse["🔍 Parse & Detect Columns"]
    Parse --> Map["🗂️ Auto‑Map Headers"]
    Map --> Clean["🧹 Clean Data"]
    Clean --> Impute["📊 Impute Missing Costs"]
    Clean --> DeDup["🔄 Remove Duplicate SKUs"]
    Clean --> Outlier["⚠️ Flag Price Outliers (IQR)"]
    Impute --> Classify["🤖 SKU Classifier"]
    DeDup --> Classify
    Outlier --> Classify
    Classify --> Result["✅ Clean Product Catalog"]
    Result --> DB["🗄️ Insert into PostgreSQL"]
```

### 7.5 Technical Specifications

| Category | Details |
|----------|---------|
| **Endpoint** | `POST /ml/v1/catalog/ingest-file` |
| **Key Files** | `apps/ml/src/catalog/ingest.py`, `apps/ml/src/catalog/cleaner.py`, `apps/ml/src/catalog/classifier.py` |
| **Libraries** | `pandas`, `scikit-learn`, `openpyxl`, `fastapi`, `joblib` |
| **Model** | TF‑IDF (10 k features, bigrams) + Logistic Regression (multinomial); trained on Olist + AdventureWorks |
| **Fallback** | Multilingual MiniLM (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`) for unknown distributions |
| **Model File** | `apps/ml/models/sku_classifier.joblib` |

### 7.6 Deliverable & Acceptance Criteria

> **Deliverable:** Automated catalog ingestion pipeline that cleans messy Excel sheets and categorizes Arabic/English product names with **> 88 % accuracy**.

| # | Acceptance Criterion | Verification |
|---|---------------------|--------------|
| AC‑1 | Parses `.xlsx` and `.csv` with Arabic and English headers | pytest with sample files |
| AC‑2 | Missing cost values imputed within ± 15 % of actual | Statistical validation |
| AC‑3 | Duplicate SKUs detected and removed; count reported | Unit test with duplicates |
| AC‑4 | Price outliers flagged correctly (IQR) | Compare against manual review |
| AC‑5 | Category classifier achieves > 88 % accuracy on test set | Cross‑validation report |
| AC‑6 | Full pipeline runs in < 5 s for 10,000‑row file | Performance benchmark |

---

## 8. Cross‑Cutting Concerns

### 8.1 Integration Points with Other Team Members

| Team Member | Integration | Direction |
|-------------|-------------|-----------|
| **Adel** | Moustafa's `tenants` schema is FK‑referenced by Adel's `products`, `categories`, `inventory` | Moustafa → Adel |
| **Abdallah** | RLS policies written by Moustafa protect Abdallah's analytics queries | Moustafa → Abdallah |
| **Retaj** | ML forecast models depend on tenant‑scoped time‑series data isolated by Moustafa's RLS | Moustafa → Retaj |
| **Renad** | Moustafa's `users` table is FK‑referenced by Renad's `customers`, `orders`, `promotions` | Moustafa → Renad |
| **Roaa** | Moustafa's JWT guards feed `tenant_id` into Roaa's `agent_actions` audit log and prompt firewall | Moustafa → Roaa |

### 8.2 Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| Provisioning transaction fails | Full rollback; no partial tenant state; error message in chat |
| RLS policy creation fails | Transaction block ensures tables + RLS are atomic |
| LLM fails to extract slots | Fallback to explicit form‑based onboarding |
| Excel file corrupt / unreadable | Return `400` with clear error and supported formats |
| Classifier model file missing | Fallback to "Uncategorized" label with warning |

### 8.3 Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/techzone` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `CLERK_SECRET_KEY` | Clerk JWT verification | `sk_live_...` |
| `LLM_PROVIDER` | LLM selection | `claude` or `openai` |
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI fallback | `sk-...` |
| `ML_MODEL_PATH` | Path to SKU classifier | `apps/ml/models/sku_classifier.joblib` |
| `BACKEND_URL` | Internal backend URL | `http://localhost:3000` |

---

## 9. 12‑Week Phased Roadmap

```mermaid
flowchart LR
    subgraph P1["Phase 1 · Weeks 1–2"]
        P1A["DB Schema + Migrations"]
        P1B["RLS Policies (10 tables)"]
        P1C["NestJS CRUD APIs"]
        P1D["Docker Compose Setup"]
    end
    subgraph P2["Phase 2 · Weeks 3–4"]
        P2A["LangGraph Slot‑Filling Graph"]
        P2B["Onboarding State Machine"]
        P2C["JWT Guards + TenantContext"]
    end
    subgraph P3["Phase 3 · Weeks 5–6"]
        P3A["Excel Cleaner Pipeline"]
        P3B["SKU Classifier Training"]
        P3C["FastAPI /catalog/ingest"]
    end
    subgraph P4["Phase 4 · Weeks 7–8"]
        P4A["create_store_tenant Tool"]
        P4B["HITL Interrupt Flow"]
        P4C["PostgresSaver Checkpoint"]
    end
    subgraph P5["Phase 5 · Weeks 9–10"]
        P5A["StoreCreationPreviewCard"]
        P5B["StoreLayout + RTL"]
        P5C["i18next AR/EN"]
    end
    subgraph P6["Phase 6 · Weeks 11–12"]
        P6A["E2E Tests (Cypress)"]
        P6B["Load Test (k6)"]
        P6C["Security Audit"]
        P6D["Demo Preparation"]
    end

    P1 --> P2 --> P3 --> P4 --> P5 --> P6
```

| Phase | Weeks | Focus | Key Deliverables |
|-------|-------|-------|-----------------|
| **1** | 1–2 | Foundation | Prisma schema, RLS on all 10 tables, Docker Compose (Postgres 16 + pgvector, Redis, Meilisearch, MLflow), NestJS tenant CRUD |
| **2** | 3–4 | Core Agent | LangGraph onboarding graph, slot‑filling router, JWT `TenantContextGuard`, `RolesGuard` |
| **3** | 5–6 | Machine Learning | Excel/CSV cleaner, TF‑IDF + Logistic Regression classifier training, FastAPI `/catalog/ingest-file` endpoint |
| **4** | 7–8 | Write Tools & HITL | `create_store_tenant` tool with `interrupt_before`, `PostgresSaver` checkpointer, immutable audit trail |
| **5** | 9–10 | Generative UI | `StoreCreationPreviewCard`, `StoreLayout`, `react-i18next` AR/EN, dark/light theme, split‑screen streaming |
| **6** | 11–12 | Evaluation & Defense | Cypress E2E, k6 load tests, OWASP ZAP security scan, 100‑prompt benchmark, demo rehearsal, thesis finalization |

---

## 10. Risk Register & Mitigations

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|-----------|------------|
| R1 | RLS policy misconfiguration leaks tenant data | 🔴 Critical | Low | Automated cross‑tenant SQL test suite; `FORCE ROW LEVEL SECURITY` on all tables |
| R2 | LLM hallucination creates invalid tenant config | 🟠 High | Medium | Pydantic strict validation on `OnboardingSlots`; enum constraints on `currency`, `theme_mode` |
| R3 | Excel file too large causes OOM | 🟡 Medium | Medium | Chunked pandas reading (`chunksize=5000`); file size limit (50 MB) |
| R4 | Category classifier accuracy < 88 % | 🟡 Medium | Low | Expand training data; fallback to "Uncategorized" label; merchant review step |
| R5 | Graph state lost on crash | 🟠 High | Low | `PostgresSaver` checkpointer provides durable state; restart resumes from last checkpoint |
| R6 | Redis cache stale after tenant settings update | 🟡 Medium | Medium | Cache invalidation on `PATCH /settings`; short TTL (15 min) |
| R7 | Clerk JWT secret rotation breaks auth | 🟠 High | Low | JWKS endpoint auto‑rotation; fallback to cached public key with 24 h TTL |

---

## 11. Definition of Done (DoD)

A task is considered **DONE** when all of the following are met:

- [ ] Code is written, reviewed, and merged to `main`
- [ ] All acceptance criteria pass
- [ ] Unit test coverage ≥ 90 %
- [ ] Integration tests pass in CI
- [ ] No critical or high security findings
- [ ] API endpoints documented in OpenAPI spec
- [ ] Runbook updated for operational procedures
- [ ] Code comments and docstrings present
- [ ] Performance benchmarks meet SLA targets

---

## 12. References

| Resource | Location |
|----------|----------|
| TechZone Task Matrix | `Docs/techzone_light_detailed_full_stack_task_matrix.html` |
| System Design Document | `Docs/system_design.md` |
| LangGraph Documentation | https://langchain-ai.github.io/langgraph/ |
| Prisma Documentation | https://www.prisma.io/docs |
| PostgreSQL RLS Docs | https://www.postgresql.org/docs/current/ddl-rowsecurity.html |
| scikit‑learn Pipeline | https://scikit-learn.org/stable/modules/generated/sklearn.pipeline.Pipeline.html |
| react‑i18next | https://react.i18next.com/ |
| Clerk Auth | https://clerk.com/docs |

---

*End of Moustafa's Full Implementation Plan*
