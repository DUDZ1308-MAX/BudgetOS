-- ============================================================
-- BudgetOS: Initial Schema
-- Migration 001
-- ============================================================

-- 0. Enums
-- ============================================================

do $$ begin
  create type account_type as enum (
    'checking', 'savings', 'credit', 'loan', 'investment', 'cash'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type category_type as enum (
    'income', 'expense'
  );
exception when duplicate_object then null;
end $$;

-- 1. Profiles
-- ============================================================
-- One-to-one with auth.users. Created automatically on signup.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  locale text not null default 'en-US',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Accounts
-- ============================================================

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type account_type not null,
  starting_balance numeric(12,2) not null default 0.00,
  current_balance numeric(12,2) not null default 0.00,
  currency text not null default 'USD',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_user_account_name unique (user_id, name)
);

-- 3. Categories
-- ============================================================
-- user_id is nullable for system categories.
-- System categories are shared across all users.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  type category_type not null,
  icon text,
  color text,
  is_system boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. Transactions
-- ============================================================

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(12,2) not null,
  transaction_date date not null,
  merchant text,
  note text,
  recurring boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_transactions_user_date
  on public.transactions(user_id, transaction_date desc);

create index if not exists idx_transactions_account
  on public.transactions(account_id);

create index if not exists idx_transactions_category
  on public.transactions(category_id);

create index if not exists idx_accounts_user
  on public.accounts(user_id);

create index if not exists idx_categories_user
  on public.categories(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Accounts
create policy "Users can view own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own accounts"
  on public.accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own archived accounts"
  on public.accounts for delete
  using (auth.uid() = user_id and not is_active);

-- Categories
-- System categories (user_id is null) are visible to everyone.
-- User-created categories are only visible to that user.

create policy "Users can view own and system categories"
  on public.categories for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own archived categories"
  on public.categories for delete
  using (auth.uid() = user_id and archived);

-- Transactions
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own archived transactions"
  on public.transactions for delete
  using (auth.uid() = user_id and archived);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create profile on user signup

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on profiles

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger set_accounts_updated_at
  before update on public.accounts
  for each row execute function public.update_updated_at_column();

create trigger set_transactions_updated_at
  before update on public.transactions
  for each row execute function public.update_updated_at_column();

-- Auto-update account current_balance on transaction changes

create or replace function public.recalculate_account_balance()
returns trigger as $$
begin
  -- INSERT: add amount to account balance
  if tg_op = 'INSERT' then
    update public.accounts
    set current_balance = current_balance + new.amount
    where id = new.account_id;
    return new;
  end if;

  -- DELETE: subtract old amount from account balance
  if tg_op = 'DELETE' then
    update public.accounts
    set current_balance = current_balance - old.amount
    where id = old.account_id;
    return old;
  end if;

  -- UPDATE: replace old amount with new amount
  if tg_op = 'UPDATE' then
    -- If account changed, move from old account to new account
    if old.account_id is distinct from new.account_id then
      update public.accounts
      set current_balance = current_balance - old.amount
      where id = old.account_id;

      update public.accounts
      set current_balance = current_balance + new.amount
      where id = new.account_id;
    else
      -- Same account: net the difference
      update public.accounts
      set current_balance = current_balance - old.amount + new.amount
      where id = new.account_id;
    end if;
    return new;
  end if;

  return null;
end;
$$ language plpgsql security definer;

create trigger on_transaction_insert
  after insert on public.transactions
  for each row execute function public.recalculate_account_balance();

create trigger on_transaction_update
  after update on public.transactions
  for each row execute function public.recalculate_account_balance();

create trigger on_transaction_delete
  after delete on public.transactions
  for each row execute function public.recalculate_account_balance();

-- ============================================================
-- Seed: System Categories
-- ============================================================

insert into public.categories (name, type, icon, is_system) values
  ('Salary', 'income', 'briefcase', true),
  ('Freelance', 'income', 'laptop', true),
  ('Interest', 'income', 'trending-up', true),
  ('Refund', 'income', 'rotate-ccw', true),
  ('Gift', 'income', 'gift', true),
  ('Other Income', 'income', 'plus-circle', true),
  ('Housing', 'expense', 'home', true),
  ('Mortgage', 'expense', 'home', true),
  ('Rent', 'expense', 'key', true),
  ('Utilities', 'expense', 'zap', true),
  ('Groceries', 'expense', 'shopping-cart', true),
  ('Dining', 'expense', 'coffee', true),
  ('Transportation', 'expense', 'car', true),
  ('Insurance', 'expense', 'shield', true),
  ('Healthcare', 'expense', 'heart', true),
  ('Entertainment', 'expense', 'film', true),
  ('Shopping', 'expense', 'shopping-bag', true),
  ('Education', 'expense', 'book', true),
  ('Travel', 'expense', 'plane', true),
  ('Debt Payment', 'expense', 'credit-card', true),
  ('Savings', 'expense', 'piggy-bank', true),
  ('Personal Care', 'expense', 'smile', true),
  ('Taxes', 'expense', 'file-text', true),
  ('Other', 'expense', 'more-horizontal', true)
on conflict do nothing;
