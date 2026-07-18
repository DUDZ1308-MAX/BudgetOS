-- ============================================================
-- BudgetOS: Schema Reconciliation Migration
-- Aligns production DB with codebase expectations
-- All profile operations wrapped: table may not exist yet
-- ============================================================

-- 1. Fix profiles: add full_name column (production has display_name)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
    UPDATE public.profiles SET full_name = display_name WHERE full_name IS NULL AND display_name IS NOT NULL;
  END IF;
END $$;

-- 2. Fix profiles: update trigger to use full_name
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

-- 3. Fix transactions: add note column (production may have description)
-- ============================================================
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note text;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'description'
  ) THEN
    UPDATE public.transactions SET note = description WHERE note IS NULL AND description IS NOT NULL;
  END IF;
END $$;

-- 4. Fix transactions: add is_archived column (missing in production)
-- ============================================================
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_archived boolean not null default false;

-- 5. Fix transactions: add recurring_id column (missing in production)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'recurring_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN recurring_id uuid references public.recurring_transactions(id) on delete set null;
  END IF;
END $$;

-- 6. Fix accounts: update CHECK constraint to accept both 'credit' and 'credit_card'
-- ============================================================
DO $$
BEGIN
  ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
  ALTER TABLE public.accounts ADD CONSTRAINT accounts_type_check
    CHECK (type IN ('checking', 'savings', 'credit', 'credit_card', 'loan', 'investment', 'cash', 'other'));
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 7. Fix categories: add is_archived if missing
-- ============================================================
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_archived boolean not null default false;

-- 8. Recreate indexes for new columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON public.transactions(recurring_id);
