import type { PostgrestError } from '@supabase/supabase-js';

export interface FormattedError {
  message: string;
  detail: string;
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  budgets_user_category_month_unique: 'A budget already exists for this category in this month.',
  transactions_user_date_account_id_pos: 'Duplicate positive transaction for this date and account.',
  transactions_user_date_account_id_neg: 'Duplicate negative transaction for this date and account.',
  transactions_user_date_account_id_pending: 'Duplicate pending transaction for this date and account.',
  transactions_user_date_account_id_split: 'Duplicate split transaction for this date and account.',
};

function parseConstraintMessage(err: PostgrestError): string | undefined {
  if (err.code === '23503') {
    const detail = err.details ?? '';
    const fkMatch = detail.match(/Key \((\w+)\)=\(([^)]+)\) is not present in table "(\w+)"/);
    if (fkMatch) {
      const [, field, value, table] = fkMatch;
      if (table === 'accounts') {
        return `The account "${value}" no longer exists. Please select a different account.`;
      }
      if (table === 'categories') {
        return `The category "${value}" no longer exists. Please select a different category.`;
      }
      return `Referenced ${(table ?? 'record').replace(/_/g, ' ')} does not exist (${field}=${value}).`;
    }
    return 'A referenced record does not exist. Please check your selections.';
  }
  if (err.code !== '23505') return undefined;
  const detail = err.details ?? '';
  const match = detail.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
  const constraint = match?.[1] ?? '';
  return CONSTRAINT_MESSAGES[constraint]
    ?? `A record with this ${constraint.replace(/_/g, ' ')} already exists.`;
}

export function formatError(err: unknown): FormattedError {
  if (isPostgrestError(err)) {
    const constraintMsg = parseConstraintMessage(err);
    if (constraintMsg) {
      return { message: constraintMsg, detail: err.hint || '' };
    }
    return {
      message: err.code ? `[${err.code}] ${err.message}` : err.message,
      detail: err.details || err.hint || '',
    };
  }
  if (err instanceof Error) {
    return { message: err.message, detail: err.stack ?? '' };
  }
  if (err !== null && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const msg = typeof obj.message === 'string' ? obj.message
      : typeof obj.error === 'string' ? obj.error
      : typeof obj.details === 'string' ? obj.details
      : typeof obj.hint === 'string' ? obj.hint
      : JSON.stringify(err);
    const detail = typeof obj.details === 'string' ? obj.details
      : typeof obj.hint === 'string' ? obj.hint
      : '';
    return { message: msg, detail };
  }
  return { message: String(err ?? 'An unknown error occurred'), detail: '' };
}

function isPostgrestError(err: unknown): err is PostgrestError {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as Record<string, unknown>;
  return typeof e.message === 'string' && typeof e.code === 'string' && typeof e.details === 'string';
}
