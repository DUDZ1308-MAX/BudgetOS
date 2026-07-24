export type AccountType = 'checking' | 'savings' | 'credit' | 'credit_card' | 'loan' | 'investment' | 'cash' | 'other';

export type CategoryType = 'income' | 'expense' | 'transfer' | 'saving';

export type TransactionFrequency = 'one_time' | 'daily' | 'monthly' | 'weekly' | 'biweekly' | 'semimonthly' | 'yearly' | 'quarterly' | 'semi_annual';

export type BudgetStatus = 'under' | 'on_track' | 'at_limit' | 'over';

export type SavingsGoalStatus = 'active' | 'completed' | 'cancelled';

export type MortgageExtraType = 'monthly_fixed' | 'annual_lump' | 'one_time' | 'biweekly';

export type CoachMessageType = 'alert' | 'tip' | 'win' | 'insight';

export type CoachCategory = 'budget' | 'spending' | 'savings' | 'mortgage' | 'health' | 'general';

export type FHSTier = 'excellent' | 'good' | 'fair' | 'concerning' | 'critical';

export type FHSComponentName = 'savingsRate' | 'debtToIncome' | 'emergencyFund' | 'budgetAdherence' | 'netWorthTrend';

export type HealthScoreComponentName =
  | 'spending'
  | 'savings'
  | 'debt'
  | 'cashFlow'
  | 'emergencyFund'
  | 'budgetAdherence'
  | 'netWorthGrowth';

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type TrendDirection = 'improving' | 'stable' | 'declining';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export type RecommendationCategory = 'spending' | 'savings' | 'debt' | 'emergency_fund' | 'budget' | 'income' | 'mortgage' | 'retirement' | 'general';

export type InsightCategory = 'spending' | 'savings' | 'debt' | 'cash_flow' | 'budget' | 'mortgage' | 'net_worth' | 'general';

export type ProjectionType = 'net_worth' | 'savings' | 'debt' | 'cash_flow' | 'emergency_fund';

export type RecurringType = 'income' | 'expense' | 'transfer';

export type RecurringFrequency = 'one_time' | 'daily' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';

export type RecurringStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type ReminderType = 'today' | 'day_before' | 'three_days_before' | 'week_before';
