import type { AccountType, CategoryType, TransactionFrequency, SavingsGoalStatus, CoachMessageType, CoachCategory } from './enums';

export interface Profile {
  id: string;
  onboarding_complete: boolean;
  theme_pref: 'light' | 'dark' | 'system';
  monthly_budget_day: number;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_system: boolean;
  is_archived: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  date: string;
  merchant: string | null;
  note: string | null;
  is_recurring: boolean;
  recurring_template_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringTemplate {
  id: string;
  user_id: string;
  category_id: string;
  account_id: string;
  amount: number;
  frequency: TransactionFrequency;
  day_of_month: number;
  merchant: string | null;
  note: string | null;
  is_active: boolean;
  next_date: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  year: number;
  month: number;
  amount: number;
  rollover: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  priority: number;
  account_id: string | null;
  category_id: string | null;
  status: SavingsGoalStatus;
  created_at: string;
  updated_at: string;
}

export interface Mortgage {
  id: string;
  user_id: string;
  name: string;
  principal: number;
  annual_rate: number;
  term_years: number;
  start_date: string;
  extra_payment: number;
  extra_payment_frequency: string;
  is_active: boolean;
}

export interface AmortizationCache {
  id: string;
  mortgage_id: string;
  month_number: number;
  payment: number;
  principal: number;
  interest: number;
  remaining_balance: number;
}

export interface FinancialHealthScore {
  id: string;
  user_id: string;
  score: number;
  savings_rate_score: number;
  dti_score: number;
  emergency_fund_score: number;
  budget_score: number;
  net_worth_score: number;
  calculated_at: string;
  month_key: string;
}

export interface CoachMessage {
  id: string;
  user_id: string;
  type: CoachMessageType;
  title: string;
  message: string;
  category: CoachCategory;
  is_read: boolean;
  is_dismissed: boolean;
  triggered_by_entity: string;
  created_at: string;
}

export interface AllocatorConfig {
  id: string;
  user_id: string;
  steps: AllocatorStepConfig[];
  custom_surplus_formula: Record<string, unknown> | null;
}

export interface AllocatorStepConfig {
  priority: number;
  bucket_name: string;
  target_amount: number | null;
  percentage_of_surplus: number | null;
  is_enabled: boolean;
}
