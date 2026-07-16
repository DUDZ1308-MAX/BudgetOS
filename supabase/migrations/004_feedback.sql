-- ============================================
-- BudgetOS User Feedback Schema
-- ============================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('bug', 'feature', 'general')),
  title text not null,
  message text not null,
  email text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  admin_notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table public.feedback enable row level security;

drop policy if exists "feedback_select" on public.feedback;
create policy "feedback_select" on public.feedback
  for select using (auth.uid() = user_id);

drop policy if exists "feedback_insert" on public.feedback;
create policy "feedback_insert" on public.feedback
  for insert with check (auth.uid() = user_id);

drop policy if exists "feedback_update" on public.feedback;
create policy "feedback_update" on public.feedback
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "feedback_delete" on public.feedback;
create policy "feedback_delete" on public.feedback
  for delete using (auth.uid() = user_id);

create index if not exists idx_feedback_user on public.feedback(user_id);
create index if not exists idx_feedback_type on public.feedback(type);
create index if not exists idx_feedback_status on public.feedback(status);
create index if not exists idx_feedback_created on public.feedback(created_at desc);

-- updated_at trigger
drop trigger if exists set_feedback_updated_at on public.feedback;
create trigger set_feedback_updated_at
  before update on public.feedback
  for each row execute function public.set_updated_at();
