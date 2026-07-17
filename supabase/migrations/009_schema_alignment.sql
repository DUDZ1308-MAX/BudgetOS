-- ============================================================
-- BudgetOS: Schema Alignment Migration
-- Migration 009
--
-- Purpose: Add all columns/tables/views that the frontend code
-- expects but are missing from migrations 001-008. This aligns
-- the production database with database.types.ts and the API layer.
--
-- Strategy: SAFE, NON-DESTRUCTIVE
--   - All ALTERs use ADD COLUMN IF NOT EXISTS
--   - All CREATEs use IF NOT EXISTS
--   - Data is backfilled BEFORE adding NOT NULL constraints
--   - No columns or tables are dropped
-- ============================================================

-- ============================================================
-- 1. PROFILES — ensure table exists with all expected columns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  avatar_url text,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  locale text not null default 'en-US',
  onboarding_complete boolean not null default false,
  onboarding_completed boolean not null default false,
  theme_preference text default 'mybudgetos-dark',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean not null default false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference text default 'mybudgetos-dark';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale text not null default 'en-US';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill: create profiles for any auth.users without one
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT id,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  raw_user_meta_data ->> 'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Ensure handle_new_user trigger exists (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. ACCOUNTS — add missing columns
-- ============================================================
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS institution text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS include_in_net_worth boolean not null default true;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS sort_order int not null default 0;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();

-- ============================================================
-- 3. CATEGORIES — add missing columns
-- ============================================================
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order int not null default 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();

-- ============================================================
-- 4. TRANSACTIONS — add missing columns
-- ============================================================
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency text default 'USD';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_recurring boolean not null default false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_pending boolean not null default false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_archived boolean not null default false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note text;

-- Ensure recurring_id column exists (from migration 003)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'recurring_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN recurring_id uuid references public.recurring_transactions(id) on delete set null;
  END IF;
END $$;

-- ============================================================
-- 5. BUDGETS — add month_key and rollover_enabled
-- ============================================================
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS month_key text;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS rollover_enabled boolean not null default false;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();

-- Backfill month_key from year/month
UPDATE public.budgets
SET month_key = year || '-' || lpad(month::text, 2, '0')
WHERE month_key IS NULL;

ALTER TABLE public.budgets ALTER COLUMN month_key SET NOT NULL;

-- Add unique constraint to prevent duplicates (idempotent)
DO $$ BEGIN
  ALTER TABLE public.budgets ADD CONSTRAINT budgets_user_category_month_unique
    UNIQUE (user_id, category_id, month_key);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill rollover_enabled from rollover
UPDATE public.budgets SET rollover_enabled = true WHERE rollover = true AND rollover_enabled = false;

-- ============================================================
-- 6. SAVINGS_GOALS — add missing columns
-- ============================================================
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS monthly_contribution numeric not null default 0;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS category_id uuid references public.categories(id);
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS is_completed boolean not null default false;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS sort_order int not null default 0;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();
-- Ensure priority and status exist (from migration 001)
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS priority int default 3;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS status text default 'active';

-- ============================================================
-- 7. MORTGAGES — add extra_payments jsonb + migration 005 columns
-- ============================================================
ALTER TABLE public.mortgages ADD COLUMN IF NOT EXISTS extra_payments jsonb not null default '[]'::jsonb;
ALTER TABLE public.mortgages ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();
-- Ensure migration 005 columns exist
ALTER TABLE public.mortgages ADD COLUMN IF NOT EXISTS payment_frequency text not null default 'monthly';
ALTER TABLE public.mortgages ADD COLUMN IF NOT EXISTS amortization_years int;
ALTER TABLE public.mortgages ADD COLUMN IF NOT EXISTS compound_semi_annual boolean not null default true;
ALTER TABLE public.mortgages ADD COLUMN IF NOT EXISTS down_payment numeric default 0;
ALTER TABLE public.mortgages ADD COLUMN IF NOT EXISTS purchase_price numeric;

-- Backfill amortization_years = term_years where missing
UPDATE public.mortgages SET amortization_years = term_years WHERE amortization_years IS NULL;

-- Make amortization_years NOT NULL after backfill
ALTER TABLE public.mortgages ALTER COLUMN amortization_years SET NOT NULL;

-- Backfill extra_payments from extra_payment (numeric → jsonb)
UPDATE public.mortgages
SET extra_payments = jsonb_build_array(
  jsonb_build_object('type', 'monthly_fixed', 'amount', extra_payment)
)
WHERE extra_payment > 0
  AND (extra_payments = '[]'::jsonb OR extra_payments IS NULL);

-- ============================================================
-- 8. COACH_MESSAGES — add missing columns
-- ============================================================
ALTER TABLE public.coach_messages ADD COLUMN IF NOT EXISTS priority int not null default 3;
ALTER TABLE public.coach_messages ADD COLUMN IF NOT EXISTS deduplication_key text not null default '';

-- ============================================================
-- 9. Create savings_contributions view
-- (code queries 'savings_contributions' but table is 'contributions')
-- ============================================================
CREATE OR REPLACE VIEW public.savings_contributions AS
SELECT
  id,
  user_id,
  goal_id,
  amount,
  date,
  notes,
  created_at,
  updated_at
FROM public.contributions;

-- ============================================================
-- 10. Create amortization_cache table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.amortization_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mortgage_id uuid not null references public.mortgages(id) on delete cascade,
  month int not null,
  date text not null,
  payment numeric not null,
  principal numeric not null,
  interest numeric not null,
  total_interest_to_date numeric not null,
  remaining_balance numeric not null,
  extra_payment numeric default 0,
  created_at timestamptz not null default now()
);

ALTER TABLE public.amortization_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "amortization_cache_all" ON public.amortization_cache
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_amortization_cache_mortgage ON public.amortization_cache(mortgage_id);

-- ============================================================
-- 11. Create financial_health_scores table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_health_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_key text not null,
  overall_score numeric not null,
  tier text not null,
  components jsonb not null default '{}'::jsonb,
  recommendations text[] default '{}',
  snapshot_date text not null,
  created_at timestamptz not null default now()
);

ALTER TABLE public.financial_health_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "financial_health_scores_all" ON public.financial_health_scores
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_health_scores_user ON public.financial_health_scores(user_id);

-- ============================================================
-- 12. Create allocator_configs table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.allocator_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  priorities text[] default '{}',
  custom_rules jsonb[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.allocator_configs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "allocator_configs_all" ON public.allocator_configs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 13. Ensure set_updated_at function exists
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- 14. Ensure updated_at triggers on all tables
-- ============================================================
DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
  CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_accounts_updated_at ON public.accounts;
  CREATE TRIGGER set_accounts_updated_at BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
  CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_transactions_updated_at ON public.transactions;
  CREATE TRIGGER set_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_budgets_updated_at ON public.budgets;
  CREATE TRIGGER set_budgets_updated_at BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_savings_goals_updated_at ON public.savings_goals;
  CREATE TRIGGER set_savings_goals_updated_at BEFORE UPDATE ON public.savings_goals
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_mortgages_updated_at ON public.mortgages;
  CREATE TRIGGER set_mortgages_updated_at BEFORE UPDATE ON public.mortgages
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_allocator_configs_updated_at ON public.allocator_configs;
  CREATE TRIGGER set_allocator_configs_updated_at BEFORE UPDATE ON public.allocator_configs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 15. Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_budgets_month_key ON public.budgets(month_key);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month_key ON public.budgets(user_id, month_key);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON public.transactions(recurring_id);
