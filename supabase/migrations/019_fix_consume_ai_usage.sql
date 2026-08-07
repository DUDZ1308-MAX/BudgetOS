-- ============================================================
-- BudgetOS: Fix consume_ai_usage column ambiguity
-- Migration 019
--
-- The 018 version of consume_ai_usage() fails at runtime with
-- ERROR 42702 "column reference \"request_count\" is ambiguous":
-- the RETURNS TABLE output columns (allowed, request_count,
-- request_limit, tier) are exposed as PL/pgSQL variables, which
-- collide with the ai_usage table columns of the same name in the
-- guarded UPDATE / WHERE / RETURNING clauses.
--
-- This migration replaces the function body with table-qualified
-- references so the guarded atomic check-and-increment works.
-- No schema objects are dropped and no data is touched; the table,
-- RLS, and grants are unchanged.
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
  -- Table columns are fully qualified to avoid colliding with the
  -- RETURNS TABLE output variables (allowed, request_count, ...).
  update public.ai_usage u
     set request_count = u.request_count + 1,
         updated_at = now()
   where u.user_id = p_user_id
     and u.usage_month = v_month
     and u.request_count < v_limit
  returning u.request_count into v_count;

  if v_count is null then
    select u.request_count into v_count
      from public.ai_usage u
     where u.user_id = p_user_id
       and u.usage_month = v_month;
    return query
      select false, coalesce(v_count, v_limit), v_limit, v_tier;
  end if;

  return query select true, v_count, v_limit, v_tier;
end;
$$;
