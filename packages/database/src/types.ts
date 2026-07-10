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
  created_at: string;
}

export interface TransactionInsert {
  account_id: string;
  category_id?: string | null;
  amount: number;
  date: string;
  merchant?: string | null;
  note?: string | null;
}

export interface TransactionUpdate {
  account_id?: string;
  category_id?: string | null;
  amount?: number;
  date?: string;
  merchant?: string | null;
  note?: string | null;
  is_archived?: boolean;
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
