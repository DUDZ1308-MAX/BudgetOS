-- Migration 016: Sync layer alignment — add user_id and updated_at to mortgage_extra_payments
-- Purpose: The sync layer (SyncManager, RealtimeManager, BackupRestore) expects every table
--          to have `user_id` (for user-scoped queries) and `updated_at` (for conflict resolution).
--          mortgage_extra_payments (migration 006) was created without these columns.
-- Strategy: Safe, additive only. Backfill data from parent mortgages table.

-- ============================================================================
-- 1. Add user_id to mortgage_extra_payments
-- ============================================================================
ALTER TABLE public.mortgage_extra_payments ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id) on delete cascade;

-- Backfill user_id from parent mortgages table
UPDATE public.mortgage_extra_payments mep
SET user_id = m.user_id
FROM public.mortgages m
WHERE mep.mortgage_id = m.id
  AND mep.user_id IS NULL;

-- ============================================================================
-- 2. Add updated_at to mortgage_extra_payments
-- ============================================================================
ALTER TABLE public.mortgage_extra_payments ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();

-- ============================================================================
-- 3. Add RLS policy for user_id-based access (in addition to parent-join policies)
-- ============================================================================
DO $$ BEGIN
  CREATE POLICY "mortgage_extra_payments_select_own" ON public.mortgage_extra_payments
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "mortgage_extra_payments_insert_own" ON public.mortgage_extra_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "mortgage_extra_payments_update_own" ON public.mortgage_extra_payments
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "mortgage_extra_payments_delete_own" ON public.mortgage_extra_payments
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 4. Index for user_id lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_mortgage_extra_payments_user_id ON public.mortgage_extra_payments(user_id);

-- ============================================================================
-- 5. updated_at trigger
-- ============================================================================
DROP TRIGGER IF EXISTS set_mortgage_extra_payments_updated_at ON public.mortgage_extra_payments;
CREATE TRIGGER set_mortgage_extra_payments_updated_at
  BEFORE UPDATE ON public.mortgage_extra_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
