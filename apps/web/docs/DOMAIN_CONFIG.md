# Domain Configuration

MyBudgetOS uses a single-domain architecture on Vercel.

## Production Domain

| Purpose        | Domain                                    | Provider |
| -------------- | ----------------------------------------- | -------- |
| Web App        | `budgetos-rust.vercel.app`                | Vercel   |
| Auth Callback  | `budgetos-rust.vercel.app/auth/callback`  | Supabase |

## Environment Variables

These must be set in your hosting provider (Vercel):

```bash
VITE_APP_URL=https://budgetos-rust.vercel.app
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

1. **Authentication Settings** in Supabase Dashboard:
   - Site URL: `https://budgetos-rust.vercel.app`
   - Redirect URLs:
     - `https://budgetos-rust.vercel.app/auth/callback`
     - `http://localhost:5173/auth/callback` (dev)
   - Disable "Confirm email" for testing; enable for production

2. **Row Level Security (RLS)**:
   - All tables must have RLS enabled with user_id policies
   - See `supabase/migrations/` for policy definitions

## Stripe Configuration

1. Create products and prices in Stripe Dashboard
2. Add webhook signing secret to environment variables (server-side)
3. Test mode uses keys starting with `pk_test_`; live mode uses `pk_live_`

## Old Deployment Redirect

The old deployment at `budget-os-web.vercel.app` is permanently redirected (308) to `budgetos-rust.vercel.app` via vercel.json host-conditional redirects.
