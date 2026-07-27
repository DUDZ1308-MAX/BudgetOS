-- Migration 014: Notifications table with RLS
-- Purpose: Persist notifications in Supabase (replacing localStorage-only storage).
-- Strategy: Follows feedback table pattern (004_feedback.sql).

-- ============================================================================
-- 1. Create notifications table
-- ============================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null check (category in (
    'budget', 'savings', 'mortgage', 'spending', 'cashflow',
    'system', 'achievement', 'milestone'
  )),
  priority text not null default 'medium' check (priority in (
    'critical', 'high', 'medium', 'low'
  )),
  icon text,
  is_read boolean not null default false,
  is_archived boolean not null default false,
  metadata jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- ============================================================================
-- 2. Enable Row Level Security
-- ============================================================================
alter table public.notifications enable row level security;

-- ============================================================================
-- 3. RLS Policies — users can only access their own notifications
-- ============================================================================
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications
  for insert with check (auth.uid() = user_id);

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications_delete" on public.notifications;
create policy "notifications_delete" on public.notifications
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- 4. Indexes for common queries
-- ============================================================================
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read) where is_read = false;
create index if not exists idx_notifications_user_category on public.notifications(user_id, category);
create index if not exists idx_notifications_user_archived on public.notifications(user_id, is_archived) where is_archived = false;
create index if not exists idx_notifications_created on public.notifications(user_id, created_at desc);

-- ============================================================================
-- 5. updated_at trigger
-- ============================================================================
drop trigger if exists set_notifications_updated_at on public.notifications;
create trigger set_notifications_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();
