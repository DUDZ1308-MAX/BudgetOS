import type {
  BudgetHealthResult,
  CashFlowResult,
  DashboardData,
  FinancialHealthResult,
  MortgageResult,
  NetWorthResult,
  SavingsGoalResult,
  UpcomingActivityResult,
} from '@/services/FinancialEngine';
import type { CashFlowForecast, ForecastWindow, ForecastWarning } from '@/lib/forecast/types';
import type { ScenarioAdjustment, ScenarioComparisonResult } from '@budgetos/shared';
import type { CategoryBreakdown } from '@/engine/types';

// ============================================================================
// AI Financial Coach — domain types
// ============================================================================

// ----------------------------------------------------------------------------
// Intent routing (Phase 8)
// ----------------------------------------------------------------------------

export type CoachIntent =
  | 'spending_analysis'
  | 'budget_analysis'
  | 'cash_flow'
  | 'forecast'
  | 'mortgage'
  | 'savings'
  | 'retirement'
  | 'financial_health'
  | 'what_if_scenario'
  | 'general_finance';

export const COACH_INTENTS: CoachIntent[] = [
  'spending_analysis',
  'budget_analysis',
  'cash_flow',
  'forecast',
  'mortgage',
  'savings',
  'retirement',
  'financial_health',
  'what_if_scenario',
  'general_finance',
];

// ----------------------------------------------------------------------------
// Context tiers (Phase 4)
// ----------------------------------------------------------------------------

export type CoachContextTier =
  | 'basic'
  | 'spending'
  | 'budget'
  | 'debt'
  | 'goal'
  | 'forecast'
  | 'health';

export const COACH_CONTEXT_TIERS: CoachContextTier[] = [
  'basic',
  'spending',
  'budget',
  'debt',
  'goal',
  'forecast',
  'health',
];

// ----------------------------------------------------------------------------
// Authoritative financial snapshot (Phase 2 + Phase 3)
// ----------------------------------------------------------------------------

export interface MonthSpending {
  label: string;
  startDate: string;
  endDate: string;
  income: number;
  expenses: number;
  byCategory: CategoryBreakdown[];
}

export interface CoachSnapshotData {
  asOfDate: string;
  dashboard: DashboardData;
  forecast: CashFlowForecast;
  currentMonth: MonthSpending;
  previousMonth: MonthSpending;
  historical: Array<{ month: string; income: number; expenses: number; net: number }>;
  rawMortgages: Array<{
    id: string;
    name: string;
    principal: number;
    annualRate: number;
    termYears: number;
    amortizationYears: number | null;
    startDate: string;
    paymentFrequency: string;
    extraPayments: Array<{ amount: number; date: string; type?: string }>;
  }>;
  rawSavings: Array<{
    id: string;
    name: string;
    currentAmount: number;
    targetAmount: number;
    monthlyContribution: number;
    targetDate: string | null;
  }>;
  unavailableSources: string[];
}

export type FinancialSnapshot = CoachSnapshotData;

// ----------------------------------------------------------------------------
// Tiered context (Phase 4)
// ----------------------------------------------------------------------------

export interface BasicContext {
  asOfDate: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  availableCash: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  accountCount: number;
  mortgageCount: number;
  savingsGoalCount: number;
}

export interface CategorySpendChange {
  name: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export interface SpendingContext {
  currentMonthLabel: string;
  previousMonthLabel: string;
  currentExpenses: number;
  previousExpenses: number;
  change: number;
  changePercent: number;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
  categoryChanges: CategorySpendChange[];
  recentTransactions: Array<{ merchant: string | null; amount: number; date: string; categoryName: string | null }>;
}

export interface BudgetContext {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  adherencePercent: number;
  overallStatus: string;
  overBudget: Array<{ categoryName: string; budgeted: number; spent: number; remaining: number; percentUsed: number }>;
  topByUsage: Array<{ categoryName: string; budgeted: number; spent: number; percentUsed: number; status: string }>;
}

export interface MortgageContextItem {
  name: string;
  monthlyPayment: number;
  remainingBalance: number;
  annualRate: number;
  payoffDate: string;
  payoffMonths: number;
  yearsRemaining: number;
  totalInterest: number;
  interestSaved: number;
  progressPct: number;
  extraPayment: number;
}

export interface DebtContext {
  mortgages: MortgageContextItem[];
  nonMortgageDebt: number;
}

export interface SavingsGoalContextItem {
  name: string;
  current: number;
  target: number;
  percentComplete: number;
  targetDate: string | null;
  onTrack: boolean;
  estimatedCompletionDate: string | null;
  monthsRemaining: number | null;
}

export interface GoalContext {
  savingsGoals: SavingsGoalContextItem[];
  totalSaved: number;
  totalTarget: number;
  activeGoalCount: number;
}

export interface ForecastWindowContext {
  window: ForecastWindow;
  endingBalance: number;
  income: number;
  expenses: number;
  netCashFlow: number;
  lowestBalance: number;
  lowestBalanceDate: string | null;
  daysBelowZero: number;
}

export interface ForecastContext {
  asOfDate: string;
  availableCash: number;
  windows: ForecastWindowContext[];
  warnings: ForecastWarning[];
  upcomingIncome: UpcomingActivityResult[];
  upcomingBills: UpcomingActivityResult[];
}

export interface HealthContext {
  overallScore: number;
  tier: string;
  components: Record<string, { maxPoints: number; earnedPoints: number; percentage: number; details: string }>;
  recommendations: string[];
}

export interface CoachContext {
  intent: CoachIntent;
  tiers: CoachContextTier[];
  basic?: BasicContext;
  spending?: SpendingContext;
  budget?: BudgetContext;
  debt?: DebtContext;
  goal?: GoalContext;
  forecast?: ForecastContext;
  health?: HealthContext;
}

// ----------------------------------------------------------------------------
// What-if scenarios (Phase 10)
// ----------------------------------------------------------------------------

export type ParsedScenario =
  | { type: 'mortgage'; extraAmount: number }
  | { type: 'savings'; extraAmount: number }
  | { type: 'expense'; reduceAmount: number; target?: string }
  | { type: 'income'; increaseAmount: number };

export interface CoachScenarioResult {
  parsed: ParsedScenario;
  label: string;
  comparison?: ScenarioComparisonResult;
  mortgage?: {
    baseline: { payoffDate: string | null; payoffMonths: number; interestSaved: number; totalInterest: number };
    scenario: { payoffDate: string | null; payoffMonths: number; interestSaved: number; totalInterest: number };
    monthsSaved: number;
    interestSavedDelta: number;
  };
  savings?: {
    baseline: { projectedBalance: number; projectedCompletionDate: string | null; onTrack: boolean };
    scenario: { projectedBalance: number; projectedCompletionDate: string | null; onTrack: boolean };
    monthsSaved: number | null;
  };
}

// ----------------------------------------------------------------------------
// Proactive insights (Phase 11)
// ----------------------------------------------------------------------------

export interface CoachInsight {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'positive';
  category: 'spending' | 'budget' | 'cashflow' | 'savings' | 'mortgage' | 'health' | 'forecast';
  title: string;
  message: string;
}

// ----------------------------------------------------------------------------
// Prompt contract (Phase 5 + Phase 6)
// ----------------------------------------------------------------------------

export interface CoachRequest {
  intent: CoachIntent;
  context: CoachContext;
  scenario: CoachScenarioResult | null;
  unavailableSources: string[];
  userMessage: string;
}

// Re-export types commonly consumed by the AI layer so imports stay shallow.
export type {
  BudgetHealthResult,
  CashFlowResult,
  FinancialHealthResult,
  MortgageResult,
  NetWorthResult,
  SavingsGoalResult,
  ScenarioAdjustment,
};
