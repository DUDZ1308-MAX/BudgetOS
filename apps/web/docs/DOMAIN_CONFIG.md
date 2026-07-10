# Domain Configuration

BudgetOS uses a single-domain architecture with a dedicated API subdomain for Stripe webhooks and server-side operations.

## Production Domains

| Purpose        | Domain                        | Provider |
| -------------- | ----------------------------- | -------- |
| Web App        | `app.budgetos.app`            | Vercel   |
| API            | `api.budgetos.app`            | Vercel   |
| Auth Callback  | `app.budgetos.app/auth/callback` | Supabase |
| Stripe Webhook | `api.budgetos.app/stripe/webhook` | Stripe  |

## Environment Variables

These must be set in your hosting provider (Vercel):

```bash
VITE_APP_URL=https://app.budgetos.app
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
   - Site URL: `https://app.budgetos.app`
   - Redirect URLs:
     - `https://app.budgetos.app/auth/callback`
     - `http://localhost:5173/auth/callback` (dev)
   - Disable "Confirm email" for testing; enable for production

2. **Row Level Security (RLS)**:
   - All tables must have RLS enabled with user_id policies
   - See `supabase/migrations/` for policy definitions

## Stripe Configuration

1. Create products and prices in Stripe Dashboard
2. Configure webhook endpoint: `https://api.budgetos.app/stripe/webhook`
3. Add webhook signing secret to environment variables (server-side)
4. Test mode uses keys starting with `pk_test_`; live mode uses `pk_live_`

## DNS Setup (Vercel)

1. Add custom domain `app.budgetos.app` in Vercel project settings
2. Configure `api.budgetos.app` as a separate Vercel project or rewrite
3. Update DNS records: CNAME `app` -> `cname.vercel-dns.com`
4. Wait for SSL certificate provisioning (automatic with Vercel)

## CORS Configuration

If using a separate API server:

```js
// Server-side CORS config
{
  origin: ['https://app.budgetos.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}
```

## Health Check Endpoints

| Endpoint                 | Expected Response |
| ------------------------ | ----------------- |
| `https://app.budgetos.app/status` | 200 HTML (Status Page) |
| `https://api.budgetos.app/health` | 200 JSON `{ status: "ok" }` |
