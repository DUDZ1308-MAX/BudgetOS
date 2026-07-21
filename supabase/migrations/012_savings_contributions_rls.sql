-- Migration 012: Fix savings contributions RLS and add defense-in-depth trigger
-- Purpose: Ensure authenticated users can only insert/view/update/delete their own contributions
-- Strategy: Safe, additive changes. Uses IF NOT EXISTS / DROP IF EXISTS patterns.

-- ============================================================================
-- 1. Add missing goal_id foreign key if it was dropped
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contributions_goal_id_fkey'
  ) THEN
    ALTER TABLE public.contributions
      ADD CONSTRAINT contributions_goal_id_fkey
      FOREIGN KEY (goal_id) REFERENCES public.savings_goals(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 2. Defense-in-depth: BEFORE INSERT trigger forces user_id = auth.uid()
--    This ensures that even if the application sends the wrong user_id,
--    the authenticated user's ID is used. RLS still validates access.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_contribution_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_contribution_user_id ON public.contributions;
CREATE TRIGGER ensure_contribution_user_id
  BEFORE INSERT ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contribution_user_id();

-- ============================================================================
-- 3. Recreate all RLS policies for contributions (idempotent)
-- ============================================================================
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contributions_select" ON public.contributions;
CREATE POLICY "contributions_select" ON public.contributions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "contributions_insert" ON public.contributions;
CREATE POLICY "contributions_insert" ON public.contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contributions_update" ON public.contributions;
CREATE POLICY "contributions_update" ON public.contributions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contributions_delete" ON public.contributions;
CREATE POLICY "contributions_delete" ON public.contributions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Ensure RLS is enabled and policies exist for savings_goals
-- ============================================================================
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "savings_goals_all" ON public.savings_goals;
CREATE POLICY "savings_goals_all" ON public.savings_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
