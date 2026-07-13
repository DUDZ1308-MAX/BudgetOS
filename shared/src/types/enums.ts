export type AccountType = 'checking' | 'savings' | 'credit' | 'loan' | 'investment' | 'cash';

export type CategoryType = 'income' | 'expense';

export type TransactionFrequency = 'monthly' | 'weekly' | 'biweekly' | 'yearly';

export type BudgetStatus = 'under' | 'on_track' | 'at_limit' | 'over';

export type SavingsGoalStatus = 'active' | 'completed' | 'cancelled';

export type MortgageExtraType = 'monthly_fixed' | 'annual_lump' | 'one_time' | 'biweekly';

export type CoachMessageType = 'alert' | 'tip' | 'win' | 'insight';

export type CoachCategory = 'budget' | 'spending' | 'savings' | 'mortgage' | 'health' | 'general';

export type FHSTier = 'excellent' | 'good' | 'fair' | 'concerning' | 'critical';

export type FHSComponentName = 'savingsRate' | 'debtToIncome' | 'emergencyFund' | 'budgetAdherence' | 'netWorthTrend';

export type RecurringType = 'income' | 'expense' | 'transfer';

export type RecurringFrequency = 'one_time' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';

export type RecurringStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type ReminderType = 'today' | 'day_before' | 'three_days_before' | 'week_before';
