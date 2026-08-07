# Stripe Billing — Architecture & Setup

## Architecture

```
Vite React frontend
  → supabase.functions.invoke(...)
  → Supabase Edge Functions (Deno)
    → Stripe (Checkout / Billing Portal / Webhooks)
  → Stripe Webhooks
    → user_subscriptions (server-authoritative entitlement)
  → stripe-get-subscription
  → frontend feature gates
```

Entitlements are **server-authoritative**. The tier/status shown by the
frontend always comes from the `stripe-get-subscription` Edge Function,
which reads the database written by the `stripe-webhook` function. The
browser can never self-grant a paid tier: there is no localStorage
authority and no client webhook processing.

## Pricing

| Plan     | Monthly | Yearly | Trial     |
|----------|---------|--------|-----------|
| Free     | $0      | $0     | —         |
| Pro      | $9      | $90    | 14 days   |
| Premium  | $19     | $190   | 14 days   |

Stripe Products/Prices are created manually in the Stripe Dashboard
(Test Mode) — never from application startup.

## Edge Functions

| Function | JWT | Purpose |
|----------|-----|---------|
| `stripe-create-checkout-session` | required | Validates tier/interval, resolves Price ID server-side, creates/reuses a Stripe Customer, returns Checkout URL |
| `stripe-customer-portal` | required | Opens the Stripe Billing Portal for the authenticated user's customer |
| `stripe-get-subscription` | required | Returns the normalized subscription (or FREE default) for the authenticated user |
| `stripe-webhook` | disabled | Verifies the Stripe signature, dedupes by event id, writes entitlement |

The webhook is the ONLY function with `verify_jwt = false`
(`supabase/config.toml`). Its security comes from
`STRIPE_WEBHOOK_SECRET` signature verification.

### Frontend env (public)

- `VITE_STRIPE_PUBLISHABLE_KEY` — publishable key (`pk_test_…` in test).

### Supabase Edge Function secrets (never in the browser)

- `STRIPE_SECRET_KEY` — secret key (`sk_test_…` in test).
- `STRIPE_WEBHOOK_SECRET` — webhook signing secret (`whsec_…`).
- `STRIPE_PRICE_PRO_MONTH`, `STRIPE_PRICE_PRO_YEAR`
- `STRIPE_PRICE_PREMIUM_MONTH`, `STRIPE_PRICE_PREMIUM_YEAR`
- `APP_URL` — server-controlled origin used for success/cancel URLs.

No secret value belongs in a `VITE_*` variable, in git, or in this
document.

## Test Mode Setup

1. In Stripe Dashboard → Developers, create two Products and four
   Prices in **Test Mode**:
   - Product **Pro** → $9.00/month and $90.00/year
   - Product **Premium** → $19.00/month and $190.00/year
2. Copy the four `price_…` ids into the Edge Function secrets above.
3. Add a **Webhook Endpoint**:
   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   with events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Database

`public.user_subscriptions` — one row per user (unique `user_id`):

- `user_id`, `stripe_customer_id`, `stripe_subscription_id`
- `status` (`active`, `trialing`, `past_due`, `canceled`,
  `incomplete`, `incomplete_expired`, `unpaid`)
- `tier` (`free`, `pro`, `premium`), `interval` (`month`, `year`)
- `trial_start`, `trial_end`, `current_period_start`,
  `current_period_end`, `cancel_at_period_end`, `canceled_at`
- `stripe_price_id`, `last_stripe_event_at` (webhook ordering)

`public.webhook_events` — idempotency log keyed by `stripe_event_id`.

RLS: users may SELECT only their own row; there are no public
INSERT/UPDATE/DELETE policies. Trusted writes happen with the service
role from Edge Functions. A defense-in-depth trigger rejects any
user-authenticated change to entitlement columns.

## Webhook reliability

- **Duplicates:** each event is recorded in `webhook_events` after
  successful processing; replays are acknowledged without re-applying.
- **Out-of-order:** subscription events are applied only when
  `event.created` is not older than `last_stripe_event_at`.
- **Failures:** a processing error returns a non-2xx so Stripe retries.

## Local development

1. `supabase start`
2. Deploy functions locally: `supabase functions serve`
3. Run migrations: `supabase db reset` (or `supabase db push`)
4. `cd apps/web && cp .env.example .env` and set values.
5. For local webhook testing, use `stripe listen --forward-to
   localhost:54321/functions/v1/stripe-webhook` and copy the printed
   `whsec_…` into the local function secret.

## Deployment order

1. Push the migration (`017_stripe_billing.sql`).
2. Create Products/Prices and the webhook endpoint in Stripe (Test).
3. Set the Edge Function secrets listed above.
4. Deploy the four Edge Functions: `supabase functions deploy
   stripe-create-checkout-session stripe-customer-portal
   stripe-get-subscription stripe-webhook`.
5. Deploy the frontend.
6. Smoke test with Stripe test cards, then enable live keys.

## Security model

- No secret keys in frontend code, `VITE_*` variables, or git.
- User-facing Edge Functions authenticate with the caller's JWT.
- The webhook authenticates with the Stripe signature only.
- Users cannot self-upgrade, change status, or edit customer/trial/
  period fields (RLS + trigger).
- Price IDs are resolved server-side; the client sends only tier and
  interval.
- Checkout/Portal customer IDs always come from the authenticated
  user's own record.
- On any sync failure the frontend fails safely to FREE.
