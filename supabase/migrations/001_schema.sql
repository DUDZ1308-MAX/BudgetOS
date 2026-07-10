-- ============================================
-- BudgetOS Production Schema + RLS Pack
-- ============================================

-- =========================
-- ACCOUNTS TABLE
-- =========================
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking','savings','credit','loan','investment','cash')),
  balance numeric default 0,
  currency text default 'USD',
  is_active boolean default true,
  created_at timestamp default now()
);

alter table public.accounts enable row level security;

drop policy if exists "accounts_select" on public.accounts;
create policy "accounts_select" on public.accounts for select using (auth.uid() = user_id);
drop policy if exists "accounts_insert" on public.accounts;
create policy "accounts_insert" on public.accounts for insert with check (auth.uid() = user_id);
drop policy if exists "accounts_update" on public.accounts;
create policy "accounts_update" on public.accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "accounts_delete" on public.accounts;
create policy "accounts_delete" on public.accounts for delete using (auth.uid() = user_id);

-- =========================
-- CATEGORIES TABLE
-- =========================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  icon text,
  color text,
  is_system boolean default false,
  is_archived boolean default false,
  created_at timestamp default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories_all" on public.categories;
create policy "categories_all" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- TRANSACTIONS TABLE
-- =========================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric not null,
  date timestamp not null default now(),
  merchant text,
  note text,
  is_archived boolean default false,
  created_at timestamp default now()
);

alter table public.transactions enable row level security;

drop policy if exists "transactions_all" on public.transactions;
create policy "transactions_all" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- BUDGETS TABLE
-- =========================
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id),
  year int not null,
  month int not null,
  amount numeric not null,
  rollover boolean default false,
  created_at timestamp default now()
);

alter table public.budgets enable row level security;

drop policy if exists "budgets_all" on public.budgets;
create policy "budgets_all" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- SAVINGS GOALS
-- =========================
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  target_date date,
  priority int default 3,
  status text default 'active',
  created_at timestamp default now()
);

alter table public.savings_goals enable row level security;

drop policy if exists "savings_goals_all" on public.savings_goals;
create policy "savings_goals_all" on public.savings_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- MORTGAGES
-- =========================
create table if not exists public.mortgages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  principal numeric not null,
  annual_rate numeric not null,
  term_years int not null,
  start_date date,
  extra_payment numeric default 0,
  is_active boolean default true,
  created_at timestamp default now()
);

alter table public.mortgages enable row level security;

drop policy if exists "mortgages_all" on public.mortgages;
create policy "mortgages_all" on public.mortgages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- COACH MESSAGES
-- =========================
create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text,
  title text,
  message text,
  category text,
  is_read boolean default false,
  is_dismissed boolean default false,
  created_at timestamp default now()
);

alter table public.coach_messages enable row level security;

drop policy if exists "coach_messages_all" on public.coach_messages;
create policy "coach_messages_all" on public.coach_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- INDEXES (PERFORMANCE)
-- =========================
create index if not exists idx_transactions_user_date on public.transactions(user_id, date);
create index if not exists idx_accounts_user on public.accounts(user_id);
create index if not exists idx_budgets_user_year_month on public.budgets(user_id, year, month);
