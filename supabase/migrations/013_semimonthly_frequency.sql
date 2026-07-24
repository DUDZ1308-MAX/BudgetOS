-- Migration 013: Add semimonthly to recurring_transactions frequency CHECK constraint
-- Purpose: The TypeScript types and application code already support semimonthly
--          frequency, but the database CHECK constraint was missing this value.
-- Strategy: Drop old constraint, add new one with semimonthly included.
--           Safe for production — existing data is not modified.

-- ============================================================================
-- 1. Drop the old CHECK constraint on recurring_transactions.frequency
-- ============================================================================
ALTER TABLE public.recurring_transactions
  DROP CONSTRAINT IF EXISTS recurring_transactions_frequency_check;

-- ============================================================================
-- 2. Add updated CHECK constraint that includes 'semimonthly'
-- ============================================================================
ALTER TABLE public.recurring_transactions
  ADD CONSTRAINT recurring_transactions_frequency_check
  CHECK (frequency IN (
    'one_time', 'daily', 'weekly', 'biweekly', 'semimonthly',
    'monthly', 'quarterly', 'semi_annual', 'yearly'
  ));

-- ============================================================================
-- 3. Update the comment on the column for documentation
-- ============================================================================
COMMENT ON COLUMN public.recurring_transactions.frequency
  IS 'Schedule frequency: one_time, daily, weekly, biweekly, semimonthly, monthly, quarterly, semi_annual, yearly';
