-- ============================================
-- BudgetOS Recurring Transactions Schema
-- ============================================

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  name text not null,
  description text,
  amount numeric not null,
  frequency text not null check (frequency in ('one_time', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annual', 'yearly')),
  interval_count int default 1,
  day_of_week int,
  day_of_month int,
  month_of_year int,
  start_date date not null,
  end_date date,
  next_run date not null,
  last_run date,
  auto_post boolean default true,
  reminder_type text check (reminder_type in ('today', 'day_before', 'three_days_before', 'week_before')),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table public.recurring_transactions enable row level security;

drop policy if exists "recurring_transactions_select" on public.recurring_transactions;
create policy "recurring_transactions_select" on public.recurring_transactions
  for select using (auth.uid() = user_id);

drop policy if exists "recurring_transactions_insert" on public.recurring_transactions;
create policy "recurring_transactions_insert" on public.recurring_transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "recurring_transactions_update" on public.recurring_transactions;
create policy "recurring_transactions_update" on public.recurring_transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recurring_transactions_delete" on public.recurring_transactions;
create policy "recurring_transactions_delete" on public.recurring_transactions
  for delete using (auth.uid() = user_id);

-- Add recurring_id to transactions for badge linking
alter table public.transactions add column if not exists recurring_id uuid references public.recurring_transactions(id) on delete set null;

create index if not exists idx_recurring_transactions_user on public.recurring_transactions(user_id);
create index if not exists idx_recurring_transactions_next_run on public.recurring_transactions(next_run);
create index if not exists idx_recurring_transactions_status on public.recurring_transactions(status);
create index if not exists idx_transactions_recurring on public.transactions(recurring_id);

-- updated_at trigger (matches pattern from 002_schema_v2)
drop trigger if exists set_recurring_transactions_updated_at on public.recurring_transactions;
create trigger set_recurring_transactions_updated_at
  before update on public.recurring_transactions
  for each row execute function public.set_updated_at();
