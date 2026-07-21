import { FinancialEngine } from '@/services/FinancialEngine';
import type { DashboardSummaryData, CategoryBudgetStatus } from './types';

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[dashboard] ${method}`, ...args);
}

export interface DashboardResult {
  data: DashboardSummaryData;
  errors: string[];
}

export async function computeDashboard(userId: string): Promise<DashboardResult> {
  debug('fetching data for', userId);

  const dashboardData = await FinancialEngine.getDashboardData(userId);

  const budgetUtilization: CategoryBudgetStatus[] = dashboardData.budgetHealth.categories.map((c) => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    budgeted: c.budgeted,
    spent: c.spent,
    remaining: c.remaining,
    percentUsed: c.percentUsed,
  }));

  const result: DashboardSummaryData = {
    netWorth: dashboardData.netWorth.netWorth,
    totalAssets: dashboardData.netWorth.totalAssets,
    totalLiabilities: dashboardData.netWorth.totalLiabilities,
    monthlyIncome: dashboardData.cashFlow.monthlyIncome,
    monthlyExpenses: dashboardData.cashFlow.monthlyExpenses,
    cashFlow: dashboardData.cashFlow.cashFlow,
    savingsRate: dashboardData.savingsRate,
    availableCash: dashboardData.availableCash,
    financialHealth: {
      overallScore: dashboardData.financialHealth.overallScore,
      tier: dashboardData.financialHealth.tier,
      components: dashboardData.financialHealth.components,
      recommendations: dashboardData.financialHealth.recommendations,
    },
    mortgages: dashboardData.mortgages,
    savingsSnapshot: dashboardData.savingsSnapshot,
    budgetSnapshot: dashboardData.budgetSnapshot,
    accountSummary: dashboardData.accountSummary,
    topSpendingCategories: dashboardData.topSpendingCategories,
    budgetUtilization,
    upcomingActivity: dashboardData.upcomingActivity,
    upcoming: dashboardData.upcoming,
    recentTransactions: dashboardData.recentTransactions,
    insights: dashboardData.insights,
  };

  debug('result', result);
  return { data: result, errors: dashboardData.errors };
}
