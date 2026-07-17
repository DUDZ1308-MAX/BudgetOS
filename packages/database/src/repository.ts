import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type {
  Account,
  AccountInsert,
  AccountUpdate,
  Budget,
  BudgetInsert,
  BudgetUpdate,
  Category,
  CategoryInsert,
  CategoryUpdate,
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionFilters,
  RecurringTransaction,
  RecurringTransactionInsert,
  RecurringTransactionUpdate,
  Feedback,
  FeedbackInsert,
  FeedbackUpdate,
} from './types';

const DEFAULT_INCOME_NAMES = [
  'Salary',
  'Freelance',
  'Investment Income',
  'Gifts',
  'Refunds',
  'Other Income',
] as const;

const DEFAULT_EXPENSE_NAMES = [
  'Housing',
  'Mortgage',
  'Rent',
  'Groceries',
  'Dining',
  'Utilities',
  'Transportation',
  'Fuel',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Travel',
  'Personal Care',
  'Debt Payments',
  'Savings',
  'Taxes',
  'Childcare',
  'Pets',
  'Subscriptions',
  'Miscellaneous',
] as const;

type DbResult<T> = { data: T | null; error: PostgrestError | null };
type DbResultList<T> = { data: T[]; error: PostgrestError | null };

function throwOnError(result: { error: unknown }): void {
  if (result.error) {
    throw result.error;
  }
}

async function as<T>(promise: any): Promise<DbResult<T>> {
  const result = await promise;
  throwOnError(result);
  return result as DbResult<T>;
}

async function asList<T>(promise: any): Promise<DbResultList<T>> {
  const result = await promise;
  throwOnError(result);
  return result as DbResultList<T>;
}

// ============================================================
// Accounts
// ============================================================

export function getAccounts(client: SupabaseClient, userId: string) {
  return asList<Account>(
    client.from('accounts').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
  );
}

export function getAccount(client: SupabaseClient, accountId: string) {
  return as<Account>(
    client.from('accounts').select('*').eq('id', accountId).single(),
  );
}

export function createAccount(client: SupabaseClient, userId: string, data: AccountInsert) {
  return as<Account>(
    client.from('accounts').insert({ user_id: userId, ...data }).select('*').single(),
  );
}

export function updateAccount(client: SupabaseClient, accountId: string, data: AccountUpdate) {
  return as<Account>(
    client.from('accounts').update(data).eq('id', accountId).select('*').single(),
  );
}

export function archiveAccount(client: SupabaseClient, accountId: string) {
  return as<Account>(
    client.from('accounts').update({ is_active: false }).eq('id', accountId).select('*').single(),
  );
}

// ============================================================
// Categories
// ============================================================

export function getCategories(client: SupabaseClient, userId: string) {
  return asList<Category>(
    client
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true }),
  );
}

export function getCategory(client: SupabaseClient, categoryId: string) {
  return as<Category>(
    client.from('categories').select('*').eq('id', categoryId).single(),
  );
}

export function createCategory(client: SupabaseClient, userId: string, data: CategoryInsert) {
  return as<Category>(
    client.from('categories').insert({ user_id: userId, ...data }).select('*').single(),
  );
}

export function updateCategory(client: SupabaseClient, categoryId: string, data: CategoryUpdate) {
  return as<Category>(
    client.from('categories').update(data).eq('id', categoryId).select('*').single(),
  );
}

export function seedDefaultCategories(client: SupabaseClient, userId: string) {
  const rows: { user_id: string; name: string; type: 'income' | 'expense'; is_system: boolean }[] =
    [];

  for (const name of DEFAULT_INCOME_NAMES) {
    rows.push({ user_id: userId, name, type: 'income', is_system: true });
  }
  for (const name of DEFAULT_EXPENSE_NAMES) {
    rows.push({ user_id: userId, name, type: 'expense', is_system: true });
  }

  return client.from('categories').insert(rows);
}

// ============================================================
// Transactions
// ============================================================

export function getTransactions(
  client: SupabaseClient,
  userId: string,
  filters?: TransactionFilters,
) {
  let query = client
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.dateFrom) {
    query = query.gte('date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('date', filters.dateTo);
  }
  if (filters?.accountId) {
    query = query.eq('account_id', filters.accountId);
  }
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.is_archived !== undefined) {
    query = query.eq('is_archived', filters.is_archived);
  } else {
    query = query.eq('is_archived', false);
  }

  return asList<Transaction>(query);
}

export function getTransaction(client: SupabaseClient, transactionId: string) {
  return as<Transaction>(
    client.from('transactions').select('*').eq('id', transactionId).single(),
  );
}

export function createTransaction(client: SupabaseClient, userId: string, data: TransactionInsert) {
  return as<Transaction>(
    client.from('transactions').insert({ user_id: userId, ...data }).select('*').single(),
  );
}

export function updateTransaction(
  client: SupabaseClient,
  transactionId: string,
  data: TransactionUpdate,
) {
  return as<Transaction>(
    client.from('transactions').update(data).eq('id', transactionId).select('*').single(),
  );
}

export function archiveTransaction(client: SupabaseClient, transactionId: string) {
  return as<Transaction>(
    client.from('transactions').update({ is_archived: true }).eq('id', transactionId).select('*').single(),
  );
}

// ============================================================
// Budgets
// ============================================================

export function getBudgets(client: SupabaseClient, userId: string, year?: number, month?: number) {
  let query = client
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (year !== undefined && month !== undefined) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    query = query.eq('month_key', monthKey);
  } else if (year !== undefined) {
    query = query.ilike('month_key', `${year}-%`);
  }

  return asList<Budget>(query);
}

export function getBudget(client: SupabaseClient, budgetId: string) {
  return as<Budget>(
    client.from('budgets').select('*').eq('id', budgetId).single(),
  );
}

export function createBudget(client: SupabaseClient, userId: string, data: BudgetInsert) {
  const { year, month, rollover, ...rest } = data as any;
  const monthKey = year && month ? `${year}-${String(month).padStart(2, '0')}` : undefined;
  const payload: Record<string, unknown> = { user_id: userId, ...rest };
  if (monthKey) payload.month_key = monthKey;
  if (rollover !== undefined) payload.rollover_enabled = rollover;
  return as<Budget>(
    client.from('budgets').insert(payload).select('*').single(),
  );
}

export function updateBudget(client: SupabaseClient, budgetId: string, data: BudgetUpdate) {
  const { year, month, rollover, ...rest } = data as any;
  const payload: Record<string, unknown> = { ...rest };
  if (year !== undefined && month !== undefined) {
    payload.month_key = `${year}-${String(month).padStart(2, '0')}`;
  }
  if (rollover !== undefined) payload.rollover_enabled = rollover;
  return as<Budget>(
    client.from('budgets').update(payload).eq('id', budgetId).select('*').single(),
  );
}

export function deleteBudget(client: SupabaseClient, budgetId: string) {
  return as<Budget>(
    client.from('budgets').delete().eq('id', budgetId).select('*').single(),
  );
}

// ============================================================
// Recurring Transactions
// ============================================================

export function getRecurringTransactions(client: SupabaseClient, userId: string) {
  return asList<RecurringTransaction>(
    client
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('next_run', { ascending: true }),
  );
}

export function getRecurringTransaction(client: SupabaseClient, id: string) {
  return as<RecurringTransaction>(
    client.from('recurring_transactions').select('*').eq('id', id).single(),
  );
}

export function createRecurringTransaction(
  client: SupabaseClient,
  userId: string,
  data: RecurringTransactionInsert,
) {
  return as<RecurringTransaction>(
    client
      .from('recurring_transactions')
      .insert({ user_id: userId, ...data })
      .select('*')
      .single(),
  );
}

export function updateRecurringTransaction(
  client: SupabaseClient,
  id: string,
  data: RecurringTransactionUpdate,
) {
  return as<RecurringTransaction>(
    client
      .from('recurring_transactions')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single(),
  );
}

export function deleteRecurringTransaction(client: SupabaseClient, id: string) {
  return as<RecurringTransaction>(
    client.from('recurring_transactions').delete().eq('id', id).select('*').single(),
  );
}

export function getDueRecurringTransactions(client: SupabaseClient, userId: string, asOfDate: string) {
  return asList<RecurringTransaction>(
    client
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('auto_post', true)
      .lte('next_run', asOfDate)
      .order('next_run', { ascending: true }),
  );
}

// ============================================================
// Feedback
// ============================================================

export function getFeedback(client: SupabaseClient, userId: string) {
  return asList<Feedback>(
    client.from('feedback').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
  );
}

export function getFeedbackById(client: SupabaseClient, feedbackId: string) {
  return as<Feedback>(
    client.from('feedback').select('*').eq('id', feedbackId).single(),
  );
}

export function createFeedback(client: SupabaseClient, userId: string, data: FeedbackInsert) {
  return as<Feedback>(
    client.from('feedback').insert({ user_id: userId, ...data }).select('*').single(),
  );
}

export function updateFeedback(client: SupabaseClient, feedbackId: string, data: FeedbackUpdate) {
  return as<Feedback>(
    client.from('feedback').update(data).eq('id', feedbackId).select('*').single(),
  );
}

export function deleteFeedback(client: SupabaseClient, feedbackId: string) {
  return as<Feedback>(
    client.from('feedback').delete().eq('id', feedbackId).select('*').single(),
  );
}
