export type AccountType = 'checking' | 'savings' | 'credit' | 'loan' | 'investment' | 'cash';
export type CategoryType = 'income' | 'expense';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface AccountInsert {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  is_active?: boolean;
}

export interface AccountUpdate {
  name?: string;
  type?: AccountType;
  balance?: number;
  currency?: string;
  is_active?: boolean;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface CategoryInsert {
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
}

export interface CategoryUpdate {
  name?: string;
  type?: CategoryType;
  icon?: string | null;
  color?: string | null;
  is_archived?: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  amount: number;
  date: string;
  merchant: string | null;
  note: string | null;
  is_archived: boolean;
  recurring_id: string | null;
  created_at: string;
}

export interface TransactionInsert {
  account_id: string;
  category_id?: string | null;
  amount: number;
  date: string;
  merchant?: string | null;
  note?: string | null;
  recurring_id?: string | null;
}

export interface TransactionUpdate {
  account_id?: string;
  category_id?: string | null;
  amount?: number;
  date?: string;
  merchant?: string | null;
  note?: string | null;
  is_archived?: boolean;
  recurring_id?: string | null;
}

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  categoryId?: string;
  is_archived?: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  year: number;
  month: number;
  amount: number;
  rollover: boolean;
  created_at: string;
}

export interface BudgetInsert {
  category_id: string;
  year: number;
  month: number;
  amount: number;
  rollover?: boolean;
}

export interface BudgetUpdate {
  category_id?: string;
  year?: number;
  month?: number;
  amount?: number;
  rollover?: boolean;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  priority: number;
  status: string;
  created_at: string;
}

export interface Mortgage {
  id: string;
  user_id: string;
  name: string;
  principal: number;
  annual_rate: number;
  term_years: number;
  start_date: string | null;
  extra_payment: number;
  is_active: boolean;
  created_at: string;
}

export interface CoachMessage {
  id: string;
  user_id: string;
  type: string | null;
  title: string | null;
  message: string | null;
  category: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  type: 'income' | 'expense' | 'transfer';
  name: string;
  description: string | null;
  amount: number;
  frequency: 'one_time' | 'daily' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
  interval_count: number;
  day_of_week: number | null;
  day_of_month: number | null;
  month_of_year: number | null;
  start_date: string;
  end_date: string | null;
  next_run: string;
  last_run: string | null;
  auto_post: boolean;
  reminder_type: 'today' | 'day_before' | 'three_days_before' | 'week_before' | null;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface RecurringTransactionInsert {
  account_id?: string | null;
  category_id?: string | null;
  type: 'income' | 'expense' | 'transfer';
  name: string;
  description?: string | null;
  amount: number;
  frequency: 'one_time' | 'daily' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
  interval_count?: number;
  day_of_week?: number | null;
  day_of_month?: number | null;
  month_of_year?: number | null;
  start_date: string;
  end_date?: string | null;
  next_run?: string;
  auto_post?: boolean;
  reminder_type?: 'today' | 'day_before' | 'three_days_before' | 'week_before' | null;
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface RecurringTransactionUpdate {
  account_id?: string | null;
  category_id?: string | null;
  type?: 'income' | 'expense' | 'transfer';
  name?: string;
  description?: string | null;
  amount?: number;
  frequency?: 'one_time' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
  interval_count?: number;
  day_of_week?: number | null;
  day_of_month?: number | null;
  month_of_year?: number | null;
  start_date?: string;
  end_date?: string | null;
  next_run?: string;
  last_run?: string | null;
  auto_post?: boolean;
  reminder_type?: 'today' | 'day_before' | 'three_days_before' | 'week_before' | null;
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
}

export type FeedbackType = 'bug' | 'feature' | 'general';
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved';

export interface Feedback {
  id: string;
  user_id: string;
  type: FeedbackType;
  title: string;
  message: string;
  email: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackInsert {
  type: FeedbackType;
  title: string;
  message: string;
  email?: string | null;
}

export interface FeedbackUpdate {
  type?: FeedbackType;
  title?: string;
  message?: string;
  email?: string | null;
  status?: FeedbackStatus;
  admin_notes?: string | null;
}
