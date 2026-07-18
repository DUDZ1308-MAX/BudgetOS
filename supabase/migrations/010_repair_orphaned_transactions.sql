-- Migration 010: Repair orphaned transaction references + defensive constraints
-- Safe, non-destructive: only NULLifies orphaned FKs and adds a trigger guard

-- 1. Repair orphaned transactions (account_id references a deleted account)
UPDATE public.transactions
SET account_id = NULL
WHERE account_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = transactions.account_id);

-- 2. Repair orphaned recurring_transactions
UPDATE public.recurring_transactions
SET account_id = NULL
WHERE account_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = recurring_transactions.account_id);

-- 3. Repair orphaned transactions (category_id references a deleted category)
UPDATE public.transactions
SET category_id = NULL
WHERE category_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.categories WHERE id = transactions.category_id);

-- 4. Repair orphaned recurring_transactions (category_id)
UPDATE public.recurring_transactions
SET category_id = NULL
WHERE category_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.categories WHERE id = recurring_transactions.category_id);

-- 5. Create a PL/pgSQL function to validate account_id before transaction insert/update
CREATE OR REPLACE FUNCTION public.validate_transaction_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.account_id) THEN
      RAISE EXCEPTION 'Account % does not exist. The transaction was created without a linked account.', NEW.account_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Attach the trigger (before insert/update on transactions)
DROP TRIGGER IF EXISTS validate_transaction_account_trigger ON public.transactions;
CREATE TRIGGER validate_transaction_account_trigger
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_transaction_account();
