import type { AccountType, CategoryType, TransactionFrequency, SavingsGoalStatus, CoachMessageType, CoachCategory, RecurringType, RecurringFrequency, RecurringStatus, ReminderType } from './enums';

export interface Profile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  currency: string;
  timezone: string;
  locale: string;
  onboarding_complete: boolean;
  onboarding_completed: boolean;
  theme_preference: string | null;
  created_at: string;
  updated_at: string;
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
  icon: string | null;
  color: string | null;
  is_system: boolean;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  amount: number;
  currency: string | null;
  description: string | null;
  merchant: string | null;
  note: string | null;
  is_recurring: boolean;
  is_pending: boolean;
  recurring_id: string | null;
  notes: string | null;
  tags: string[] | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringTemplate {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  type: RecurringType;
  name: string;
  description: string | null;
  amount: number;
  frequency: RecurringFrequency;
  interval_count: number;
  day_of_week: number | null;
  day_of_month: number | null;
  month_of_year: number | null;
  start_date: string;
  end_date: string | null;
  next_run: string;
  last_run: string | null;
  auto_post: boolean;
  reminder_type: ReminderType | null;
  status: RecurringStatus;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  year: number;
  month: number;
  amount: number;
  rollover: boolean;
  month_key: string;
  rollover_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  monthly_contribution: number;
  category_id: string | null;
  is_completed: boolean;
  sort_order: number;
  priority: number;
  status: string;
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
  start_date: string | null;
  extra_payment: number;
  is_active: boolean;
  payment_frequency: string;
  amortization_years: number;
  compound_semi_annual: boolean;
  down_payment: number;
  purchase_price: number | null;
  extra_payments: { type: string; amount: number; month?: number }[];
  created_at: string;
  updated_at: string;
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
