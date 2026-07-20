# Domain Configuration

MyBudgetOS uses a single-domain architecture on Vercel.

## Production Domain

| Purpose        | Domain                                          | Provider |
| -------------- | ----------------------------------------------- | -------- |
| Web App        | `budget-os-web.vercel.app`                      | Vercel   |
| Auth Callback  | `budget-os-web.vercel.app/auth/callback`        | Supabase |

## Environment Variables

These must be set in your hosting provider (Vercel):

```bash
VITE_APP_URL=https://budget-os-web.vercel.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRICE_PRO_MONTH=price_...
VITE_STRIPE_PRICE_PRO_YEAR=price_...
VITE_STRIPE_PRICE_PREMIUM_MONTH=price_...
VITE_STRIPE_PRICE_PREMIUM_YEAR=price_...
VITE_STRIPE_CHECKOUT_URL=/api/stripe/create-checkout-session
VITE_STRIPE_PORTAL_URL=/api/stripe/customer-portal
VITE_STRIPE_WEBHOOK_ENDPOINT=/api/stripe/webhook
```

## Supabase Configuration

1. **Authentication → URL Configuration** in Supabase Dashboard:
   - Site URL: `https://budget-os-web.vercel.app`
   - Redirect URLs:
     - `https://budget-os-web.vercel.app/**`
     - `http://localhost:5173/**` (dev)
   - Disable "Confirm email" for testing; enable for production

2. **Row Level Security (RLS)**:
   - All tables must have RLS enabled with user_id policies
   - See `supabase/migrations/` for policy definitions

## Stripe Configuration

1. Create products and prices in Stripe Dashboard
2. Add webhook signing secret to environment variables (server-side)
3. Test mode uses keys starting with `pk_test_`; live mode uses `pk_live_`

## Previous Domains

- `budgetos-rust.vercel.app` — no longer active (project deleted)
- `budgetos.vercel.app` — separate legacy project (static landing page)
