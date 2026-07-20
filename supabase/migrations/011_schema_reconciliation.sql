-- Migration 011: Schema Reconciliation
-- Purpose: Align production schema with database.types.ts and application code.
-- Strategy: Safe, additive changes only. All ADD COLUMN IF NOT EXISTS, all
--           CHECK constraints use DROP IF EXISTS + ADD to handle re-application.

-- ============================================================================
-- 1. categories.type CHECK: expand to include 'transfer' and 'saving'
-- ============================================================================
-- Migration 001 created: CHECK (type IN ('income', 'expense'))
-- Code defines: CategoryType = 'income' | 'expense' | 'transfer' | 'saving'
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_type_check;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_type_check
  CHECK (type IN ('income', 'expense', 'transfer', 'saving'));

-- ============================================================================
-- 2. recurring_transactions.frequency CHECK: add 'semimonthly'
-- ============================================================================
-- Migration 003 created: CHECK (frequency IN ('one_time','daily','weekly','biweekly','monthly','quarterly','semi_annual','yearly'))
-- Code defines: 'semimonthly' as a valid frequency in types.ts, schemas.ts, enums
ALTER TABLE public.recurring_transactions
  DROP CONSTRAINT IF EXISTS recurring_transactions_frequency_check;

ALTER TABLE public.recurring_transactions
  ADD CONSTRAINT recurring_transactions_frequency_check
  CHECK (frequency IN (
    'one_time', 'daily', 'weekly', 'biweekly', 'semimonthly',
    'monthly', 'quarterly', 'semi_annual', 'yearly'
  ));

-- ============================================================================
-- 3. Backfill budgets.category_id NULLs, then set NOT NULL
-- ============================================================================
-- database.types.ts requires category_id: string (non-nullable)
-- DB currently allows NULL
UPDATE public.budgets
SET category_id = (
  SELECT id FROM public.categories
  WHERE user_id = budgets.user_id
  LIMIT 1
)
WHERE category_id IS NULL;

-- If any budgets still have NULL category_id (no categories for that user), delete them
DELETE FROM public.budgets WHERE category_id IS NULL;

ALTER TABLE public.budgets
  ALTER COLUMN category_id SET NOT NULL;

-- ============================================================================
-- 4. Expand accounts.type CHECK to include all code-defined values
-- ============================================================================
-- Migration 008 expanded to include 'credit_card' and 'other'
-- Ensure the full set matches database.types.ts
ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_type_check;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_type_check
  CHECK (type IN (
    'checking', 'savings', 'credit', 'loan', 'investment', 'cash',
    'credit_card', 'other'
  ));

-- ============================================================================
-- 5. Ensure mortgage_extra_payments RLS allows user access through parent join
-- ============================================================================
-- Migration 006 created the table. Verify RLS is enabled.
ALTER TABLE public.mortgage_extra_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates, then recreate
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own mortgage extra payments" ON public.mortgage_extra_payments;
  DROP POLICY IF EXISTS "Users can insert own mortgage extra payments" ON public.mortgage_extra_payments;
  DROP POLICY IF EXISTS "Users can delete own mortgage extra payments" ON public.mortgage_extra_payments;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can view own mortgage extra payments"
  ON public.mortgage_extra_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.mortgages WHERE id = mortgage_extra_payments.mortgage_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own mortgage extra payments"
  ON public.mortgage_extra_payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mortgages WHERE id = mortgage_extra_payments.mortgage_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own mortgage extra payments"
  ON public.mortgage_extra_payments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.mortgages WHERE id = mortgage_extra_payments.mortgage_id AND user_id = auth.uid()
  ));
