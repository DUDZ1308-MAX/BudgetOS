import { FinancialEngine } from '@/services/FinancialEngine';
import type { DashboardSummaryData, CategoryBudgetStatus } from './types';

// ============================================================================
// computeDashboard — DELEGATES to FinancialEngine (Single Source of Truth)
// ============================================================================
//
// RULE: This function performs NO calculations. It calls
// FinancialEngine.getDashboardData() and maps the result to the
// DashboardSummaryData format expected by the UI.
//
// All financial calculations MUST go through FinancialEngine → @budgetos/engine.
// ============================================================================

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

  // Map FinancialEngine results to DashboardSummaryData format
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
    financialHealth: {
      overallScore: dashboardData.financialHealth.overallScore,
      tier: dashboardData.financialHealth.tier,
      components: dashboardData.financialHealth.components,
      recommendations: dashboardData.financialHealth.recommendations,
    },
    mortgages: dashboardData.mortgages,
    topSpendingCategories: dashboardData.topSpendingCategories,
    budgetUtilization,
    upcomingActivity: dashboardData.upcomingActivity,
    recentTransactions: dashboardData.recentTransactions,
  };

  debug('result', result);
  return { data: result, errors: dashboardData.errors };
}
