# Architecture Overview

## Application Architecture

BudgetOS is a single-page application (SPA) with a Supabase backend.

### Frontend Architecture

```
src/
├── ai/                  # AI integration (providers, chat, engines)
├── auth/                # Authentication (sign-in, sign-up, password reset)
├── billing/             # Subscription tiers, Stripe, feature gating
├── components/          # Shared UI components
│   ├── ai/
│   ├── dashboard/
│   ├── layout/          # AppShell, Sidebar, Header, MobileNav
│   └── ui/              # ErrorBoundary, Toast, Icons, etc.
├── config/              # Environment configuration
├── core/                # Cross-cutting concerns
│   ├── audit/           # Audit trail
│   ├── events/          # Event bus
│   ├── logger/          # Structured logging
│   ├── monitoring/      # Performance monitoring
│   ├── security/        # Input sanitization, rate limiting
│   └── sync/            # Offline sync
├── engine/              # Business logic (budget, cashflow, mortgage)
├── features/            # Feature modules
│   ├── dashboard/
│   ├── transactions/
│   ├── budgets/
│   ├── savings/
│   ├── mortgage/
│   └── reports/
├── hooks/               # React Query hooks
├── intelligence/        # Financial health, alerts, recommendations
├── lib/                 # API clients, utilities
├── middleware/          # Auth middleware
├── pages/               # Route page components
├── providers/           # App providers
├── router/              # Route configuration
├── services/            # Business services
│   ├── ai/
│   ├── backup/
│   ├── export/
│   ├── import/
│   ├── notifications/
│   ├── supabase/
│   └── sync/
├── stores/              # Zustand stores
│   └── intelligence/
├── styles/              # Global CSS
├── types/               # Shared TypeScript types
└── main.tsx             # App entry point
```

### Data Flow

1. **User Interaction** → React component
2. **Component** → React Query hook (caching + fetching)
3. **React Query** → API client (Supabase queries)
4. **API Client** → Supabase REST API
5. **Response** flows back through React Query cache
6. **Component** re-renders with new data

For writes:
1. **Component** → React Query mutation
2. **Mutation** → Optimistic update + API call
3. **API call** → Supabase
4. **On success** → Invalidate related queries
5. **Audit entry** → Logged to audit store
6. **Sync event** → Emitted to sync queue

### State Management

- **Server state**: React Query (cached, stale-while-revalidate)
- **UI state**: Zustand stores (auth, theme, toast, sync status)
- **Local state**: React useState/useReducer

### Intelligence Engines

All intelligence features (financial health score, alerts, recommendations, trends) are implemented as pure functions in `src/intelligence/`. They take a unified `IntelligenceInput` type and return deterministic results.

### Offline Sync

Two sync implementations coexist:
- `core/sync/` — Legacy queue-based sync
- `services/sync/` — Enhanced sync with scheduler, realtime subscriptions, conflict resolution

### Security

- Authentication via Supabase Auth
- Row Level Security (RLS) on all database tables
- API keys stored in localStorage (with warnings)
- Input sanitization for user-generated content
- Rate limiting on form submissions
- No `dangerouslySetInnerHTML` usage
