import type { BudgetSummary, CashFlowSummary } from '@/engine/types';
import type { SavingsGoal } from '@budgetos/database';

export type HealthFactor =
  | 'budget_adherence'
  | 'savings_rate'
  | 'emergency_fund'
  | 'debt_to_income'
  | 'mortgage_progress'
  | 'spending_consistency'
  | 'cash_flow_stability';

export interface HealthFactorScore {
  factor: HealthFactor;
  label: string;
  score: number;
  maxScore: number;
  weight: number;
  description: string;
}

export interface FinancialHealthResult {
  overallScore: number;
  factors: HealthFactorScore[];
  breakdown: string;
  improvementSuggestions: Suggestion[];
  trend: number[];
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertCategory = 'budget' | 'savings' | 'mortgage' | 'spending' | 'cashflow' | 'system' | 'achievement' | 'milestone';

export interface ProactiveAlert {
  id: string;
  type: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  suggestedAction?: string;
  relatedEntityId?: string;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
}

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationCategory = 'budget' | 'savings' | 'mortgage' | 'spending' | 'income' | 'general';

export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  title: string;
  description: string;
  estimatedImpact: string;
  reasoning: string;
  confidence: number;
  action?: {
    type: string;
    label: string;
    params: Record<string, unknown>;
  };
  dismissed: boolean;
  applied: boolean;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  category: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
  actionLabel?: string;
}

export interface SpendingPattern {
  weeklyAverage: number;
  weekendSpending: number;
  weekdaySpending: number;
  categoryTrends: Array<{
    category: string;
    currentMonth: number;
    previousMonth: number;
    change: number;
  }>;
  recurringMerchants: Array<{
    merchant: string;
    averageAmount: number;
    frequency: string;
    lastDate: string;
  }>;
}

export interface GoalAnalysis {
  projectedCompletion: string;
  probability: number;
  progressForecast: number[];
  suggestedContribution: number;
  monthsToCompletion: number;
  onTrack: boolean;
}

export interface TrendData {
  dailyBalances: number[];
  weeklyAverages: number[];
  monthlyAverages: number[];
  trend: 'improving' | 'declining' | 'stable';
  volatility: number;
}

export interface Notification {
  id: string;
  type: AlertCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
  metadata?: Record<string, unknown>;
}

export interface IntelligenceInput {
  budgetSummary: BudgetSummary;
  cashFlowSummary: CashFlowSummary;
  savingsGoals: SavingsGoal[];
  mortgageData?: {
    remainingBalance: number;
    monthlyPayment: number;
    progressPct: number;
    payoffDate: string;
    totalInterest: number;
    principalPaid: number;
  };
  transactions: Array<{
    id: string;
    amount: number;
    date: string;
    category: string;
    merchant: string | null;
  }>;
  previousMonthBudget?: BudgetSummary;
}
