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
  Notification,
  NotificationInsert,
  NotificationUpdate,
  PlanningScenario,
  PlanningScenarioInsert,
  PlanningScenarioUpdate,
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

export async function createTransaction(client: SupabaseClient, userId: string, data: TransactionInsert) {
  if (data.account_id) {
    const { data: account } = await client
      .from('accounts')
      .select('id')
      .eq('id', data.account_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (!account) {
      return as<Transaction>(
        Promise.resolve({ data: null, error: { message: 'The selected account no longer exists. Please choose a different account.', code: '23503', details: '', hint: '' } as any }),
      );
    }
  }

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

export async function createBudget(client: SupabaseClient, userId: string, data: BudgetInsert) {
  const { year, month, rollover, ...rest } = data as any;
  const monthKey = year && month ? `${year}-${String(month).padStart(2, '0')}` : undefined;

  if (!monthKey) {
    throw new Error('Year and month are required to create a budget.');
  }

  const { data: existing } = await client
    .from('budgets')
    .select('id')
    .eq('user_id', userId)
    .eq('category_id', rest.category_id)
    .eq('month_key', monthKey)
    .maybeSingle();

  if (existing) {
    throw new Error('A budget already exists for this category in this month.');
  }

  const payload: Record<string, unknown> = { user_id: userId, ...rest };
  if (monthKey) payload.month_key = monthKey;
  if (rollover !== undefined) payload.rollover_enabled = rollover;
  return as<Budget>(
    client.from('budgets').insert(payload).select('*').single(),
  );
}

export async function updateBudget(client: SupabaseClient, budgetId: string, data: BudgetUpdate) {
  const { year, month, rollover, ...rest } = data as any;
  const payload: Record<string, unknown> = { ...rest };
  if (year !== undefined && month !== undefined) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    payload.month_key = monthKey;

    const existing = await client
      .from('budgets')
      .select('id')
      .eq('user_id', (data as any).user_id ?? '')
      .eq('category_id', rest.category_id)
      .eq('month_key', monthKey)
      .neq('id', budgetId)
      .maybeSingle();

    if (existing.data) {
      throw new Error('A budget already exists for this category in this month.');
    }
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

// ============================================================
// Notifications
// ============================================================

export function getNotifications(client: SupabaseClient, userId: string) {
  return asList<Notification>(
    client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false }),
  );
}

export function getNotification(client: SupabaseClient, notificationId: string) {
  return as<Notification>(
    client.from('notifications').select('*').eq('id', notificationId).single(),
  );
}

export function createNotification(client: SupabaseClient, userId: string, data: NotificationInsert) {
  return as<Notification>(
    client.from('notifications').insert({ user_id: userId, ...data }).select('*').single(),
  );
}

export function createNotificationsBatch(client: SupabaseClient, userId: string, items: NotificationInsert[]) {
  const rows = items.map((item) => ({ user_id: userId, ...item }));
  return client.from('notifications').insert(rows);
}

export function updateNotification(client: SupabaseClient, notificationId: string, data: NotificationUpdate) {
  return as<Notification>(
    client.from('notifications').update(data).eq('id', notificationId).select('*').single(),
  );
}

export function markNotificationRead(client: SupabaseClient, notificationId: string) {
  return as<Notification>(
    client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select('*')
      .single(),
  );
}

export function markAllNotificationsRead(client: SupabaseClient, userId: string) {
  return client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}

export function archiveNotification(client: SupabaseClient, notificationId: string) {
  return as<Notification>(
    client
      .from('notifications')
      .update({ is_archived: true })
      .eq('id', notificationId)
      .select('*')
      .single(),
  );
}

export function deleteNotification(client: SupabaseClient, notificationId: string) {
  return as<Notification>(
    client.from('notifications').delete().eq('id', notificationId).select('*').single(),
  );
}

export function getUnreadNotificationCount(client: SupabaseClient, userId: string) {
  return client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_archived', false);
}

// ============================================================================
// Planning Scenarios
// ============================================================================

export function listPlanningScenarios(client: SupabaseClient, userId: string) {
  return client
    .from('planning_scenarios')
    .select('*')
    .eq('user_id', userId)
    .eq('is_preset', false)
    .order('created_at', { ascending: false });
}

export function getPlanningScenario(client: SupabaseClient, scenarioId: string) {
  return as<PlanningScenario>(
    client.from('planning_scenarios').select('*').eq('id', scenarioId).single(),
  );
}

export function insertPlanningScenario(
  client: SupabaseClient,
  userId: string,
  data: PlanningScenarioInsert,
) {
  return as<PlanningScenario>(
    client
      .from('planning_scenarios')
      .insert({ ...data, user_id: userId, adjustments: data.adjustments ?? [] })
      .select('*')
      .single(),
  );
}

export function updatePlanningScenario(
  client: SupabaseClient,
  scenarioId: string,
  data: PlanningScenarioUpdate,
) {
  return as<PlanningScenario>(
    client
      .from('planning_scenarios')
      .update(data)
      .eq('id', scenarioId)
      .select('*')
      .single(),
  );
}

export function deletePlanningScenario(client: SupabaseClient, scenarioId: string) {
  return as<PlanningScenario>(
    client.from('planning_scenarios').delete().eq('id', scenarioId).select('*').single(),
  );
}
