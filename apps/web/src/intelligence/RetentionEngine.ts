import type { IntelligenceInput, ProactiveAlert, Recommendation } from './types';

export interface WeeklySummary {
  weekEnding: string;
  totalSpent: number;
  totalSaved: number;
  netChange: number;
  topCategory: string;
  budgetAlerts: number;
  highlight: string;
}

export interface MonthlyReview {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  healthScore: number;
  topRecommendation: string;
  achievements: string[];
  goalsProgress: Array<{ name: string; progress: number }>;
}

export function generateWeeklySummary(input: IntelligenceInput): WeeklySummary {
  const expenses = input.budgetSummary.expenses.total;
  const savings = input.budgetSummary.savingsCapacity.surplus;
  const topCat = input.budgetSummary.expenses.byCategory[0];

  return {
    weekEnding: new Date().toISOString().slice(0, 10),
    totalSpent: Math.round(expenses),
    totalSaved: Math.round(Math.max(0, savings)),
    netChange: Math.round(input.cashFlowSummary.netFlow),
    topCategory: topCat?.categoryName ?? 'None',
    budgetAlerts: input.budgetSummary.alerts.length,
    highlight: generateHighlight(input),
  };
}

export function generateMonthlyReview(
  input: IntelligenceInput,
  healthScore: number,
  recommendations: Recommendation[],
): MonthlyReview {
  const achievements: string[] = [];
  if (input.savingsGoals.some((g) => Number(g.current_amount) >= Number(g.target_amount))) {
    achievements.push('Completed a savings goal');
  }
  if (input.budgetSummary.budgetStatus.overBudget.length === 0) {
    achievements.push('Stayed within all budgets');
  }
  if (input.budgetSummary.savingsCapacity.savingsRate >= 20) {
    achievements.push('Maintained 20%+ savings rate');
  }

  return {
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    totalIncome: Math.round(input.budgetSummary.income.total),
    totalExpenses: Math.round(input.budgetSummary.expenses.total),
    savingsRate: Math.round(input.budgetSummary.savingsCapacity.savingsRate),
    healthScore,
    topRecommendation: recommendations[0]?.title ?? 'Keep up the great work!',
    achievements,
    goalsProgress: input.savingsGoals.map((g) => ({
      name: g.name,
      progress: Number(g.target_amount) > 0
        ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
        : 0,
    })),
  };
}

function generateHighlight(input: IntelligenceInput): string {
  if (input.budgetSummary.savingsCapacity.savingsRate >= 20) {
    return 'Great savings rate this week!';
  }
  if (input.budgetSummary.cashFlow.netIncome > 0) {
    return 'Positive cash flow maintained.';
  }
  if (input.budgetSummary.budgetStatus.overBudget.length === 0) {
    return 'All budgets on track.';
  }
  return 'Review your budgets to improve next week.';
}

export function computeStreak(
  lastActiveDate: string | null,
  weeklySummaries: WeeklySummary[],
): number {
  if (!lastActiveDate) return 0;
  const lastActive = new Date(lastActiveDate);
  const now = new Date();
  const diffDays = Math.round((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, 7 - diffDays) + weeklySummaries.length;
}
