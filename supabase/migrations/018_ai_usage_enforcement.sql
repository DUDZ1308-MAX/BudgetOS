-- ============================================================
-- BudgetOS: AI Usage Enforcement
-- Migration 018
--
-- Server-authoritative, atomic monthly AI usage accounting for the
-- ai-gateway Edge Function.
--
-- Security model:
--   - RLS allows authenticated users to SELECT only their own row.
--   - No user INSERT/UPDATE/DELETE policies exist: usage can never be
--     reset, fabricated, or inflated from the browser.
--   - Writes flow only through the service-role Edge Function path
--     (RLS-bypassing) or the security-definer RPCs below.
--
-- Atomicity:
--   consume_ai_usage() resolves the subscription tier, computes the
--   plan limit, then check-and-increments in ONE guarded UPDATE
--   ... RETURNING (request_count < limit). Concurrent requests
--   serialize on the row lock, so two parallel requests can never
--   both pass a limit of N and push usage past N.
--
-- Limit source of truth:
--   The tier -> limit mapping (free 5 / pro 200 / premium 1000)
--   mirrors apps/web/src/billing/planMatrix.ts (feature
--   'ai_copilot'). Keep both in sync when plan limits change.
-- ============================================================

-- ============================================================
-- 1. ai_usage
-- ============================================================
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_month text not null,             -- 'YYYY-MM' (UTC)
  request_count integer not null default 0,
  total_tokens integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint ai_usage_pkey primary key (user_id, usage_month)
);

alter table public.ai_usage enable row level security;

-- Authenticated users may read their own authoritative usage for
-- display, but can never write it.
do $$ begin
  create policy "ai_usage_select_own"
    on public.ai_usage
    for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

create index if not exists idx_ai_usage_usage_month
  on public.ai_usage (usage_month);

-- ============================================================
-- 2. Limit mapping (mirrors planMatrix.ts 'ai_copilot')
-- ============================================================
create or replace function public.ai_limit_for_tier(p_tier text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case coalesce(p_tier, '')
    when 'premium' then 1000
    when 'pro' then 200
    else 5
  end;
$$;

-- ============================================================
-- 3. Atomic check-and-increment
-- ============================================================
create or replace function public.consume_ai_usage(p_user_id uuid)
returns table (allowed boolean, request_count integer, request_limit integer, tier text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month text := to_char(now(), 'YYYY-MM');
  v_tier text;
  v_limit integer;
  v_count integer;
begin
  -- Server-authoritative tier from user_subscriptions. A missing or
  -- unreadable subscription row resolves to FREE (fail closed): a
  -- lookup failure must never grant a paid limit.
  select s.tier into v_tier
    from public.user_subscriptions s
   where s.user_id = p_user_id;

  v_tier := coalesce(v_tier, 'free');
  v_limit := public.ai_limit_for_tier(v_tier);

  insert into public.ai_usage (user_id, usage_month)
  values (p_user_id, v_month)
  on conflict (user_id, usage_month) do nothing;

  -- Atomic: the guard and the increment are a single statement.
  update public.ai_usage
     set request_count = request_count + 1,
         updated_at = now()
   where user_id = p_user_id
     and usage_month = v_month
     and request_count < v_limit
  returning request_count into v_count;

  if v_count is null then
    select request_count into v_count
      from public.ai_usage
     where user_id = p_user_id
       and usage_month = v_month;
    return query
      select false, coalesce(v_count, v_limit), v_limit, v_tier;
  end if;

  return query select true, v_count, v_limit, v_tier;
end;
$$;

-- ============================================================
-- 4. Best-effort post-call token accounting (non-authoritative
--    for limits; informational only)
-- ============================================================
create or replace function public.add_ai_usage_tokens(p_user_id uuid, p_tokens integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tokens is null or p_tokens <= 0 then
    return;
  end if;
  update public.ai_usage
     set total_tokens = total_tokens + p_tokens,
         updated_at = now()
   where user_id = p_user_id
     and usage_month = to_char(now(), 'YYYY-MM');
end;
$$;

-- ============================================================
-- 5. Access control: only the service role (ai-gateway Edge
--    Function) may execute these functions.
-- ============================================================
revoke all on function public.consume_ai_usage(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_usage(uuid) to service_role;

revoke all on function public.add_ai_usage_tokens(uuid, integer) from public, anon, authenticated;
grant execute on function public.add_ai_usage_tokens(uuid, integer) to service_role;

revoke all on function public.ai_limit_for_tier(text) from public, anon, authenticated;
grant execute on function public.ai_limit_for_tier(text) to service_role;
