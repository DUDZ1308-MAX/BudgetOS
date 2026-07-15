# Deployment Guide

## Deployment Target

MyBudgetOS is deployed to **Vercel** via GitHub Actions.

## Build Command

```bash
npm run build
```

Build output directory: `apps/web/dist`

## Environment Variables

Required environment variables for production:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `VITE_STRIPE_PRICE_PRO_MONTH` | Stripe price ID for Pro monthly |
| `VITE_STRIPE_PRICE_PRO_YEAR` | Stripe price ID for Pro yearly |
| `VITE_STRIPE_PRICE_PREMIUM_MONTH` | Stripe price ID for Premium monthly |
| `VITE_STRIPE_PRICE_PREMIUM_YEAR` | Stripe price ID for Premium yearly |

## CI/CD Pipeline

The CI/CD pipeline is defined in `.github/workflows/ci.yml` and runs on pushes to `main`:

1. **Lint** — TypeScript type checking
2. **Typecheck** — TypeScript compilation check
3. **Test** — Run engine and web tests
4. **Build** — Production build
5. **Deploy** — Deploy to Vercel (main branch only)

## Manual Deployment

To deploy manually:
```bash
npm run build
cd apps/web
npx vercel --prod
```

## Environment-Specific Configuration

| Environment | Branch | URL |
|-------------|--------|-----|
| Development | local | http://localhost:5173 |
| Production | main | https://budgetos-rust.vercel.app |

## Old Deployment

The old deployment at `budget-os-web.vercel.app` is permanently redirected (308) to `budgetos-rust.vercel.app`.

## Supabase Setup

1. Create a Supabase project
2. Run migrations from `packages/database/`
3. Configure authentication providers
4. Set up Row Level Security policies
5. Enable realtime subscriptions for sync

## Stripe Setup

1. Create a Stripe account
2. Create products and prices in Stripe dashboard
3. Configure webhook endpoints
4. Set environment variables with price IDs
