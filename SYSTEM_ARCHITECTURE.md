# BudgetOS — System Architecture Document

**Status:** v1.0
**Date:** 2026-06-30
**Author:** Staff Architecture Team
**Depends On:** PRD.md (Product Requirements Document)

---

## Table of Contents

1. High-Level Architecture Diagram
2. System Boundaries
3. Core Modules and Responsibilities
4. Financial Engine Design (Critical)
5. Data Flow Architecture
6. Database Interaction Model
7. State Management Strategy
8. Caching Strategy
9. API Gateway Structure
10. Security Architecture
11. Free-Tier Deployment Mapping
12. Performance Strategy
13. Folder / Repository Structure
14. Shared Types Strategy
15. Testing Strategy
16. Failure Modes and Recovery
17. Scalability Design
18. Separation Rules (Cardinal)

---

## 1. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Browser / PWA (React SPA)                         │   │
│  │                                                                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Dashboard│ │Transact.│ │ Budgets  │ │Mortgage  │ │ Reports  │  │   │
│  │  │ Pages    │ │ Pages   │ │ Pages    │ │ Pages    │ │ Pages    │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │           Client-Side Services                               │   │   │
│  │  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │   │   │
│  │  │  │ React   │ │ Zustand  │ │ React    │ │ Service Worker │  │   │   │
│  │  │  │ Router  │ │ (UI State│ │ Query    │ │ (Offline Cache) │  │   │   │
│  │  │  │         │ │ only)    │ │ (Server  │ │                 │  │   │   │
│  │  │  │         │ │          │ │  State)  │ │                 │  │   │   │
│  │  │  └─────────┘ └──────────┘ └──────────┘ └────────────────┘  │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │ HTTPS (TLS 1.3) — Cloudflare CDN
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EDGE / API GATEWAY LAYER                           │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              Cloudflare Pages (Static Hosting + CDN)                 │   │
│  │  - Serves built React SPA (JS/CSS/HTML)                             │   │
│  │  - Handles routing (SPA fallback)                                   │   │
│  │  - Edge-side redirects + headers (CSP, CORS)                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              Supabase Edge Functions (API Layer)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Auth     │ │Transact. │ │ Budget   │ │Mortgage  │ │ Coach    │  │   │
│  │  │ Middle-  │ │ Handlers │ │ Handlers │ │ Handlers │ │ Handlers │  │   │
│  │  │ ware     │ │          │ │          │ │          │ │          │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  Cross-Cutting: Zod Validation, JWT Verification, Rate Limit │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │ Supabase Client SDK (service_role key, server-side)
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FINANCIAL ENGINE LAYER                                │
│                    (Pure TypeScript, Zero I/O, Deterministic)               │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  ┌────────────────┐ ┌────────────────┐ ┌──────────────────────────┐  │   │
│  │  │ MortgageEngine  │ │ BudgetEngine   │ │ SavingsAllocatorEngine   │  │   │
│  │  │                │ │                │ │                          │  │   │
│  │  │ • Amortization  │ │ • Budget vs    │ │ • Surplus calculation    │  │   │
│  │  │ • Extra Payment │ │   Actual       │ │ • Priority queue alloc   │  │   │
│  │  │   Scenarios     │ │ • Rollover     │ │ • Goal progress          │  │   │
│  │  │ • Invest vs Pay │ │ • %-based      │ │ • What-if simulation     │  │   │
│  │  │ • Bi-weekly     │ │ • Category     │ │                          │  │   │
│  │  │                 │ │   aggregation  │ │                          │  │   │
│  │  └────────────────┘ └────────────────┘ └──────────────────────────┘  │   │
│  │                                                                     │   │
│  │  ┌────────────────┐ ┌────────────────┐ ┌──────────────────────────┐  │   │
│  │  │ FHSEngine       │ │ InsightEngine   │ │ Shared Utilities         │  │   │
│  │  │                │ │                │ │                          │  │   │
│  │  │ • Savings Rate │ │ • Rule matching │ │ • decimal precision      │  │   │
│  │  │ • DTI Score    │ │ • Template      │ │ • date utilities         │  │   │
│  │  │ • Emergency Fd │ │   interpolation │ │ • currency formatting    │  │   │
│  │  │ • Budget Score │ │ • Priority      │ │ • math helpers           │  │   │
│  │  │ • NW Trend     │ │   scoring       │ │ • validation schemas     │  │   │
│  │  └────────────────┘ └────────────────┘ └──────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              Supabase Project (Free Tier)                            │   │
│  │                                                                     │   │
│  │  ┌──────────────────────┐  ┌────────────────────────────────────┐   │   │
│  │  │  PostgreSQL Database  │  │  Supabase Auth                     │   │   │
│  │  │                       │  │                                    │   │   │
│  │  │  • users              │  │  • Email/password auth             │   │   │
│  │  │  • profiles           │  │  • JWT generation                  │   │   │
│  │  │  • accounts           │  │  • Password reset                  │   │   │
│  │  │  • categories         │  │  • Session management              │   │   │
│  │  │  • transactions       │  │                                    │   │   │
│  │  │  • budgets            │  └────────────────────────────────────┘   │   │
│  │  │  • savings_goals      │  ┌────────────────────────────────────┐   │   │
│  │  │  • mortgages          │  │  Supabase Storage                  │   │   │
│  │  │  • amortization_cache │  │                                    │   │   │
│  │  │  • financial_health   │  │  • CSV uploads                     │   │   │
│  │  │  • coach_messages     │  │  • Export files                    │   │   │
│  │  │  • allocator_config   │  │                                    │   │   │
│  │  │                       │  └────────────────────────────────────┘   │   │
│  │  │  • RLS policies on    │                                           │   │   │
│  │  │    ALL tables         │                                           │   │   │
│  │  └──────────────────────┘                                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              Supabase Realtime (Optional)                            │   │
│  │  • Live budget updates for shared budgets (v4)                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

                      EXTERNAL SERVICES (FREE TIER)
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  Sentry     │  │  Plausible   │  │ GitHub      │  │ Cloudflare  │
    │  (Errors)   │  │ (Analytics)  │  │ Actions     │  │ KV / D1     │
    │             │  │             │  │ (CI/CD)     │  │ (Cache)     │
    └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### Layer Summary

| Layer | Host | Language | Responsibility |
|---|---|---|---|
| **Client** | Cloudflare Pages | TypeScript/React | UI rendering, client state, offline cache, optimistic updates |
| **API Gateway** | Supabase Edge Functions | TypeScript/Deno | Request validation, auth verification, orchestration, response formatting |
| **Financial Engine** | Shared package (imported by API + test runner) | TypeScript (pure) | ALL financial calculations, deterministic, zero I/O, fully testable |
| **Data** | Supabase PostgreSQL | SQL + RLS | Persistence, row-level security, aggregation queries |

---

## 2. System Boundaries

### 2.1 What Each Layer Owns

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER owns:                                                 │
│  • UI rendering and component lifecycle                             │
│  • Client-side routing and navigation                               │
│  • Form state and input validation (UX pre-check)                   │
│  • Optimistic UI updates (show change before API confirms)          │
│  • Offline data cache (service worker)                              │
│  • Theme, locale, user preferences                                  │
│  • Chart rendering (Recharts)                                       │
│                                                                     │
│  CLIENT LAYER NEVER:                                                │
│  • Performs financial calculations (mortgage, FHS, allocator)       │
│  • Stores authoritative financial data                              │
│  • Makes direct database queries (always through API or SDK+RLS)    │
│  • Computes budget rollovers or surplus                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  API GATEWAY LAYER owns:                                            │
│  • Request validation (Zod schemas)                                 │
│  • JWT verification and user identity extraction                    │
│  • Orchestration: call Financial Engine, then persist results       │
│  • Response formatting and error wrapping                           │
│  • CSV parsing and validation                                       │
│  • Rate limiting and request throttling                             │
│  • Logging and audit trail                                          │
│                                                                     │
│  API GATEWAY NEVER:                                                 │
│  • Implements financial calculation logic                           │
│  • Directly mutates DB without RLS consideration                    │
│  • Stores secrets in code (uses environment variables)              │
│  • Performs heavy computation synchronously (delegates to engine)   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  FINANCIAL ENGINE LAYER owns:                                       │
│  • ALL mortgage calculations (amortization, extra payment, etc.)    │
│  • ALL budget computations (vs actual, rollover, %-based)           │
│  • ALL savings allocation logic (priority queue, surplus)           │
│  • ALL Financial Health Score calculations                          │
│  • ALL AI Coach rule evaluation and message generation              │
│  • Input validation for financial inputs (rates, amounts, terms)    │
│                                                                     │
│  FINANCIAL ENGINE NEVER:                                            │
│  • Makes network calls, DB queries, or any I/O                      │
│  • Depends on runtime environment (Deno, Node, Browser)             │
│  • Handles authentication or authorization                          │
│  • Formats responses for HTTP or UI consumption                     │
│  • Has side effects of any kind                                     │
│  • Throws generic errors (always typed FinancialEngineError)        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  DATA LAYER owns:                                                   │
│  • Data persistence and integrity (PostgreSQL constraints)          │
│  • Row-Level Security policies on every table                       │
│  • Indexes for query performance                                    │
│  • Aggregation queries (SUM, AVG, GROUP BY for reports)             │
│  • Cascading deletes for user data removal                          │
│  • Schema migrations                                                │
│                                                                     │
│  DATA LAYER NEVER:                                                  │
│  • Contains business logic or financial calculations                │
│  • Stores computed scores (only stores engine output)               │
│  • Makes external network calls                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Ownership

```
User Action (e.g., "Add Transaction")
  │
  ▼
[1] CLIENT: Validate form (Zod client-side) → Optimistic UI update
  │
  ▼
[2] API GATEWAY: Verify JWT → Validate payload (Zod server-side)
  │
  ▼
[3] DATA LAYER: Insert row with RLS enforcement → Return result
  │
  ▼
[4] CLIENT: Confirm success → Update React Query cache → Re-render

User Action (e.g., "Calculate FHS")
  │
  ▼
[1] CLIENT: Request /health-score
  │
  ▼
[2] API GATEWAY: Verify JWT → Call DATA LAYER for raw numbers (aggregated)
  │
  ▼
[3] DATA LAYER: Return aggregated financial data (income, expenses, balances)
  │
  ▼
[4] API GATEWAY: Pass raw data → FINANCIAL ENGINE → Receive {score, breakdown}
  │
  ▼
[5] DATA LAYER: Persist score to financial_health_scores table
  │
  ▼
[6] API GATEWAY: Format response → Return to CLIENT
```

---

## 3. Core Modules and Responsibilities

### 3.1 UI Layer (`packages/client/`)

```
packages/client/src/
├── app/                    # App shell, providers, routing
│   ├── providers.tsx       # QueryClient, Theme, Auth providers
│   ├── router.tsx          # Route definitions (React Router v6)
│   └── layout/            # Shell layout, header, nav, footer
├── pages/                  # Page-level components (1:1 with routes)
│   ├── dashboard/          # Dashboard page + widgets
│   ├── transactions/       # List, add, edit, detail, import
│   ├── budgets/            # Current, history, settings
│   ├── accounts/           # List, detail, net worth
│   ├── mortgage/           # Overview, simulator, invest-vs-pay
│   ├── savings/            # Goals, allocator
│   ├── reports/            # Cash flow, categories, net worth, merchants
│   ├── coach/              # AI Coach feed
│   ├── settings/           # Profile, preferences, security, data mgmt
│   └── auth/               # Login, signup, forgot password
├── components/             # Shared UI components (atoms, molecules)
│   ├── ui/                 # Button, Input, Card, Modal, Toast, etc.
│   ├── charts/             # Recharts wrappers (bar, pie, line, gauge)
│   ├── financial/          # MoneyInput, CategoryPicker, AccountSelect
│   └── layout/            # Header, Sidebar, BottomNav
├── hooks/                  # Custom React hooks
│   ├── useTransactions.ts  # React Query hooks for transactions
│   ├── useBudgets.ts       # React Query hooks for budgets
│   ├── useMortgage.ts      # React Query hooks for mortgage
│   ├── useHealthScore.ts   # React Query hooks for FHS
│   └── useCoach.ts         # React Query hooks for coach messages
├── stores/                 # Zustand stores (CLIENT STATE ONLY)
│   ├── uiStore.ts          # Sidebar open, theme, active filters
│   └── formStore.ts        # Unsaved form state (autosave recovery)
├── lib/                    # Client utilities
│   ├── api.ts              # Supabase client initialization (anon key)
│   ├── formatters.ts       # Currency, date, percentage formatting
│   ├── validators.ts       # Zod schemas (shared with engine)
│   └── constants.ts        # Category defaults, colors, config
```

### 3.2 API Layer (`packages/api/`)

```
packages/api/src/
├── middleware/
│   ├── auth.ts             # JWT verification, user extraction
│   ├── validate.ts         # Zod schema validation wrapper
│   ├── rate-limit.ts       # Per-user rate limiting
│   └── error-handler.ts    # Unified error formatting
├── routes/
│   ├── transactions.ts     # Transaction CRUD handlers
│   ├── accounts.ts         # Account CRUD handlers
│   ├── categories.ts       # Category handlers
│   ├── budgets.ts          # Budget CRUD + summary handlers
│   ├── mortgage.ts         # Mortgage CRUD + simulate handlers
│   ├── savings.ts          # Goals + allocator handlers
│   ├── reports.ts          # Aggregation query handlers
│   ├── health-score.ts     # FHS compute + history handlers
│   ├── coach.ts            # Coach message handlers
│   ├── user.ts             # Profile + export + delete handlers
│   └── import.ts           # CSV import + validation
├── lib/
│   ├── supabase.ts         # Supabase admin client (service_role)
│   ├── csv.ts              # CSV parsing + validation
│   └── pagination.ts       # Cursor/offset pagination helpers
└── index.ts                # Edge Function entry point
```

### 3.3 Financial Engine Layer (`packages/engine/`)

```
packages/engine/src/
├── mortgage/
│   ├── calculator.ts       # Core amortization + extra payment
│   ├── scenarios.ts        # Scenario comparison builder
│   ├── invest-vs-pay.ts    # Opportunity cost analysis
│   ├── types.ts            # MortgageInput, AmortizationRow, Scenario
│   └── __tests__/          # Unit tests (pure, no mocks needed)
├── budget/
│   ├── calculator.ts       # Budget vs actual, rollover computation
│   ├── percentage.ts       # %-based budget allocation
│   ├── types.ts            # BudgetInput, BudgetSummary, CategoryActual
│   └── __tests__/
├── savings/
│   ├── allocator.ts        # Priority queue allocation engine
│   ├── surplus.ts          # Surplus calculation (income - expenses)
│   ├── goals.ts            # Goal progress, timeline estimation
│   ├── types.ts            # AllocatorInput, AllocationStep, Surplus
│   └── __tests__/
├── health-score/
│   ├── calculator.ts       # 5-component FHS computation
│   ├── components/         # Individual score components (decoupled)
│   │   ├── savings-rate.ts
│   │   ├── dti.ts
│   │   ├── emergency-fund.ts
│   │   ├── budget-adherence.ts
│   │   └── net-worth-trend.ts
│   ├── recommendations.ts  # Rule-based improvement tips
│   ├── types.ts            # FHSInput, FHSResult, FHSComponent
│   └── __tests__/
├── coach/
│   ├── engine.ts           # Rule evaluation engine
│   ├── rules/              # Rule definitions (one file per category)
│   │   ├── budget-alerts.ts
│   │   ├── spending-tips.ts
│   │   ├── savings-wins.ts
│   │   ├── health-insights.ts
│   │   └── mortgage-tips.ts
│   ├── templates.ts        # Message templates with variable interpolation
│   ├── types.ts            # CoachRule, CoachMessage, RuleContext
│   └── __tests__/
├── shared/
│   ├── math.ts             # Financial math utilities (PMT, FV, IPMT)
│   ├── precision.ts        # Decimal rounding, currency-safe math
│   ├── date.ts             # Date calculations (month diff, amort periods)
│   └── errors.ts           # FinancialEngineError type hierarchy
├── types.ts                # Re-export all engine types
└── index.ts                # Public API surface (what external callers use)
```

### 3.4 Data Layer (`packages/database/`)

```
packages/database/
├── migrations/             # Supabase migration files
│   ├── 001_users.sql
│   ├── 002_profiles.sql
│   ├── 003_accounts.sql
│   ├── 004_categories.sql
│   ├── 005_transactions.sql
│   ├── 006_recurring_templates.sql
│   ├── 007_budgets.sql
│   ├── 008_savings_goals.sql
│   ├── 009_mortgages.sql
│   ├── 010_amortization_cache.sql
│   ├── 011_financial_health_scores.sql
│   ├── 012_coach_messages.sql
│   └── 013_allocator_config.sql
├── seed.sql                # Default categories, system data
├── rls/                    # Individual RLS policy files (one per table)
│   ├── 001_accounts_rls.sql
│   ├── 002_transactions_rls.sql
│   ├── 003_budgets_rls.sql
│   └── ...
├── functions/              # Supabase SQL functions (aggregations)
│   ├── get_monthly_summary.sql
│   ├── get_net_worth.sql
│   └── get_cash_flow.sql
└── indexes.sql             # Performance indexes
```

---

## 4. Financial Engine Design (Critical)

### 4.1 Design Principles

1. **Zero Dependencies**: The engine package depends ONLY on TypeScript types. No React, no Supabase, no HTTP, no file system.
2. **Deterministic**: Same input ALWAYS produces same output. No random, no date dependency at runtime (dates are passed as arguments).
3. **Pure Functions**: Every function is `(input: T) => Result`. No mutations. No shared state.
4. **Exhaustive Error Types**: Every possible failure has a typed error code. No `throw "error"`.
5. **Decimal-Safe**: All currency operations use decimal.js or integer-cents internally. No floating point.
6. **Composable**: Small functions compose into larger calculators. Each component independently testable.
7. **Versioned**: Engine has a version number. Output schema is versioned to support migration.

### 4.2 Mortgage Engine Module

```
MortgageEngine.calculate(request: MortgageCalculationRequest): MortgageCalculationResult

request {
  principal: number            // Loan amount in cents (e.g., 30000000 = $300,000.00)
  annualRate: number           // e.g., 6.5 for 6.5%
  termYears: number            // e.g., 30
  startDate: DateString        // "2024-01-01"
  extraPayments: ExtraPayment[]  // Array of extra payment schedules
}

ExtraPayment {
  type: 'monthly_fixed' | 'annual_lump' | 'one_time' | 'biweekly'
  amount: number               // in cents
  startMonth?: number          // optional start month offset
  endMonth?: number            // optional end month offset
}

result {
  scenarios: ScenarioResult[]  // One per extra payment config
}

ScenarioResult {
  label: string
  monthlyPayment: number       // Standard P&I
  totalPayments: number        // Total number of payments made
  totalPrincipal: number
  totalInterest: number
  payoffDate: DateString
  interestSaved: number        // vs baseline
  amortizationSchedule: AmortizationRow[]
}

AmortizationRow {
  month: number
  date: DateString
  payment: number
  principal: number
  interest: number
  totalInterestToDate: number
  remainingBalance: number
  extraPayment: number         // Extra principal paid this month
}
```

**Key functions (all pure):**

| Function | Signature | Description |
|---|---|---|
| `computeMonthlyPayment` | `(principal, rate, n) => number` | Standard PMT formula |
| `generateAmortizationRow` | `(balance, rate, payment, extra) => AmortizationRow` | Single month calculation |
| `generateFullSchedule` | `(request) => AmortizationRow[]` | Full amortization run |
| `computeInvestVsPay` | `(payment, roi, term) => number` | Future value of invested extra |
| `compareScenarios` | `(scenarios) => ComparisonTable` | Side-by-side scenario diff |
| `findPayoffMonth` | `(schedule) => number` | Binary search for payoff point |

### 4.3 Budget Engine Module

```
BudgetEngine.computeBudgetSummary(request: BudgetSummaryRequest): BudgetSummaryResult

request {
  budgets: CategoryBudget[]       // Budget targets per category
  transactions: TransactionSummary[]  // Actual spending per category (aggregated)
  previousMonthRollovers: Rollover[]  // Unspent amounts from last month
  totalIncome: number              // Monthly income (for %-based budgets)
}

CategoryBudget {
  categoryId: string
  amount: number                   // in cents (null if %-based, then use percentage)
  percentage?: number              // e.g., 0.25 = 25% of income
  rolloverEnabled: boolean
}

result {
  categories: CategoryResult[]
  overall: {
    totalBudgeted: number
    totalSpent: number
    remaining: number
    adherencePercent: number       // 0-100
    status: 'under' | 'on_track' | 'over'
  }
}

CategoryResult {
  categoryId: string
  budgeted: number
  spent: number
  rolloverApplied: number
  available: number
  percentUsed: number
  status: 'under' | 'on_track' | 'at_limit' | 'over'
}
```

**Key functions:**

| Function | Signature | Description |
|---|---|---|
| `computeBudgetPercent` | `(budget, totalIncome) => number` | Resolve %-based to fixed amount |
| `computeRollover` | `(currentMonth, previous) => number` | Carry forward unspent |
| `computeCategoryStatus` | `(spent, budgeted) => Status` | Threshold-based status |
| `computeAdherence` | `(categories) => number` | Weighted adherence % |
| `detectOverspendAlerts` | `(categories) => Alert[]` | Categories exceeding thresholds |

### 4.4 Savings Allocator Engine

```
SavingsAllocatorEngine.computeAllocation(request: AllocationRequest): AllocationResult

request {
  monthlySurplus: number          // income - expenses - sinking funds
  currentState: {
    highInterestDebtBalance: number
    emergencyFundBalance: number
    monthlyExpenses: number
    employerMatchPercent: number
    salary: number
    iraContributionsYTD: number
    extraMortgageEnabled: boolean
    mortgageExtraDesired: number
  }
  customPriorities?: PriorityOverride[]  // User-configured order/splits
}

AllocationStep {
  priority: number
  bucketName: string              // e.g., "High-Interest Debt"
  targetAmount: number            // e.g., full debt balance
  currentProgress: number         // e.g., already paid
  recommendedAllocation: number   // Amount from this month's surplus
  cumulativeAllocated: number
  isComplete: boolean
  estimatedCompletionDate: DateString | null
}

result {
  totalSurplus: number
  remainingSurplus: number         // After all allocations
  steps: AllocationStep[]
  isFullyAllocated: boolean
  summary: string                  // "You should put $400 toward debt..."
}
```

**Core Algorithm (Priority Queue):**

```
function allocate(surplus, state, priorities):
    remaining = surplus
    steps = []

    for each priority in priorities:
        if remaining <= 0: break

        needed = computeNeeded(priority, state)
        allocation = min(remaining, needed)

        steps.push({ priority, allocation, ... })

        if priority.splits:          // User-defined % splits
            splitRemaining = allocation
            for split in priority.splits:
                splitAmount = splitRemaining * split.percent
                steps.push({ subStep: split.bucket, allocation: splitAmount })
                splitRemaining -= splitAmount

        remaining -= allocation

    return { steps, remainingSurplus: remaining }
```

### 4.5 Financial Health Score Engine

```
FHSEngine.computeScore(request: FHSRequest): FHSResult

request {
  totalIncomeMonthly: number
  totalSavingsMonthly: number
  totalDebtPaymentsMonthly: number
  emergencyFundBalance: number
  monthlyExpenses: number
  budgets: CategoryBudget[]
  actualSpending: CategoryActual[]
  currentNetWorth: number
  netWorthThreeMonthsAgo: number
}

result {
  overallScore: number          // 0-100
  tier: 'excellent' | 'good' | 'fair' | 'concerning' | 'critical'
  components: {
    savingsRate: ComponentScore
    debtToIncome: ComponentScore
    emergencyFund: ComponentScore
    budgetAdherence: ComponentScore
    netWorthTrend: ComponentScore
  }
  recommendations: string[]
}

ComponentScore {
  maxPoints: number
  earnedPoints: number
  percentage: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  details: string               // "You save 8% of income. Target: 20%."
}
```

**Component formulas (pure functions):**

```
computeSavingsRateScore(savings, income) {
    rate = savings / income
    points = min(30, (rate / 0.20) * 30)
    return { earnedPoints: points, ... }
}

computeDTIScore(debtPayments, income) {
    dti = debtPayments / income
    if (dti <= 0.36): points = 25
    else: points = max(0, 25 * (1 - (dti - 0.36) / (0.50 - 0.36)))
    return { earnedPoints: points, ... }
}

computeEmergencyFundScore(balance, monthlyExpenses) {
    months = balance / monthlyExpenses
    points = min(20, (months / 6) * 20)
    return { earnedPoints: points, ... }
}
```

### 4.6 Insight / Coach Engine

```
InsightEngine.evaluate(context: RuleContext): CoachMessage[]

context {
  eventType: 'transaction_added' | 'budget_period_closed' | 'goal_milestone'
           | 'monthly_rollover' | 'score_changed' | 'account_low_balance'
  eventPayload: any             // Typed per event type
  userState: UserFinancialState // Current snapshot of user's financial data
  existingMessages: CoachMessage[] // Recently shown messages (avoid duplicates)
}

CoachMessage {
  type: 'alert' | 'tip' | 'win' | 'insight'
  category: 'budget' | 'spending' | 'savings' | 'mortgage' | 'health' | 'general'
  title: string
  message: string               // Interpolated template
  priority: number              // 1 (highest) to 5 (lowest)
  deduplicationKey: string      // Prevent showing same message twice
}
```

**Rule Evaluation Algorithm:**

```
function evaluate(rules, context):
    applicable = []
    for rule in rules:
        if rule.condition(context):
            message = rule.template.interpolate(context)
            applicable.push(message)

    // Sort by priority, filter duplicates, limit to 5
    return applicable
        .sort((a, b) => a.priority - b.priority)
        .filter(msg => isNotDuplicate(msg, context.existingMessages))
        .slice(0, 5)
```

**Each rule is a pure function:**

```
// Example rule: budget overspend alert
{
  id: 'budget-overspend-80',
  condition: (ctx) => {
    if (ctx.eventType !== 'transaction_added') return false
    if (!ctx.userState.currentMonthBudgets) return false
    return ctx.userState.currentMonthBudgets
      .some(b => b.percentUsed >= 80 && b.category === ctx.eventPayload.categoryId)
  },
  template: {
    type: 'alert',
    category: 'budget',
    title: 'Budget Alert: {category}',
    message: 'You\'ve used {percentUsed}% of your {category} budget. '
           + 'You have {remaining} left for the rest of the month.'
  }
}
```

---

## 5. Data Flow Architecture

### 5.1 Write Flow (e.g., Add Transaction)

```
  USER: Submits form
    │
    ▼
┌─────────────────────┐
│  CLIENT              │
│  - Optimistic UI     │  ← Show new transaction immediately
│  - Zod client-valid  │  ← Pre-validate: amount, date, category
│  - React Query       │  ← mutation.mutate(body)
│    mutation          │
└─────────┬───────────┘
          │ POST /transactions { amount, category_id, ... }
          ▼
┌─────────────────────┐
│  API GATEWAY         │
│  - Verify JWT        │  ← Extract user_id from token
│  - Zod server-valid  │  ← Re-validate (never trust client)
│  - Rate limit check  │  ← Max 60 writes/min per user
└─────────┬───────────┘
          │ Supabase SDK (service_role)
          ▼
┌─────────────────────┐
│  DATA LAYER          │
│  - INSERT via RLS    │  ← RLS ensures user_id matches JWT
│  - Return row        │
└─────────┬───────────┘
          │ Transaction row
          ▼
┌─────────────────────┐
│  API GATEWAY         │
│  - Check Coach rules │  ← engine.evaluate('transaction_added', ...)
│  - Compare budget    │  ← engine.computeBudgetSummary(...)
│  - If overspend:     │
│    INSERT coach msg  │
└─────────┬───────────┘
          │ { data, coachMessages? }
          ▼
┌─────────────────────┐
│  CLIENT              │
│  - React Query       │  ← Invalidate queries → re-fetch
│    invalidate        │
│  - Update optimistic │  ← Confirm or rollback
│  - Show coach alert  │  ← Toast if new coach message
│  - Update dashboard  │  ← Budget bars, net worth update
└─────────────────────┘
```

### 5.2 Read Flow (e.g., Dashboard Load)

```
  USER: Navigates to /dashboard
    │
    ▼
┌─────────────────────┐
│  CLIENT              │
│  - Check React Query │  ← If cached & fresh, render immediately
│    cache             │  ← If stale/empty, fetch
│  - Parallel fetching │  ← fire all queries concurrently
│    1. GET /net-worth │
│    2. GET /cash-flow │
│    3. GET /budgets   │
│    4. GET /health-s. │
│    5. GET /transact. │
└─────────┬───────────┘
          │ 5 parallel GET requests
          ▼
┌─────────────────────┐
│  API GATEWAY         │
│  - Verify JWT (once) │  ← Reuse verified session
│  - Route to handler  │
│  For each handler:   │
│    1. Call DB        │
│    2. If computation │
│       needed, call   │
│       Financial      │
│       Engine         │
│    3. Return result  │
└─────────┬───────────┘
          │ 5 responses
          ▼
┌─────────────────────┐
│  CLIENT              │
│  - React Query caches│  ← Each response cached individually
│  - Skeleton replaced │  ← Loading → Data
│  - Recharts render   │  ← Charts animate in
│  - Dashboard stable  │  ← All widgets filled
└─────────────────────┘

  SUBSEQUENT VISITS (within staleTime=5min):
    ┌─────────────────────┐
    │  React Query cache   │  ← Instant render from cache
    │  Re-fetch in         │  ← Background refetch when stale
    │  background          │
    └─────────────────────┘
```

### 5.3 Computation Flow (Precomputed vs Live)

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRECOMPUTED (on data mutation, stored in DB)                       │
│                                                                     │
│  Financial Health Score  ────  Triggered when:                      │
│                                  • Transaction added/deleted        │
│                                  • Budget changes                   │
│                                  • Monthly rollover                 │
│                               Stored in: financial_health_scores    │
│                               Read: O(1) lookup, no recompute      │
│                                                                     │
│  Budget Summary          ────  Triggered when:                      │
│                                  • Transaction added                │
│                                  • Budget edited                    │
│                               Stored in: computed on read           │
│                               Read: aggregations, < 50ms query      │
│                                                                     │
│  Coach Messages          ────  Triggered when:                      │
│                                  • Transaction added                │
│                                  • Budget period closed             │
│                                  • Goal milestone reached           │
│                               Stored in: coach_messages             │
│                               Read: O(1) lookup by user             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  COMPUTED LIVE (on user request, never stored)                      │
│                                                                     │
│  Mortgage Amortization    ────  Computed when:                      │
│                                  • User views amortization schedule │
│                                  • User adjusts extra payment slider│
│                               Stored: amortization_cache (optional) │
│                               Cache TTL: until mortgage params      │
│                                          change or 24h, whichever   │
│                                          is sooner                  │
│                                                                     │
│  Mortgage Scenarios       ────  Computed when:                      │
│                                  • User opens simulator             │
│                                  • User moves extra payment slider  │
│                               Stored: never (UI-only, ephemeral)    │
│                                                                     │
│  Savings Allocation       ────  Computed when:                      │
│                                  • User visits allocator page       │
│                               Stored: never (always current state)  │
│                                                                     │
│  Invest vs Pay            ────  Computed when:                      │
│                                  • User changes ROI or amount       │
│                               Stored: never (interactive slider)    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Database Interaction Model

### 6.1 Supabase Client Initialization

```
CLIENT-SIDE (browser):
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  // RLS enforced. User can only access own rows.

SERVER-SIDE (Edge Functions):
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  // Bypasses RLS. Used ONLY in trusted server context.
  // NEVER expose service_role key to client.
```

### 6.2 Interaction Patterns

```
┌────────────────────────────────────────────────────────────────────────┐
│  PATTERN 1: Direct Client → Supabase (Simple reads)                    │
│                                                                        │
│  Use case: Fetching user's own transactions, categories, accounts      │
│                                                                        │
│  Client ──► Supabase SDK (anon key) ──► PostgreSQL + RLS              │
│                                    ▲                                   │
│                                    └── RLS: user_id = auth.uid()       │
│                                                                        │
│  Example:                                                              │
│    supabase.from('transactions')                                       │
│      .select('*')                                                      │
│      .eq('user_id', user.id)   // Actually enforced by RLS             │
│      .order('date', { ascending: false })                              │
│      .range(0, 49)                                                     │
│                                                                        │
│  RULES:                                                                │
│  • This works for simple CRUD + list operations                        │
│  • NEVER for operations needing Financial Engine                       │
│  • NEVER for aggregations that need server-side computation            │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  PATTERN 2: Client → Edge Function → Supabase (Computation needed)    │
│                                                                        │
│  Use case: Compute FHS, mortgage scenarios, budget summary, allocation │
│                                                                        │
│  Client ──► Edge Function ──► Financial Engine ──► Supabase            │
│                           │                   │                        │
│                           │  Compute result   │  Store/persist         │
│                           │                   │                        │
│  Example:                                                              │
│    POST /health-score                                                   │
│    Body: {}  // Server gathers data, runs engine, stores result        │
│    Response: { score: 72, breakdown: {...}, recommendations: [...] }   │
│                                                                        │
│  RULES:                                                                │
│  • All calls to Financial Engine go through Edge Functions             │
│  • Engine is imported as a package, not called over network            │
│  • Edge Function: validate → fetch data → call engine → persist        │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  PATTERN 3: Edge Function → Supabase (Admin operations)               │
│                                                                        │
│  Use case: CSV import, data export, account deletion                   │
│                                                                        │
│  Edge Function ──► Supabase Admin SDK (service_role)                   │
│                        │                                               │
│                        ├── INSERT many rows (CSV import)               │
│                        ├── SELECT all user data (export)               │
│                        └── DELETE cascade (account removal)            │
│                                                                        │
│  RULES:                                                                │
│  • service_role key available ONLY in Edge Functions env               │
│  • Never log or expose service_role key                                │
│  • Edge Function must verify JWT before using admin access             │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.3 RLS Policy Template

```sql
-- EVERY table follows this exact pattern:
CREATE POLICY "Users can only access their own {table}" ON {table}
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Exception: system tables (categories seed) are read-only for all
CREATE POLICY "Users can read system categories" ON categories
  FOR SELECT
  USING (is_system = true);

-- Exception: profiles are 1:1 with auth.users
CREATE POLICY "Users can only access their own profile" ON profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

### 6.4 Aggregation Queries (for Reports)

```sql
-- These live in packages/database/functions/ for reference.
-- Called by Edge Functions, NOT directly from client.

-- Monthly cash flow summary
CREATE OR REPLACE FUNCTION get_cash_flow(p_user_id UUID, p_months INT)
RETURNS TABLE (year INT, month INT, income DECIMAL, expenses DECIMAL) AS $$
  SELECT
    EXTRACT(YEAR FROM t.date)::INT AS year,
    EXTRACT(MONTH FROM t.date)::INT AS month,
    SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) AS income,
    SUM(CASE WHEN c.type = 'expense' THEN ABS(t.amount) ELSE 0 END) AS expenses
  FROM transactions t
  JOIN categories c ON t.category_id = c.id
  WHERE t.user_id = p_user_id
    AND t.is_archived = false
    AND t.date >= DATE_TRUNC('month', NOW()) - (p_months || ' months')::INTERVAL
  GROUP BY year, month
  ORDER BY year DESC, month DESC;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Net worth (aggregate across all accounts)
CREATE OR REPLACE FUNCTION get_net_worth(p_user_id UUID)
RETURNS DECIMAL AS $$
  SELECT
    SUM(CASE WHEN a.type IN ('checking', 'savings', 'investment') THEN a.balance ELSE 0 END)
    - SUM(CASE WHEN a.type IN ('credit', 'loan') THEN ABS(a.balance) ELSE 0 END)
  FROM accounts a
  WHERE a.user_id = p_user_id AND a.is_active = true;
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

## 7. State Management Strategy

### 7.1 State Ownership Matrix

| State Type | Owner | Storage | Persistence | Recovery |
|---|---|---|---|---|
| **Server State** (transactions, budgets, accounts, goals) | React Query | In-memory cache + service worker | HTTP cache headers + local SW cache | Automatic re-fetch on stale |
| **UI State** (sidebar open, active tab, modals) | Zustand | In-memory | None (ephemeral) | Lost on refresh (acceptable) |
| **Form State** (unsaved changes, autosave) | Zustand | In-memory + localStorage | localStorage | Recovered from localStorage |
| **Auth State** (session, user) | Supabase Auth SDK | Memory + localStorage | localStorage (refresh token) | Auth SDK handles recovery |
| **Theme/Locale** | Zustand | localStorage | localStorage | Restored on init |
| **Chart Interaction** (zoom level, selected range) | React state (useState) | Component state | None | Reset on re-mount |
| **Financial Computation** (amortization, FHS) | React Query (server) | In-memory cache | None (re-fetched) | Cache hit or re-fetch |

### 7.2 React Query Configuration

```typescript
// Core configuration (packages/client/src/lib/query.ts)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes before background refetch
      gcTime: 30 * 60 * 1000,           // Keep in cache 30 min after unmount
      retry: 2,                          // Retry twice on failure
      refetchOnWindowFocus: false,       // Don't refetch on focus (battery/data friendly)
      refetchOnReconnect: true,          // Refetch when coming back online
    },
    mutations: {
      retry: 0,                          // Don't retry mutations
      onError: (error) => toast(error),  // Global error toast
    },
  },
});
```

### 7.3 Cache Strategy per Domain

```
Domain          | staleTime | gcTime   | refetch trigger            | Notes
────────────────┼───────────┼──────────┼────────────────────────────┼────────────────────
Transactions    | 30s       | 15min    | Mutation, page focus       | High churn, short cache
Accounts        | 5min      | 30min    | Mutation                   | Low churn
Categories      | 24h       | 24h      | Mutation (rare)            | Static dataset
Budgets         | 1min      | 15min    | Mutation, new transaction  | Medium churn
Budget Summary  | 1min      | 15min    | Mutation, new transaction  | Computed, frequent
Mortgage        | 15min     | 1h       | Mutation                   | Very low churn
Amortization    | 24h       | 24h      | Mortgage param change      | Computed, expensive
Savings Goals   | 5min      | 30min    | Mutation                   | Low churn
FHS             | 1h        | 24h      | Score recomputed           | Auto-computed monthly
Coach Messages  | 30s       | 10min    | New message generated      | Near-real-time
Reports         | 10min     | 1h       | Any transaction mutation   | Batch computed
```

### 7.4 Offline State Strategy

```
Service Worker Cache Strategy:
  ┌─────────────────────────────────────────────────────────────┐
  │  Cache-First for:                                           │
  │  • App shell (HTML, JS, CSS, fonts, icons)                  │
  │  Strategy: Cache-First, Network fallback                    │
  │                                                             │
  │  Network-First for:                                         │
  │  • Transactions, budgets, accounts (latest data)            │
  │  Strategy: Network-First, Cache fallback                    │
  │    - On success: update cache                               │
  │    - On failure: serve cached version + stale indicator     │
  │                                                             │
  │  Network-Only for:                                          │
  │  • Mortgage simulations, FHS recompute, form submissions    │
  │  Strategy: Always network, no offline                       │
  │    - Show offline indicator if no connection                │
  │    - Queue failed mutations for retry (future feature)      │
  └─────────────────────────────────────────────────────────────┘
```

---

## 8. Caching Strategy

### 8.1 Cache Layers

```
Layer 0: Browser Service Worker (PWA Offline)
  What: App shell, last-fetched transactions, budget data
  Where: Cache Storage API
  TTL: Until evicted (max 50MB)
  Why: Offline functionality, instant load

Layer 1: React Query In-Memory
  What: All server state (see section 7.3)
  Where: JavaScript heap (queryClient)
  TTL: Domain-specific (30s to 24h)
  Why: Avoid re-fetching stable data

Layer 2: Cloudflare KV (Edge Cache)
  What: Mortgage amortization schedules (expensive computation)
  Where: Cloudflare KV (global, low-latency)
  TTL: 24h or until mortgage params change
  Why: Avoid recomputing 360-row amortization on every visit
  Note: Free tier = 1GB storage, 1000 writes/day, unlimited reads

Layer 3: Supabase Database (Persisted Computed Results)
  What: Financial Health Scores (monthly snapshots)
  Where: financial_health_scores table
  TTL: Until new computation triggered
  Why: Historical tracking, trend analysis, no recompute per view

Not Cached (Always Live):
  • Budget vs actual (cheap aggregation query, < 50ms)
  • Transaction list (user expects fresh data)
  • Savings allocation (always computed from current state)
  • Coach messages (near-real-time)
```

### 8.2 Cache Invalidation Rules

```
┌─────────────────────────────────────────────────────────────────────┐
│  Event: Transaction Added                                           │
│  Invalidate: transactions list, budget summary, FHS, cash flow      │
│  Recompute: budget vs actual (engine), coach alerts (engine)        │
│  Note: Immediate UI update via React Query invalidation             │
│                                                                     │
│  Event: Transaction Edited/Deleted                                  │
│  Invalidate: transactions list, budget summary, FHS, net worth      │
│  Recompute: budget vs actual, FHS (if monthly total changed sig.)   │
│                                                                     │
│  Event: Budget Created/Edited                                       │
│  Invalidate: budgets, budget summary, FHS (budget adherence)        │
│  Recompute: FHS budget component                                    │
│                                                                     │
│  Event: Mortgage Params Changed                                     │
│  Invalidate: mortgage detail, amortization cache (KV)               │
│  Recompute: full amortization schedule                              │
│  Note: Delete KV cache entry for this mortgage_id                   │
│                                                                     │
│  Event: New Month (monthly rollover)                                │
│  Invalidate: budgets (previous month), create next month budgets    │
│  Recompute: rollover amounts, FHS (net worth trend)                 │
│  Trigger: Edge Function cron schedule (1st of month, UTC)           │
│                                                                     │
│  Event: Account Balance Adjusted                                    │
│  Invalidate: accounts, net worth                                    │
│  Recompute: net worth, FHS (emergency fund component)               │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3 KV Cache Key Schema

```
// Cloudflare KV keys
budgetos:amortization:{mortgage_id}:{hash_of_params}
budgetos:fhs:{user_id}:{year}-{month}
budgetos:net-worth:{user_id}:{cached_at_hour}

// Hash includes: principal, rate, term, extra payments
// So changing any param = new cache entry
// Old entries expire via TTL (24h)
```

---

## 9. API Gateway Structure

### 9.1 Decision: Supabase Edge Functions over Cloudflare Workers

| Factor | Supabase Edge Functions | Cloudflare Workers |
|---|---|---|
| Co-location with DB | Same project, <5ms latency | Separate, ~50ms latency |
| Free tier | 500k invocations/mo | 100k req/day (3M/mo) |
| Language | TypeScript/Deno | JavaScript/Service Workers |
| Supabase SDK | Native integration | Requires separate setup |
| File size limit | 10MB (plenty for engine) | 1MB (engine may exceed) |
| Cold start | ~200ms | ~50ms |
| DB connection pooling | Built-in | Manual |

**Decision: Supabase Edge Functions** for MVP. The co-location with Supabase and native SDK integration outweigh the cold start difference. The Financial Engine package will be small enough (< 1MB) to fit even in Workers if we need to switch.

### 9.2 Route Mapping

```
Request Path                     Edge Function          Handler
────────────────────────────────────────────────────────────────────
GET    /api/v1/transactions       transactions          list
POST   /api/v1/transactions       transactions          create
GET    /api/v1/transactions/:id   transactions          get
PATCH  /api/v1/transactions/:id   transactions          update
DELETE /api/v1/transactions/:id   transactions          archive

POST   /api/v1/transactions/import  import              csvImport

GET    /api/v1/accounts           accounts              list
POST   /api/v1/accounts           accounts              create
GET    /api/v1/accounts/:id       accounts              get
PATCH  /api/v1/accounts/:id       accounts              update
DELETE /api/v1/accounts/:id       accounts              archive

GET    /api/v1/categories         categories            list
POST   /api/v1/categories         categories            create
PATCH  /api/v1/categories/:id     categories            update

GET    /api/v1/budgets            budgets               getCurrent
POST   /api/v1/budgets            budgets               upsert
GET    /api/v1/budgets/summary    budgets               getSummary
PATCH  /api/v1/budgets/:id        budgets               adjust

GET    /api/v1/mortgages          mortgages             list
POST   /api/v1/mortgages          mortgages             create
PATCH  /api/v1/mortgages/:id      mortgages             update
DELETE /api/v1/mortgages/:id      mortgages             archive
GET    /api/v1/mortgages/:id/amortization  mortgages    getAmortization
POST   /api/v1/mortgages/simulate mortgages             simulate

GET    /api/v1/savings/goals      savings               listGoals
POST   /api/v1/savings/goals      savings               createGoal
PATCH  /api/v1/savings/goals/:id  savings               updateGoal
DELETE /api/v1/savings/goals/:id  savings               deleteGoal
GET    /api/v1/savings/allocator  savings               getAllocation
PATCH  /api/v1/savings/allocator/config  savings        updateAllocatorConfig

GET    /api/v1/health-score       health-score          getCurrent
GET    /api/v1/health-score/history  health-score       getHistory
GET    /api/v1/health-score/breakdown  health-score     getBreakdown

GET    /api/v1/coach/messages     coach                 list
PATCH  /api/v1/coach/messages/:id coach                 markRead
POST   /api/v1/coach/messages/:id/dismiss  coach        dismiss
GET    /api/v1/coach/messages/unread-count  coach       unreadCount

GET    /api/v1/me                 user                  getProfile
PATCH  /api/v1/me                 user                  updateProfile
DELETE /api/v1/me                 user                  deleteAccount
GET    /api/v1/me/export          user                  exportData

GET    /api/v1/reports/cash-flow  reports               cashFlow
GET    /api/v1/reports/categories  reports              categoryBreakdown
GET    /api/v1/reports/net-worth  reports               netWorthTrend
GET    /api/v1/reports/merchants  reports               merchantReport
```

### 9.3 Standard Handler Template

```typescript
// Every Edge Function handler follows this exact pattern:
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod/mod.ts'

import { FinancialEngine } from 'npm:@budgetos/engine'

serve(async (req) => {
  // 1. Verify JWT
  const authHeader = req.headers.get('Authorization')
  const { user, error } = await verifyJWT(authHeader)
  if (error) return json(401, { error: 'Unauthorized' })

  // 2. Create Supabase admin client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 3. Parse and validate request
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return json(422, { error: parsed.error })

  // 4. Fetch required data from DB
  const { data: rawData } = await supabase
    .from('some_table')
    .select('...')
    .eq('user_id', user.id)

  // 5. Call Financial Engine
  const engineResult = FinancialEngine.someModule.compute({
    ...parsed.data,
    userData: rawData,
  })

  // 6. Persist results if needed
  await supabase.from('results_table').insert({
    user_id: user.id,
    ...engineResult,
  })

  // 7. Return formatted response
  return json(200, { data: engineResult })
})
```

### 9.4 Request Lifecycle

```
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────┐
│  Client   │     │  Cloudflare   │     │  Supabase  │     │  Engine   │
│          │     │  Pages/Workers│     │  Edge Fn   │     │  Package  │
└────┬─────┘     └──────┬───────┘     └─────┬─────┘     └────┬─────┘
     │                  │                   │                │
     │ 1. HTTPS Request │                   │                │
     │─────────────────►│                   │                │
     │                  │ 2. Serve static   │                │
     │                  │    or route to    │                │
     │                  │    Edge Function  │                │
     │                  │──────────────────►│                │
     │                  │                   │ 3. Import      │
     │                  │                   │    engine pkg  │
     │                  │                   │───────────────►│
     │                  │                   │                │
     │                  │                   │ 4. Validate JWT│
     │                  │                   │    (Supabase)  │
     │                  │                   │◄──────────────►│
     │                  │                   │                │
     │                  │                   │ 5. Fetch raw   │
     │                  │                   │    data from   │
     │                  │                   │    PostgreSQL  │
     │                  │                   │◄──────────────►│
     │                  │                   │                │
     │                  │                   │ 6. Call engine │
     │                  │                   │    compute()   │
     │                  │                   │───────────────►│
     │                  │                   │                │
     │                  │                   │ 7. Return      │
     │                  │                   │    result      │
     │                  │                   │◄───────────────│
     │                  │                   │                │
     │                  │                   │ 8. Persist (if │
     │                  │                   │    needed)     │
     │                  │                   │◄──────────────►│
     │                  │                   │                │
     │ 9. JSON Response│                   │                │
     │◄────────────────│───────────────────│                │
     │                  │                   │                │
```

---

## 10. Security Architecture

### 10.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  SIGNUP / LOGIN                                                     │
│                                                                     │
│  Client ──► Supabase Auth SDK ──► Supabase Auth Service             │
│       │                      │                                      │
│       │  1. Email + password │  JWT with claims:                    │
│       │  2. SDK handles      │  { sub: user_id, email, aud, exp }   │
│       │     PKCE flow        │                                      │
│       │  3. SDK stores       │  Token expires: 7 days               │
│       │     session in       │  Refresh token: rotates              │
│       │     localStorage     │                                      │
│       │                      │                                      │
│       ▼                      ▼                                      │
│  Result: session object with access_token + refresh_token            │
│                                                                     │
│  NOTE: Auth NEVER goes through our API layer.                       │
│        Supabase handles all auth endpoints directly.                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  AUTHENTICATED REQUEST                                             │
│                                                                     │
│  Client:                                                           │
│    1. Read access_token from SDK session                           │
│    2. Include in Authorization header: Bearer <access_token>       │
│                                                                     │
│  Edge Function:                                                    │
│    1. supabase.auth.getUser(token) → verify + extract user_id      │
│    2. Reject if invalid/expired (401)                              │
│    3. Pass user_id to handler context                              │
│                                                                     │
│  Database (Direct client queries):                                 │
│    1. Supabase SDK sends JWT                                       │
│    2. PostgreSQL RLS evaluates: auth.uid() = user_id               │
│    3. Reject if mismatch (403)                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Authorization Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Trust Boundary 1: Client → Supabase (Direct queries)                      │
│  • Auth mechanism: JWT in Authorization header (SDK handles)               │
│  • Authorization: RLS policies on every table                              │
│  • Allowed operations: SELECT, INSERT, UPDATE, DELETE (RLS-restricted)     │
│  • Allowed tables: transactions, accounts, categories, budgets,            │
│                     savings_goals, mortgages, coach_messages               │
│  • NEVER allowed: Direct access to auth.users, any _admin operation        │
│                                                                             │
│  Trust Boundary 2: Client → Edge Function (API)                           │
│  • Auth mechanism: JWT in Authorization header (manual verify)            │
│  • Authorization: Handler extracts user_id from verified JWT               │
│  • Input validation: Zod schemas (server-side, always re-validate)         │
│  • Rate limiting: Per-user, per-IP (Cloudflare WAF)                       │
│  • Allowed operations: Computation-heavy endpoints, CSV import, reports    │
│                                                                             │
│  Trust Boundary 3: Edge Function → Supabase (Server-side)                 │
│  • Auth mechanism: service_role key (env variable, never exposed)          │
│  • No RLS (service_role bypasses RLS intentionally)                       │
│  • Responsibility: Edge Function MUST enforce user_id scoping in queries   │
│  • Pattern: ALL queries include .eq('user_id', verifiedUser.id)            │
│                                                                             │
│  Trust Boundary 4: Client → Cloudflare Pages                              │
│  • Static assets only (JS, CSS, HTML)                                     │
│  • CSP headers: script-src 'self', object-src 'none', etc.                │
│  • No dynamic server-side rendering                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Input Validation Flow

```
User Input
    │
    ▼
┌─────────────────────────────┐
│  CLIENT-SIDE VALIDATION      │  ← UX only, NOT security
│  (Zod schema, instant       │
│   feedback to user)         │
│  • Required field check     │
│  • Format check (email,     │
│    date, amount)            │
│  • Range check              │
└──────────┬──────────────────┘
           │ (bypassed if user modifies JS)
           ▼
┌─────────────────────────────┐
│  API GATEWAY VALIDATION      │  ← Security boundary
│  (Zod schema, server-side)  │
│  • RE-VALIDATE EVERYTHING   │
│  • Never trust client       │
│  • Strip unknown fields     │
│  • Type coercion checks     │
│  • Business rule validation │
│    (e.g., no negative       │
│     principal on mortgage)  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  FINANCIAL ENGINE            │  ← Domain validation
│  (Input guards)             │
│  • Rate range: 0% - 100%    │
│  • Term range: 1 - 50 years │
│  • Amount > 0               │
│  • Date is not in future    │
│    (for historical)         │
│  • Division by zero guards  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  DATABASE                    │  ← DB constraints
│  (PostgreSQL constraints)   │
│  • NOT NULL                 │
│  • CHECK constraints        │
│    (amount != 0)            │
│  • Foreign key integrity    │
│  • UNIQUE constraints       │
│  • ENUM value checks        │
└─────────────────────────────┘
```

### 10.4 Security Headers (Cloudflare Pages)

```
# Cloudflare Pages _headers configuration
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self';
    script-src 'self' 'unsafe-inline';   # unsafe-inline for React dev, remove in prod
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    connect-src 'self' https://*.supabase.co;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 11. Free-Tier Deployment Mapping

### 11.1 Service → Responsibility Matrix

| Service | What It Hosts | Free Tier Limit | BudgetOS Usage |
|---|---|---|---|
| **Cloudflare Pages** | React SPA (JS/CSS/HTML), static assets, PWA manifest | 500 builds/mo, 500MB storage, unlimited bandwidth | ~20 builds/mo (dev + main), ~10MB assets |
| **Cloudflare Workers** | API proxy/rewrite, CSP headers, redirect rules | 100k req/day | ~500 req/day (most API calls go to Supabase directly) |
| **Cloudflare KV** | Cache for amortization schedules | 1GB storage, 1000 writes/day | ~100 entries, ~10 writes/day |
| **Supabase Database** | All user data (PostgreSQL) | 500MB DB, 2GB RAM, 5GB bandwidth | ~100MB for 200 users |
| **Supabase Auth** | Auth, JWT, password reset | 50,000 users | ~1,000 users |
| **Supabase Storage** | CSV uploads, export files | 1GB storage, 5GB bandwidth | ~100MB |
| **Supabase Edge Functions** | API handlers, computation orchestration | 500k invocations/mo | ~10k/mo |
| **Supabase Realtime** | Live updates (future) | 2M messages/mo | ~10k/mo |
| **GitHub Actions** | CI/CD: lint, test, build, deploy | 2000 min/mo (public repo) | ~200 min/mo |
| **Sentry** | Error tracking | 5k errors/mo | ~500 errors/mo |
| **Plausible** | Privacy-first analytics | Self-hosted (free) or Cloud ($0) | Self-hosted on Railway free tier |

### 11.2 Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│  GitHub Repository (budgetos/budgetos)                              │
│                                                                     │
│  Branch: main                                                       │
│    │                                                                │
│    ▼                                                                │
│  GitHub Actions Workflow: deploy.yml                                │
│                                                                     │
│  Steps:                                                             │
│  1. Checkout repo                                                   │
│  2. Install dependencies (npm ci)                                   │
│  3. Run lint (ESLint + Prettier)                                    │
│  4. Run typecheck (tsc --noEmit)                                    │
│  5. Run unit tests (vitest) — engine, API, client                   │
│  6. Run integration tests (if DB available)                         │
│  7. Build packages:                                                 │
│     │  • packages/engine → dist/                                    │
│     │  • packages/client → dist/ (Cloudflare Pages)                 │
│     │  • packages/api → Edge Functions bundles                      │
│  8. Deploy:                                                         │
│     │  • Cloudflare Pages: wrangler pages deploy dist/client        │
│     │  • Supabase Edge Functions: supabase functions deploy         │
│     │  • Supabase Migrations: supabase db push                      │
│  9. Notify: Sentry release + commit status                          │
│                                                                     │
│  Branch: PR/* (preview)                                             │
│  • Deploy to preview Cloudflare Pages URL                           │
│  • Run full test suite                                              │
│  • No DB migrations (use branch DB if available)                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.3 Resource Budget (Free Tier)

```
Monthly Budget:
  Supabase DB Read:     ~500MB (5GB bandwidth / 10KB per page load × 100k pages)
  Supabase DB Write:    ~50MB  (200 users × 250 transactions/mo × 1KB each)
  Edge Functions:       ~10k  invocations
  GitHub Actions:       ~200 min
  Sentry Errors:        ~500 events

At 200 active users, we use approximately:
  • DB Storage:  100MB / 500MB (20%)
  • DB Bandwidth: 1GB / 5GB (20%)
  • Auth:        200 / 50,000 (0.4%)
  • Edge Fn:     10k / 500k (2%)
  • Actions:     200 / 2000 (10%)
  • Sentry:      500 / 5000 (10%)

Headroom: 5x-50x across all services before hitting free tier limits.
```

---

## 12. Performance Strategy

### 12.1 Precomputed vs Live Computation

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRECOMPUTED (on write, stored in DB)                               │
│                                                                     │
│  What:                        Why:                                 │
│  ─────────────────────────────────────────────────────────────────  │
│  Financial Health Score       • Expensive (5 components)            │
│  (monthly snapshot)           • Needed for history chart            │
│                                • Same value for all users viewing   │
│                                • Recompute: on transaction > 25%    │
│                                  change in monthly totals, or       │
│                                  on monthly cron                    │
│                                                                     │
│  Monthly Budget Summary       • Cheap enough to compute live        │
│  (for past months)            • But cached for dashboard load       │
│                                • Recompute: lazy (compute on read   │
│                                  if no cached version exists)       │
│                                                                     │
│  Net Worth History            • Computed per account change         │
│  (daily snapshots)            • Only daily precision needed         │
│                                • Stored for trend chart             │
│                                                                     │
│  Coach Messages               • Generated on state change           │
│  (until dismissed)            • Stored in coach_messages table      │
│                                • Displayed as feed                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  COMPUTED LIVE (on read, never persisted)                           │
│                                                                     │
│  What:                        Why:                                 │
│  ─────────────────────────────────────────────────────────────────  │
│  Mortgage Amortization        • Always on latest params             │
│                                • User adjusts slider → recompute    │
│                                • Cached in Cloudflare KV for 24h    │
│                                • Cache keyed on param hash          │
│                                                                     │
│  Mortgage Scenario Compare    • Interactive (slider-driven)         │
│                                • 3 scenarios × 360 rows = 1080 rows │
│                                • ~5ms in engine, no caching needed  │
│                                                                     │
│  Savings Allocation           • Always current financial state      │
│                                • Changes with every transaction     │
│                                • Lightweight computation (< 2ms)    │
│                                • No caching needed                  │
│                                                                     │
│  Budget vs Actual             • User expects fresh data             │
│  (current month)              • Cheap SQL aggregation (< 50ms)      │
│                                • React Query cache 30s (de-bounce)  │
│                                                                     │
│  Reports (all)                • Always current data                 │
│                                • SQL aggregations, not engine       │
│                                • React Query cache 10min            │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.2 Query Optimization Rules

```
1. Always use database-side aggregation for sums/counts
   • BAD:  Fetch all transactions → sum in JS
   • GOOD: SELECT SUM(amount) FROM transactions WHERE ...

2. Paginate EVERY list query
   • BAD:  SELECT * FROM transactions
   • GOOD: SELECT * FROM transactions ORDER BY date DESC LIMIT 50

3. Use composite indexes for common query patterns
   • (user_id, date DESC) for transaction listing
   • (user_id, year, month) for budget queries
   • (user_id, type, is_read) for coach message count

4. Avoid N+1 queries in Edge Functions
   • BAD:  For each account, fetch its transactions
   • GOOD: SELECT * FROM transactions WHERE account_id IN (...)
            or use a JOIN

5. Use materialized views for expensive dashboard aggregations
   • Daily_refresh: net worth snapshot, monthly budget summary
   • Refresh: via pg_cron (Supabase supports) or Edge Function cron

6. Batch related queries in Edge Functions
   • Dashboard load: single Edge Function that returns all widgets at once
   • OR: 5 parallel queries from client (React Query handles parallel)
   • Decision: Client-side parallel (simpler, better perceived perf)
```

### 12.3 Performance Budgets

```
Metric                    Target            Measurement
──────────────────────────────────────────────────────────────
TTFB (Time to First Byte)  < 200ms          Edge Function (cold: < 500ms)
First Paint                < 1.5s            Cloudflare CDN
Largest Contentful Paint   < 2.5s            React SPA
First Input Delay          < 100ms           No heavy main thread work
API Response (p95)         < 300ms           Edge Function + DB query
API Response (mortgage)    < 500ms           Engine recompute (worst-case)
Dashboard Load             < 2s              All widgets fetched + rendered
Transaction Search         < 1s              Full-text search (LIKE/trigram)
CSV Import (100 rows)      < 3s              Parse + validate + insert
Bundle Size (JS, gzipped)  < 200KB           Vite code splitting + lazy routes
```

---

## 13. Folder / Repository Structure

### 13.1 Monorepo Root

```
budgetos/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, typecheck, test (every PR)
│       ├── deploy.yml          # Deploy to production (on main merge)
│       └── preview.yml         # Deploy preview on PR
├── packages/
│   ├── client/                 # React SPA (UI Layer)
│   │   ├── src/
│   │   │   ├── app/            # Shell, routing, providers
│   │   │   ├── pages/          # Page components
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── hooks/          # React Query hooks
│   │   │   ├── stores/         # Zustand stores (UI state only)
│   │   │   ├── lib/            # Client utilities, API client
│   │   ├── public/             # Static assets, icons, manifest
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── api/                    # Supabase Edge Functions (API Layer)
│   │   ├── src/
│   │   │   ├── middleware/     # Auth, validation, error handling
│   │   │   ├── routes/         # Request handlers (one per domain)
│   │   │   ├── lib/            # Supabase client, CSV, pagination
│   │   │   └── index.ts        # Entry point
│   │   ├── supabase/
│   │   │   └── config.toml     # Edge Function config (env vars)
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── engine/                 # Financial Engine (Pure TypeScript)
│   │   ├── src/
│   │   │   ├── mortgage/       # Mortgage calculation modules
│   │   │   ├── budget/         # Budget calculation modules
│   │   │   ├── savings/        # Savings allocator modules
│   │   │   ├── health-score/   # FHS calculation modules
│   │   │   ├── coach/          # AI Coach rule engine
│   │   │   ├── shared/         # Math, precision, date utilities
│   │   │   ├── types.ts        # Public type exports
│   │   │   └── index.ts        # Public API surface
│   │   ├── vitest.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── database/               # Data Layer (SQL)
│       ├── migrations/         # Timestamped SQL migrations
│       ├── seed.sql            # Default data
│       ├── rls/                # RLS policy files
│       ├── functions/          # SQL functions for aggregation
│       └── indexes.sql         # Performance indexes
│
├── shared/                     # Shared TypeScript types across packages
│   ├── types/
│   │   ├── models.ts           # DB model interfaces
│   │   ├── api.ts              # Request/response types
│   │   ├── engine.ts           # Engine input/output types
│   │   └── enums.ts            # Shared enums (account types, etc.)
│   ├── validation/             # Zod schemas (shared between client + API)
│   │   ├── transaction.ts
│   │   ├── budget.ts
│   │   ├── mortgage.ts
│   │   └── ...
│   ├── constants/              # Shared constants
│   │   ├── categories.ts       # Default category list
│   │   ├── limits.ts           # Rate limits, page sizes, thresholds
│   │   └── colors.ts           # Category color mappings
│   ├── tsconfig.json
│   └── package.json
│
├── config/
│   ├── eslint.config.js        # Shared ESLint config
│   ├── prettier.config.js      # Shared Prettier config
│   └── tsconfig.base.json      # Base TypeScript config
│
├── tests/
│   ├── integration/            # Cross-package integration tests
│   │   ├── api-engine.test.ts
│   │   └── api-database.test.ts
│   └── e2e/                    # Playwright end-to-end tests
│       ├── dashboard.spec.ts
│       ├── transactions.spec.ts
│       └── mortgage.spec.ts
│
├── docs/                       # Documentation
│   ├── PRD.md
│   ├── SYSTEM_ARCHITECTURE.md  # This document
│   ├── ENGINE_SPEC.md          # Detailed engine module specs
│   └── API_REFERENCE.md        # API endpoint documentation
│
├── package.json                # Root workspace config
├── turbo.json                  # Turborepo pipeline config
├── vitest.workspace.ts         # Vitest workspace config
└── README.md
```

### 13.2 Dependency Graph

```
┌──────────────┐     ┌──────────────┐
│   shared/     │◄────│   engine/    │
│  (types +     │     │  (financial  │
│   schemas)    │     │  calc only)  │
└──────┬───────┘     └──────┬───────┘
       │                    │
       │                    │ (imported as npm dependency)
       ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   client/    │     │    api/      │     │  database/   │
│  (React SPA) │     │ (Edge Fn)    │     │   (SQL)     │
│              │     │              │     │              │
│ depends on:  │     │ depends on:  │     │ referenced   │
│ • shared/    │     │ • shared/    │     │ by api/      │
│ • engine/    │     │ • engine/    │     │ migrations   │
│   (for       │     │   (for calc) │     │              │
│   formatting)│     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
        │                    │                     │
        │                    │                     │
        ▼                    ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                     package.json (root)                       │
│                npm workspaces: packages/*, shared/*           │
│              Build tool: Turborepo + Vite + tsc               │
└──────────────────────────────────────────────────────────────┘
```

---

## 14. Shared Types Strategy

### 14.1 Where Shared Types Live

Everything lives in `shared/` at the monorepo root. This package is consumed by `client/`, `api/`, and `engine/`.

### 14.2 Type Categories

```typescript
// ──────────────────────────────────────────────
// shared/types/models.ts — Database models
// (reflects PostgreSQL schema exactly)
// ──────────────────────────────────────────────

interface Transaction {
  id: string                    // UUID
  user_id: string               // FK → auth.users
  account_id: string            // FK → accounts
  category_id: string           // FK → categories
  amount: number                // Signed integer (cents)
  date: string                  // ISO 8601 date
  merchant: string | null
  note: string | null
  is_recurring: boolean
  recurring_template_id: string | null
  is_archived: boolean
  created_at: string            // ISO 8601 datetime
  updated_at: string
}

// ──────────────────────────────────────────────
// shared/types/engine.ts — Engine input/output
// (what the Financial Engine accepts/returns)
// ──────────────────────────────────────────────

interface MortgageCalculationRequest {
  principal: number             // In cents
  annualRate: number            // e.g., 6.5 for 6.5%
  termYears: number
  startDate: string             // ISO date
  extraPayments: ExtraPayment[]
}

interface MortgageCalculationResult {
  scenarios: ScenarioResult[]
  generatedAt: string           // Timestamp for cache busting
  engineVersion: string         // Semver for migration safety
}

// ──────────────────────────────────────────────
// shared/types/api.ts — API request/response
// (what the HTTP layer sends/receives)
// ──────────────────────────────────────────────

interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
  pagination?: PaginationInfo
}

interface ApiError {
  code: string                  // Machine-readable: 'VALIDATION_ERROR'
  message: string               // Human-readable: "Invalid amount"
  details?: unknown             // Zod error details
}

// ──────────────────────────────────────────────
// shared/types/enums.ts — Shared enums
// ──────────────────────────────────────────────

type AccountType = 'checking' | 'savings' | 'credit' | 'loan' | 'investment' | 'cash'
type CategoryType = 'income' | 'expense'
type CoachMessageType = 'alert' | 'tip' | 'win' | 'insight'
type BudgetStatus = 'under' | 'on_track' | 'at_limit' | 'over'
type SavingsGoalStatus = 'active' | 'completed' | 'cancelled'
```

### 14.3 Zod Schemas (Shared Validation)

```typescript
// shared/validation/transaction.ts

import { z } from 'zod'

// Client-side validation (UX pre-check)
export const transactionFormSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid(),
  amount: z.number().int().refine(n => n !== 0, 'Amount cannot be zero'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  merchant: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
})

// Server-side validation (security boundary)
// Same schema, but with additional business rule checks
export const transactionCreateSchema = transactionFormSchema.extend({
  // Server-only: verify account belongs to user
  // Server-only: category type matches amount sign
})

// Used in: client/src/lib/validators.ts
// Used in: api/src/middleware/validate.ts
// NEVER duplicated: single source of truth in shared/
```

### 14.4 Versioning Strategy

```
Engine types have an engineVersion field.
When engine computation logic changes (e.g., new FHS formula):
  1. Bump engineVersion in engine/src/index.ts
  2. Update type definitions if output shape changes
  3. API layer reads engineVersion from result and includes in response
  4. Client can detect stale cache via engineVersion mismatch
  5. Future: Run both old and new engine in parallel during migration

Schema migrations happen via SQL (packages/database/migrations/).
TypeScript types in shared/types/models.ts are updated to match.
```

---

## 15. Testing Strategy

### 15.1 Test Pyramid

```
         ╱╲
        ╱  ╲
       ╱ E2E ╲           ← 5 tests (critical user journeys)
      ╱────────╲
     ╱ Integration ╲      ← 20 tests (API + DB, API + Engine)
    ╱────────────────╲
   ╱    Unit Tests     ╲   ← 200+ tests (Engine = 150, Client = 50)
  ╱──────────────────────╲
 ╱  Engine Pure Function   ╲  ← The foundation — every function tested
╱────────────────────────────╲
```

### 15.2 Engine Tests (Highest Priority)

```typescript
// packages/engine/src/mortgage/__tests__/calculator.test.ts

// EVERY pure function has:
// 1. Happy path test (standard 30-yr mortgage)
// 2. Edge case: zero extra payment
// 3. Edge case: very high extra payment (pays off in 5 years)
// 4. Edge case: minimum payment only (interest-only scenario)
// 5. Edge case: bi-weekly calculation
// 6. Edge case: annual lump sum
// 7. Edge case: 0% interest rate
// 8. Edge case: very short term (1 year)
// 9. Property-based: total principal paid === original principal
// 10. Property-based: final balance === 0

// Example test structure (no code, just pattern):
test('computeMonthlyPayment returns correct PMT for 30yr @ 6.5%')
  // Input: P=300000, r=0.065/12, n=360
  // Expected: ~1896.20 (verified against known amortization tables)
  // Tolerance: ±1 cent

test('generateFullSchedule final balance is zero')
  // Property: after all payments, remainingBalance ≈ 0

test('generateFullSchedule total principal equals original principal')
  // Property: sum of all principal payments === original principal

test('extra monthly payment reduces term correctly')
  // 30yr @ 6.5% with $200/mo extra
  // Expected payoff from known amortization tables

test('compareScenarios returns correctly sorted by payoff date')
  // Scenario A (no extra) > Scenario B ($100/mo) > Scenario C ($500/mo)
```

### 15.3 Test Configuration

```typescript
// vitest.workspace.ts
export default [
  {
    test: {
      name: 'engine',
      root: './packages/engine',
      include: ['src/**/__tests__/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.ts'],
        exclude: ['src/**/__tests__/**', 'src/types.ts'],
        thresholds: {
          statements: 100,   // Engine MUST be 100% covered
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
  {
    test: {
      name: 'api',
      root: './packages/api',
      include: ['src/**/__tests__/**/*.test.ts'],
      environment: 'node',
      setupFiles: ['../../tests/setup/supabase-mock.ts'],
      coverage: {
        thresholds: {
          statements: 80,
        },
      },
    },
  },
  {
    test: {
      name: 'client',
      root: './packages/client',
      include: ['src/**/__tests__/**/*.test.tsx'],
      environment: 'jsdom',
      setupFiles: ['../../tests/setup/react-testing-library.ts'],
      coverage: {
        thresholds: {
          statements: 70,
        },
      },
    },
  },
]
```

### 15.4 What Each Layer Tests

```
ENGINE (100% coverage required):
  • Every pure function at the unit level
  • Edge cases: zero, negative, NaN, overflow, boundary values
  • Property-based: invariants hold (total paid = principal + interest)
  • All error conditions return typed errors, never throw
  • Decimal precision: no floating point errors at any scale
  • Performance: 360-month amortization in < 5ms

API (80% coverage):
  • Request validation (valid inputs pass, invalid inputs 422)
  • Auth rejection (missing/expired JWT → 401)
  • Authorization (user A cannot access user B's data)
  • Response format (structure matches ApiResponse type)
  • Error handling (DB failure → proper 500 response)
  • Integration: correct engine calls → correct DB writes

CLIENT (70% coverage):
  • Component rendering (snapshot or testing-library)
  • User interactions (click → correct mutation called)
  • Form validation (invalid input → error message shown)
  • Optimistic UI updates (mutation → UI changes before response)
  • Error states (API error → error toast displayed)
  • Empty states (no data → onboarding CTA visible)

INTEGRATION (20 tests):
  • Engine + API: call endpoint → correct computation returned
  • API + Database: write → read → verify persistence
  • RLS: user A reads user B's data → 403/empty result
  • CSV import flow: upload CSV → transactions created correctly

E2E (5 tests):
  • Full user journey: signup → setup accounts → add transactions → view dashboard
  • Budget flow: create budget → add expenses → check budget vs actual
  • Mortgage flow: add mortgage → view amortization → simulate extra payment
  • Savings flow: create goal → allocator suggests → track progress
  • Offline flow: load app → go offline → view cached data → submit (fail gracefully)
```

### 15.5 Test Fixtures

```
tests/fixtures/
├── mortgage/
│   ├── standard-30yr.json        # Known amortization table from FHFA
│   ├── extra-200-monthly.json    # Verified against bank calculators
│   └── biweekly-acceleration.json
├── budget/
│   ├── simple-month.json         # 5 categories, no rollover
│   └── rollover-month.json       # 3 categories with rollover
├── health-score/
│   ├── excellent.json            # Score 88/100
│   ├── fair.json                 # Score 47/100
│   └── critical.json             # Score 12/100
└── allocator/
    ├── debt-focused.json         # User with high-interest debt
    └── savers-profile.json       # User with no debt, building wealth
```

---

## 16. Failure Modes and Recovery

### 16.1 Failure Matrix

| Failure Mode | Impact | Detection | Recovery | Severity |
|---|---|---|---|---|
| **Supabase DB down** | All data operations fail | Edge Function health check (500 error) | Retry with exponential backoff. Show "Offline" banner. Cached data still viewable. | Critical |
| **Supabase Auth down** | Login/register fails | Auth SDK error | Show "Auth service unavailable" banner. Existing sessions still work (JWTs in memory). | High |
| **Edge Function timeout** | Computations fail (>10s limit) | HTTP 504 | Retry with simpler computation. Show "Taking longer than expected" to user. | Medium |
| **Engine computation error** | Invalid inputs cause wrong output | Engine returns typed error | Don't persist. Return 422 with error details. | High |
| **Client JS crash** | Page white-screens | Sentry error + window.onerror | React Error Boundary catches → "Something went wrong" page with reload button. | High |
| **Service Worker install fail** | PWA features disabled | navigator.serviceWorker.register fails | App still works (graceful degradation). Log warning. | Low |
| **Cloudflare KV write limit** | Can't cache amortization | 1000 writes/day exceeded | Skip caching. Compute live (still functional, just slower). | Low |
| **Browser offline** | All network operations fail | navigator.onLine === false | Service worker serves cached shell. Show offline banner. Queue writes for retry (future). | Medium |
| **CSV parse error** | Bulk import fails | Papa Parse error | Show specific row/column errors. Allow partial import. | Medium |
| **Rate limit exceeded** | API returns 429 | Response status 429 | Show "Too many requests. Try again in X seconds." | Low |

### 16.2 Error Boundary Architecture

```
CLIENT:
  ┌─────────────────────────────────────────────────────────────┐
  │  <ErrorBoundary level="root">                               │
  │    App Shell (Header, Nav, Footer)                          │
  │    ┌─────────────────────────────────────────────────────┐  │
  │    │  <ErrorBoundary level="page">                       │  │
  │    │    Page Content (transactions, budgets, etc.)       │  │
  │    │    ┌──────────────────────────────────────────────┐ │  │
  │    │    │  <ErrorBoundary level="widget">              │ │  │
  │    │    │    Dashboard Widget (FHS, Net Worth, etc.)   │ │  │
  │    │    └──────────────────────────────────────────────┘ │  │
  │    └─────────────────────────────────────────────────────┘  │
  │  </ErrorBoundary>                                           │
  │                                                             │
  │  Error Boundary Recovery:                                   │
  │  • Root: Show full-page error with "Reload App" button      │
  │  • Page: Show page-level error with "Retry" button          │
  │  • Widget: Show widget-level error (other widgets still OK) │
  └─────────────────────────────────────────────────────────────┘

ENGINE:
  ┌─────────────────────────────────────────────────────────────┐
  │  Functions NEVER throw. They return result objects.         │
  │                                                             │
  │  interface EngineResult<T> {                                │
  │    success: true                                            │
  │    data: T                                                  │
  │  } | {                                                      │
  │    success: false                                           │
  │    error: {                                                 │
  │      code: EngineErrorCode,                                 │
  │      message: string,                                       │
  │      recoverable: boolean                                   │
  │    }                                                        │
  │  }                                                          │
  │                                                             │
  │  Error codes:                                               │
  │  • NEGATIVE_PRINCIPAL          → "Principal must be > 0"    │
  │  • INVALID_RATE                → "Rate must be 0-100"       │
  │  • TERM_TOO_LONG               → "Term must be 1-50 years"  │
  │  • AMOUNT_OVERFLOW             → "Amount exceeds precision" │
  │  • DATE_MISMATCH               → "Dates out of order"       │
  │  • DIVISION_BY_ZERO            → "Division by zero"         │
  │                                                             │
  │  API layer catches EngineResult and maps to HTTP response.  │
  │  API layer NEVER catches thrown exceptions from engine.     │
  └─────────────────────────────────────────────────────────────┘
```

### 16.3 Graceful Degradation

```
Feature                    If Fails                     Fallback
────────────────────────────────────────────────────────────────
Financial Health Score     Score unavailable            Show "Score coming soon" placeholder
Mortgage Simulator         Engine computation fails     Show basic formula, no chart
CSV Import                 Bulk insert fails            Show row-by-row errors, allow manual entry
Budget vs Actual           Current month agg fails      Show previous month's data
Net Worth                  Account balance query fails  Show accounts list with individual balances
AI Coach Feed              Rule engine fails            Show empty feed with "no new insights"
Dashboard                  Multiple widgets fail        Show each failed widget independently
                           (never crash whole page)      (other widgets remain functional)
Authentication             Supabase Auth down           Existing session: continue working
                                                         New login: "Service temporarily unavailable"
Data Export                Export generation fails      Show downloadable CSV of last successful export
```

---

## 17. Scalability Design

### 17.1 Scaling Stages

```
STAGE 1: MVP (0-200 users)
┌─────────────────────────────────────────────────────────────────┐
│  Architecture: Single Supabase project, single Cloudflare Pages │
│  Database:    Direct queries + RLS. No caching layer.           │
│  Engine:      Imported into Edge Functions, computed on-demand  │
│  Performance: < 200ms API responses, < 2s dashboard load        │
│  Cost:        $0/month                                           │
│  Constraints: 500MB DB, 5GB bandwidth, 500k Edge Fn invocations │
└─────────────────────────────────────────────────────────────────┘

STAGE 2: Growth (200-1,000 users)
┌─────────────────────────────────────────────────────────────────┐
│  Architecture: Add Cloudflare KV for expensive computation cache │
│  Database:    Materialized views for dashboard aggregates        │
│               pg_cron for nightly rollover computations          │
│  Engine:      Bump Edge Function memory (256MB → 512MB)         │
│  Performance: < 150ms API responses, < 1.5s dashboard load      │
│  Cost:        $0/month (still within free tiers)                 │
│  Bottleneck:  DB storage (approaching 500MB)                    │
│  Mitigation:  Archive transactions > 3 years to cold storage    │
└─────────────────────────────────────────────────────────────────┘

STAGE 3: Scale (1,000-10,000 users)
┌─────────────────────────────────────────────────────────────────┐
│  Architecture: Upgrade to Supabase Pro ($25/mo) OR self-host     │
│  Database:    Read replicas for reporting queries                │
│               Connection pooling (Supabase provides)             │
│  Engine:      Move mortgage amortization to Cloudflare Workers   │
│               (dedicated, faster cold start)                     │
│  Performance: < 100ms API responses, < 1s dashboard load        │
│  Cost:        ~$25-50/month                                     │
│  Bottleneck:  Edge Function invocations (500k/mo limit)         │
│  Mitigation:  Cache aggressively, batch API calls               │
│  Revenue:     Introduce "Premium" tier ($5/mo) for bank sync    │
│               to cover infrastructure costs                     │
└─────────────────────────────────────────────────────────────────┘

STAGE 4: Enterprise (10,000+ users)
┌─────────────────────────────────────────────────────────────────┐
│  Architecture: Self-hosted Supabase on dedicated infra          │
│               (or migrate to AWS RDS + Cognito)                 │
│  Database:    Shard by user_id hash range (4-8 shards)          │
│  Engine:      Run in dedicated workers (background queue)       │
│               WASM-compiled engine for performance               │
│  Cache:       Redis/Cloudflare KV for session + computation     │
│  Performance: < 50ms API responses, < 500ms dashboard load      │
│  Cost:        $500-2000/month (covered by Premium subscriptions)│
└─────────────────────────────────────────────────────────────────┘
```

### 17.2 Scaling Decisions Timeline

```
Now (v1)              → Keep everything on free tier. Do NOT optimize for scale.
                        Optimize for correctness and developer experience.
                        Ship fast, prove product-market fit.

At 500 users         → Add Cloudflare KV for expensive caches.
                        Monitor Supabase free tier limits weekly.
                        Optimize query patterns, add missing indexes.

At 1,000 users       → Evaluate Supabase Pro ($25/mo) for read replicas.
                        Implement data archiving (transactions > 3y → cold).
                        Consider Premium tier pricing.

At 5,000 users       → Self-host Supabase or migrate to dedicated Postgres.
                        Implement database connection pooling.
                        Move to cursor-based pagination everywhere.
                        Evaluate sharding strategy.

At 10,000+ users     → Full platform maturity.
                        Multiple read replicas, connection pooling, CDN caching.
                        Dedicated computation workers, WASM engine.
                        Premium subscriptions cover infrastructure.
```

### 17.3 What Does NOT Scale (and How We Fix It)

```
❌ Direct Supabase queries from client for ALL reads
   → Fix: Edge Function aggregates + caching for complex reads

❌ Computing amortization on every visit without caching
   → Fix: Cloudflare KV cache keyed on param hash

❌ N+1 queries in Edge Functions (e.g., fetching accounts then transactions)
   → Fix: JOIN queries or batch fetch with IN clause

❌ Storing every computed FHS score
   → Fix: Keep only monthly snapshots, archive annually

❌ Large CSV imports (1000+ rows) blocking Edge Function
   → Fix: Process in batches of 100, use background queue

❌ Coach rules running on every single transaction creation
   → Fix: Debounce rule evaluation (batch multiple transactions)
```

---

## 18. Separation Rules (Cardinal)

### 18.1 What NEVER Goes in the Frontend

```
╔═════════════════════════════════════════════════════════════════════╗
║  NEVER IN FRONTEND                                                  ║
╠═════════════════════════════════════════════════════════════════════╣
║                                                                     ║
║  1. Financial Calculations (any math beyond display formatting)      ║
║     • Mortgage amortization, PMT, interest calculations             ║
║     • Budget rollover computation                                   ║
║     • FHS scoring algorithm                                         ║
║     • Savings priority allocation                                   ║
║     • Coach rule engine evaluation                                  ║
║     • Surplus/deficit calculations                                  ║
║     • ANY formula that could impact financial decisions             ║
║     ─────────────────────────────────────────────────────────────   ║
║     WHY: Client-side code is not authoritative. Users can modify    ║
║     JS in the browser. Financial calculations MUST be trusted,      ║
║     auditable, and tested server-side.                              ║
║                                                                     ║
║  2. Database Queries That Write Without User Context                ║
║     • Any operation that computes a value then stores it            ║
║     • Bulk operations (import, export, delete)                      ║
║     ─────────────────────────────────────────────────────────────   ║
║     WHY: Direct writes bypass server-side validation. Use Edge      ║
║     Functions for any write that needs computation.                 ║
║                                                                     ║
║  3. Secrets, API Keys (except Supabase anon key)                    ║
║     • service_role key NEVER in client bundle                       ║
║     • Plaid/Finicity secrets NEVER in client                        ║
║     • LLM API keys NEVER in client                                  ║
║     ─────────────────────────────────────────────────────────────   ║
║     WHY: Client bundle is public. Anyone can read your keys.        ║
║                                                                     ║
║  4. Business Rules That Affect Data Integrity                       ║
║     • "Can this transaction be deleted?" (dependencies)             ║
║     • "Is this budget adjustment valid?" (constraints)              ║
║     ─────────────────────────────────────────────────────────────   ║
║     WHY: Client-side business rules are advisory. Server enforces.  ║
║                                                                     ║
║  5. Any Logic That Should Be Authoritative                          ║
║     • Truth about user's financial data                             ║
║     • Truth about computation results                               ║
║     • Audit trail of changes                                        ║
║     ─────────────────────────────────────────────────────────────   ║
║     WHY: The server is the single source of truth. Client is a      ║
║     transient view of server state.                                 ║
║                                                                     ║
╚═════════════════════════════════════════════════════════════════════╝
```

### 18.2 What NEVER Goes in the API Layer

```
╔═════════════════════════════════════════════════════════════════════╗
║  NEVER IN API LAYER                                                 ║
╠═════════════════════════════════════════════════════════════════════╣
║                                                                     ║
║  1. Financial Calculation Logic                                     ║
║     • Any formula, algorithm, or financial computation              ║
║     ─────────────────────────────────────────────────────────────   ║
║     WHY: Violates separation of concerns. Engine is the single      ║
║     source of financial logic. API is only an orchestrator.         ║
║     If you need to compute something, CALL the Engine.              ║
║                                                                     ║
║  2. Duplicated Validation (already in Zod schemas in shared/)       ║
║     ─────────────────────────────────────────────────────────────   ║
║     WHY: Shared schemas already exist. API imports them.            ║
║     Duplication = drift risk.                                       ║
║                                                                     ║
║  3. UI Logic — Formatting decisions about display                   ║
║     • Currency formatting (client decides $ vs USD vs locale)       ║
║     • Date display format (client decides MM/DD vs DD/MM)           ║
║     • Color coding, visual thresholds                               ║
║     ─────────────────────────────────────────────────────────────   ║
║     WHY: API returns raw data. Client transforms for display.       ║
║     API should return: { amount: 3000000 }                          ║
║     NOT: { amount: "$30,000.00" }                                   ║
║                                                                     ║
║  4. Mixing service_role and anon_key logic in same file             ║
║     ─────────────────────────────────────────────────────────────   ║
║     WHY: Security. service_role operations need extra scrutiny.     ║
║     File naming convention: .admin.ts for service_role operations.  ║
║                                                                     ║
╚═════════════════════════════════════════════════════════════════════╝
```

### 18.3 What MUST Be Inside the Financial Engine

```
╔═════════════════════════════════════════════════════════════════════╗
║  MUST BE IN FINANCIAL ENGINE                                        ║
╠═════════════════════════════════════════════════════════════════════╣
║                                                                     ║
║  1. ALL Mortgage Mathematics                                        ║
║     • computeMonthlyPayment (PMT formula)                           ║
║     • generateAmortizationRow                                       ║
║     • generateFullSchedule                                          ║
║     • extraPaymentImpact                                            ║
║     • biweeklyAcceleration                                          ║
║     • investVsPayComparison                                         ║
║     • interestSavedCalculation                                      ║
║     • breakEvenAnalysis                                             ║
║                                                                     ║
║  2. ALL Budget Mathematics                                          ║
║     • computeBudgetSummary                                          ║
║     • computeRolloverAmount                                         ║
║     • resolvePercentageBudgets                                      ║
║     • computeCategoryAdherence                                      ║
║     • detectOverspendCategories                                     ║
║     • computeWeightedAdherence                                      ║
║                                                                     ║
║  3. ALL Savings Allocation Logic                                    ║
║     • calculateSurplus                                              ║
║     • priorityQueueAllocation                                       ║
║     • computeGoalProgress                                           ║
║     • estimateCompletionDate                                        ║
║     • applyCustomSplits                                             ║
║                                                                     ║
║  4. ALL Financial Health Score Logic                                ║
║     • computeSavingsRateScore                                       ║
║     • computeDTIScore                                               ║
║     • computeEmergencyFundScore                                     ║
║     • computeBudgetAdherenceScore                                   ║
║     • computeNetWorthTrendScore                                     ║
║     • aggregateToOverallScore                                       ║
║     • generateRecommendations                                       ║
║                                                                     ║
║  5. ALL Coach Rule Logic                                            ║
║     • Rule definitions (each as pure condition function)            ║
║     • Template message interpolation                                ║
║     • Priority sorting                                              ║
║     • Deduplication key generation                                  ║
║     • Rule evaluation engine                                        ║
║                                                                     ║
║  6. Shared Financial Utilities                                      ║
║     • Decimal precision helpers                                     ║
║     • Currency-safe math (all operations in cents)                  ║
║     • Date period calculations (month diff, amort periods)          ║
║     • Rate validation (0-100%, no negative rates)                   ║
║     • Financial engine error types                                  ║
║                                                                     ║
╚═════════════════════════════════════════════════════════════════════╝
```

### 18.4 Enforcement Mechanisms

```
CODE REVIEW CHECKLIST:
  □ Are there any financial calculations in the client/ package?
    → If yes, BLOCK. Move to engine/.
  □ Are there any database queries in the engine/ package?
    → If yes, BLOCK. Engine is pure, zero I/O.
  □ Does the API handler do any financial computation?
    → If yes, BLOCK. Call engine instead.
  □ Are validation schemas duplicated anywhere?
    → If yes, BLOCK. Import from shared/.
  □ Are API responses formatted for display?
    → If yes, BLOCK. Return raw values.

ARCHITECTURAL TESTS (automated):
  // packages/engine must not import anything from 'react', 'fs', 'http', etc.
  test('engine has zero external dependencies')
    // Parse package.json, verify dependencies = []

  // packages/client must not import engine calculation functions
  test('client does not import engine/src/**')
    // ESLint rule: no-restricted-imports

  // packages/api must use engine, not implement calculations
  test('api handler functions call engine.calculate()')
    // Code review + grep for financial formula symbols

  // types in shared/types/ must match database schema
  test('shared types match database tables')
    // Integration: read database schema, compare with TypeScript types
```

---

*End of System Architecture Document. This document defines the complete system boundaries, module responsibilities, separation rules, and scalability plan for BudgetOS. All architectural decisions prioritize maintainability, testability, and free-tier deployment viability.*

*Next document: ENGINE_SPEC.md — Detailed specifications for each Financial Engine module.*
