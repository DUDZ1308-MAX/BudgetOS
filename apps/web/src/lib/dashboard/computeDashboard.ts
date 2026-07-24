import { FinancialEngine } from '@/services/FinancialEngine';
import type { DashboardSummaryData, CategoryBudgetStatus, DashboardRecommendation, DashboardProjection } from './types';

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[dashboard] ${method}`, ...args);
}

export interface DashboardResult {
  data: DashboardSummaryData;
  errors: string[];
}

const EMPTY_FINANCIAL_HEALTH = {
  overallScore: 0,
  tier: 'fair' as string,
  components: {},
  recommendations: [],
  recommendationsList: [] as DashboardRecommendation[],
  letterGrade: 'F' as string,
  subscores: {},
  trends: {
    healthScore: { direction: 'stable', change: 0, changePercent: 0 },
    spending: { direction: 'stable', change: 0, changePercent: 0 },
    savings: { direction: 'stable', change: 0, changePercent: 0 },
    netWorth: { direction: 'stable', change: 0, changePercent: 0 },
  },
  insights: [] as Array<{ id: string; category: string; title: string; message: string; type: string; date: string }>,
  projections: [] as DashboardProjection[],
};

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

  let letterGrade: string | undefined;
  let subscores: Record<string, { score: number; grade: string; trend: string; explanation: string }> | undefined;

  try {
    const healthScoreV2 = FinancialEngine.getHealthScoreV2(
      dashboardData.cashFlow,
      dashboardData.netWorth,
      dashboardData.budgetHealth,
      dashboardData.savingsRate,
      dashboardData.cashFlow.monthlyExpenses,
      [],
    );
    letterGrade = healthScoreV2.overall.grade;
    subscores = Object.fromEntries(
      Object.entries(healthScoreV2.components).map(([key, val]) => [
        key,
        { score: val.score, grade: val.grade, trend: val.trend, explanation: val.explanation },
      ]),
    );
  } catch (e) {
    debug('HealthScoreV2 failed', e);
  }

  let trends: typeof EMPTY_FINANCIAL_HEALTH.trends | undefined;
  try {
    const trendResult = FinancialEngine.getTrends(
      [],
      dashboardData.upcomingActivity as any,
      [],
      [],
      dashboardData.financialHealth.overallScore,
      [],
    );
    trends = {
      healthScore: { direction: trendResult.healthScore.direction, change: trendResult.healthScore.change, changePercent: trendResult.healthScore.changePercent },
      spending: { direction: trendResult.spending.direction, change: trendResult.spending.change, changePercent: trendResult.spending.changePercent },
      savings: { direction: trendResult.savings.direction, change: trendResult.savings.change, changePercent: trendResult.savings.changePercent },
      netWorth: { direction: trendResult.netWorth.direction, change: trendResult.netWorth.change, changePercent: trendResult.netWorth.changePercent },
    };
  } catch (e) {
    debug('Trends failed', e);
  }

  const fullTrends = trends ?? EMPTY_FINANCIAL_HEALTH.trends;

  let recommendations: DashboardRecommendation[] = [];
  try {
    const recResult = FinancialEngine.getRecommendations(
      dashboardData.financialHealth as any,
      fullTrends as any,
      dashboardData.cashFlow.monthlyIncome,
      dashboardData.cashFlow.monthlyExpenses,
      dashboardData.savingsRate / 100,
      dashboardData.cashFlow.monthlyExpenses > 0 ? dashboardData.netWorth.totalAssets / dashboardData.cashFlow.monthlyExpenses : 0,
      0,
      0,
      0,
      0,
      0,
    );
    recommendations = recResult.map((r) => ({
      id: r.id,
      priority: r.priority,
      category: r.category,
      title: r.title,
      description: r.description,
      expectedImpact: r.expectedImpact,
      estimatedSavings: r.estimatedSavings,
      estimatedTimeline: r.estimatedTimeline,
    }));
  } catch (e) {
    debug('Recommendations failed', e);
  }

  let insights2: typeof EMPTY_FINANCIAL_HEALTH.insights = [];
  try {
    const insightResult = FinancialEngine.getFinancialInsights(
      dashboardData.financialHealth as any,
      fullTrends as any,
      dashboardData.cashFlow.monthlyIncome,
      dashboardData.cashFlow.monthlyExpenses,
      dashboardData.cashFlow.monthlyExpenses,
      dashboardData.savingsRate / 100,
      0,
      0,
      0,
    );
    insights2 = insightResult.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      message: r.message,
      type: r.type,
      date: r.date,
    }));
  } catch (e) {
    debug('Insights failed', e);
  }

  let projections: DashboardProjection[] = [];
  try {
    const projectionResult = FinancialEngine.getProjections(
      dashboardData.netWorth.netWorth,
      dashboardData.savingsSnapshot.totalSaved,
      dashboardData.netWorth.totalLiabilities,
      dashboardData.cashFlow.monthlyIncome,
      dashboardData.cashFlow.monthlyExpenses,
      dashboardData.savingsRate / 100,
      dashboardData.netWorth.totalAssets,
      0,
      0.07,
      [],
    );
    projections = projectionResult.projections.map((p) => ({
      label: p.label,
      months: p.months,
      netWorth: p.netWorth,
      savings: p.savings,
      debt: p.debt,
      cashFlow: p.cashFlow,
      emergencyFundMonths: p.emergencyFundMonths,
    }));
  } catch (e) {
    debug('Projections failed', e);
  }

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
      recommendationsList: recommendations,
      letterGrade,
      subscores,
      trends: trends ?? EMPTY_FINANCIAL_HEALTH.trends,
      insights: insights2,
      projections,
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
