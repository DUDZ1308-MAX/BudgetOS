# Deployment Guide

## Deployment Target

MyBudgetOS is deployed to **Vercel** using Vercel's built-in GitHub integration.

## How Deployments Work

Vercel's GitHub App is connected to this repository and automatically deploys:

- **Every push** to any branch creates a **Preview Deployment** with a unique URL
- **Every merge to `main`** creates a **Production Deployment** at `https://budget-os-web.vercel.app`
- Vercel posts preview URLs as PR comments automatically

No long-lived deployment tokens or custom CI deployment steps are needed.

## CI/CD Pipeline

The CI pipeline is defined in `.github/workflows/ci.yml` and runs on every push and PR:

1. **Lint** — TypeScript type checking
2. **Typecheck** — TypeScript compilation check
3. **Test** — Run engine tests
4. **Test Web** — Run web tests
5. **Build** — Production build verification

All checks must pass before merging. Vercel's built-in Git integration handles the deployment independently — no `deploy` job runs in GitHub Actions.

## Deployment Checks (Production Gating)

To prevent broken builds from reaching production, configure **Deployment Checks** in Vercel:

1. Go to [Vercel Dashboard → budget-os-web → Settings → Deployment Checks](https://vercel.com/dashboard)
2. Click **Add Checks** → select **GitHub**
3. Select which CI workflows must pass before promoting to production:
   - `CI / Lint`
   - `CI / TypeCheck`
   - `CI / Test`
   - `CI / Build`
4. Enable **"Fail if checks are not passing"** for production
5. Save

This ensures production deploys only go live after CI passes, without needing a custom Actions deploy step.

## Build Command

```bash
npm run build
```

Build output directory: `apps/web/dist`

## Environment Variables

Required environment variables for production (set in Vercel dashboard → Settings → Environment Variables):

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_APP_URL` | Production URL (`https://budget-os-web.vercel.app`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `VITE_STRIPE_PRICE_PRO_MONTH` | Stripe price ID for Pro monthly |
| `VITE_STRIPE_PRICE_PRO_YEAR` | Stripe price ID for Pro yearly |
| `VITE_STRIPE_PRICE_PREMIUM_MONTH` | Stripe price ID for Premium monthly |
| `VITE_STRIPE_PRICE_PREMIUM_YEAR` | Stripe price ID for Premium yearly |

## Manual Deployment

To deploy manually from your local machine:

```bash
npx vercel --prod
```

## Environment-Specific Configuration

| Environment | Branch | URL |
|-------------|--------|-----|
| Development | local | http://localhost:5173 |
| Preview | any branch | `https://budget-os-web-git-<branch>.vercel.app` |
| Production | main | https://budget-os-web.vercel.app |

## Previous Domains

- `budgetos-rust.vercel.app` — no longer active (project deleted)
- `budgetos.vercel.app` — separate legacy project (static landing page)

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
