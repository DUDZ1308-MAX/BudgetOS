-- Migration 015: Planning scenarios persistence
-- Purpose: Store user-created financial planning scenarios in Supabase.
-- Strategy: Follows notifications pattern (014_notifications.sql).

-- ============================================================================
-- 1. Create scenarios table
-- ============================================================================
create table if not exists public.planning_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  adjustments jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  is_preset boolean not null default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- ============================================================================
-- 2. Enable Row Level Security
-- ============================================================================
alter table public.planning_scenarios enable row level security;

-- ============================================================================
-- 3. RLS Policies — users can only access their own scenarios
-- ============================================================================
drop policy if exists "scenarios_select" on public.planning_scenarios;
create policy "scenarios_select" on public.planning_scenarios
  for select using (auth.uid() = user_id);

drop policy if exists "scenarios_insert" on public.planning_scenarios;
create policy "scenarios_insert" on public.planning_scenarios
  for insert with check (auth.uid() = user_id);

drop policy if exists "scenarios_update" on public.planning_scenarios;
create policy "scenarios_update" on public.planning_scenarios
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "scenarios_delete" on public.planning_scenarios;
create policy "scenarios_delete" on public.planning_scenarios
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- 4. Indexes
-- ============================================================================
create index if not exists idx_scenarios_user on public.planning_scenarios(user_id);
create index if not exists idx_scenarios_user_active on public.planning_scenarios(user_id, is_active) where is_active = true;

-- ============================================================================
-- 5. updated_at trigger
-- ============================================================================
drop trigger if exists set_scenarios_updated_at on public.planning_scenarios;
create trigger set_scenarios_updated_at
  before update on public.planning_scenarios
  for each row execute function public.set_updated_at();
