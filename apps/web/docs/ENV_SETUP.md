# Environment Setup Guide

## Quick Start

```bash
cp .env.example .env
# Edit .env with your values
npm run dev
```

## Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_APP_URL` | Application URL | Yes |

## Stripe Variables (for billing)

| Variable | Description |
|----------|-------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_test_ or pk_live_) |
| `VITE_STRIPE_PRICE_PRO_MONTH` | Pro monthly price ID |
| `VITE_STRIPE_PRICE_PRO_YEAR` | Pro yearly price ID |
| `VITE_STRIPE_PRICE_PREMIUM_MONTH` | Premium monthly price ID |
| `VITE_STRIPE_PRICE_PREMIUM_YEAR` | Premium yearly price ID |

## Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ANALYTICS_ENABLED` | `true` | Set to `false` to disable analytics |
| `VITE_SENTRY_DSN` | - | Sentry error tracking DSN |
| `VITE_POSTHOG_API_KEY` | - | PostHog analytics API key |
| `VITE_GA_MEASUREMENT_ID` | - | Google Analytics measurement ID |
| `VITE_PLAUSIBLE_DOMAIN` | - | Plausible analytics domain |

## Validation

The app validates required environment variables at startup. Missing variables will log warnings to the console. Critical variables (Supabase keys) will show an error state in the UI.

## Production Checklist

- [ ] All `VITE_` variables set in hosting dashboard
- [ ] Stripe keys use `pk_live_` prefix (not `pk_test_`)
- [ ] `VITE_APP_URL` points to production domain
- [ ] Supabase redirect URLs include production domain
- [ ] Analytics API keys configured (if desired)
- [ ] `VITE_ANALYTICS_ENABLED` set to `true`
