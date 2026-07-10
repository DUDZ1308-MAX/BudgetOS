-- ============================================================
-- BudgetOS: Schema v2 — Profiles, Contributions, Extra Payments,
-- Report Preferences, updated_at triggers
-- ============================================================

-- 0. Profiles (one-to-one with auth.users)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  locale text not null default 'en-US',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete" on public.profiles
  for delete using (auth.uid() = id);

-- 1. Contributions (child of savings_goals)
-- ============================================================

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  amount numeric not null check (amount > 0),
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contributions enable row level security;

drop policy if exists "contributions_select" on public.contributions;
create policy "contributions_select" on public.contributions
  for select using (auth.uid() = user_id);

drop policy if exists "contributions_insert" on public.contributions;
create policy "contributions_insert" on public.contributions
  for insert with check (auth.uid() = user_id);

drop policy if exists "contributions_update" on public.contributions;
create policy "contributions_update" on public.contributions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "contributions_delete" on public.contributions;
create policy "contributions_delete" on public.contributions
  for delete using (auth.uid() = user_id);

-- 2. Extra Payments (child of mortgages)
-- ============================================================

create table if not exists public.extra_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mortgage_id uuid not null references public.mortgages(id) on delete cascade,
  amount numeric not null check (amount > 0),
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.extra_payments enable row level security;

drop policy if exists "extra_payments_select" on public.extra_payments;
create policy "extra_payments_select" on public.extra_payments
  for select using (auth.uid() = user_id);

drop policy if exists "extra_payments_insert" on public.extra_payments;
create policy "extra_payments_insert" on public.extra_payments
  for insert with check (auth.uid() = user_id);

drop policy if exists "extra_payments_update" on public.extra_payments;
create policy "extra_payments_update" on public.extra_payments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "extra_payments_delete" on public.extra_payments;
create policy "extra_payments_delete" on public.extra_payments
  for delete using (auth.uid() = user_id);

-- 3. Report Preferences
-- ============================================================

create table if not exists public.report_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  default_date_range text not null default 'this_month',
  show_comparison boolean not null default true,
  show_forecast boolean not null default false,
  group_by_category boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.report_preferences enable row level security;

drop policy if exists "report_preferences_select" on public.report_preferences;
create policy "report_preferences_select" on public.report_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "report_preferences_insert" on public.report_preferences;
create policy "report_preferences_insert" on public.report_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "report_preferences_update" on public.report_preferences;
create policy "report_preferences_update" on public.report_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "report_preferences_delete" on public.report_preferences;
create policy "report_preferences_delete" on public.report_preferences
  for delete using (auth.uid() = user_id);

-- 4. Add updated_at to existing tables (migration helper)
-- ============================================================

alter table if exists public.accounts
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.categories
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.transactions
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.budgets
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.savings_goals
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.mortgages
  add column if not exists updated_at timestamptz not null default now();

-- 5. updated_at triggers for all tables
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  tables text[] := array['profiles', 'accounts', 'categories', 'transactions', 'budgets', 'savings_goals', 'mortgages', 'contributions', 'extra_payments', 'report_preferences'];
  t text;
begin
  foreach t in array tables
  loop
    execute format(
      'drop trigger if exists set_%s_updated_at on public.%I',
      replace(t, '_', '_'), t
    );
    execute format(
      'create trigger set_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      replace(t, '_', '_'), t
    );
  end loop;
end;
$$;

-- 6. Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Indexes
-- ============================================================

create index if not exists idx_contributions_goal on public.contributions(goal_id);
create index if not exists idx_contributions_user on public.contributions(user_id);
create index if not exists idx_extra_payments_mortgage on public.extra_payments(mortgage_id);
create index if not exists idx_extra_payments_user on public.extra_payments(user_id);
create index if not exists idx_report_preferences_user on public.report_preferences(user_id);
