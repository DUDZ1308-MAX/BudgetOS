-- ============================================================
-- BudgetOS: Stripe Billing
-- Migration 017
--
-- Adds server-authoritative subscription entitlements backed
-- by Stripe (test mode during implementation).
--
-- Tables:
--   public.user_subscriptions  - one entitlement row per user
--   public.webhook_events      - Stripe webhook idempotency log
--
-- Security model:
--   - RLS allows authenticated users to SELECT only their own row.
--   - No public INSERT/UPDATE/DELETE policies exist.
--   - The stripe-webhook Edge Function writes via the service role
--     (bypasses RLS). A defense-in-depth trigger rejects any
--     authenticated (user-JWT) update that touches entitlement
--     columns, so the browser can never self-upgrade.
-- ============================================================

-- ============================================================
-- 1. user_subscriptions
-- ============================================================
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'active',
  tier text not null default 'free',
  interval text not null default 'month',
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  stripe_price_id text,
  -- Stripe event timestamp (unix seconds) of the last applied event.
  -- Used to reject out-of-order webhook deliveries.
  last_stripe_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One active entitlement per user.
  constraint user_subscriptions_user_id_key unique (user_id),
  constraint user_subscriptions_stripe_customer_id_key unique (stripe_customer_id),
  constraint user_subscriptions_stripe_subscription_id_key unique (stripe_subscription_id),

  constraint user_subscriptions_tier_check check (tier in ('free', 'pro', 'premium')),
  constraint user_subscriptions_interval_check check (interval in ('month', 'year')),
  constraint user_subscriptions_status_check check (
    status in (
      'active',
      'trialing',
      'past_due',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'unpaid'
    )
  )
);

alter table public.user_subscriptions enable row level security;

-- Authenticated users may read only their own entitlement.
do $$ begin
  create policy "user_subscriptions_select_own"
    on public.user_subscriptions
    for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- No insert/update/delete policies: users cannot create, mutate, or
-- delete entitlement rows. Trusted writes flow through the service
-- role from Edge Functions (RLS-bypassing).

-- Defense-in-depth: reject authenticated updates to entitlement columns.
create or replace function public.guard_subscription_entitlement()
returns trigger as $$
begin
  if auth.uid() is not null and (
    new.user_id is distinct from old.user_id
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    or new.status is distinct from old.status
    or new.tier is distinct from old.tier
    or new.interval is distinct from old.interval
    or new.trial_start is distinct from old.trial_start
    or new.trial_end is distinct from old.trial_end
    or new.current_period_start is distinct from old.current_period_start
    or new.current_period_end is distinct from old.current_period_end
    or new.cancel_at_period_end is distinct from old.cancel_at_period_end
    or new.canceled_at is distinct from old.canceled_at
    or new.stripe_price_id is distinct from old.stripe_price_id
    or new.last_stripe_event_at is distinct from old.last_stripe_event_at
  ) then
    raise exception 'Not permitted to modify subscription entitlement fields';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists guard_user_subscriptions_entitlement on public.user_subscriptions;
create trigger guard_user_subscriptions_entitlement
  before update on public.user_subscriptions
  for each row execute function public.guard_subscription_entitlement();

-- Defense-in-depth: force user_id = auth.uid() on insert from a
-- user-authenticated context (blocked by RLS anyway; belt and braces).
create or replace function public.force_user_subscription_owner()
returns trigger as $$
begin
  if auth.uid() is not null then
    new.user_id = auth.uid();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists force_user_subscriptions_owner on public.user_subscriptions;
create trigger force_user_subscriptions_owner
  before insert on public.user_subscriptions
  for each row execute function public.force_user_subscription_owner();

-- updated_at maintenance (existing project convention).
drop trigger if exists set_user_subscriptions_updated_at on public.user_subscriptions;
create trigger set_user_subscriptions_updated_at
  before update on public.user_subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. webhook_events (Stripe webhook idempotency)
-- ============================================================
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- No public access at all: only the service role (stripe-webhook Edge
-- Function) reads and writes this table.
alter table public.webhook_events enable row level security;

-- ============================================================
-- 3. Indexes
-- ============================================================
create index if not exists idx_user_subscriptions_status
  on public.user_subscriptions (status);

create index if not exists idx_user_subscriptions_tier
  on public.user_subscriptions (tier);

create index if not exists idx_webhook_events_event_type
  on public.webhook_events (event_type);
