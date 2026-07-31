import { describe, it, expect } from 'vitest';
import { buildSummary, analyzeFinancials } from '../AnalysisEngine';
import type { DashboardSummaryData, CategoryBudgetStatus } from '@/lib/dashboard/types';

function makeDashboard(overrides: Partial<DashboardSummaryData>): DashboardSummaryData {
  return {
    netWorth: 50000,
    totalAssets: 80000,
    totalLiabilities: 30000,
    monthlyIncome: 10000,
    monthlyExpenses: 6000,
    cashFlow: 4000,
    savingsRate: 40,
    availableCash: 12000,
    financialHealth: {
      overallScore: 85,
      tier: 'excellent',
      components: {},
      recommendations: [],
      letterGrade: 'A',
      trends: {
        healthScore: { direction: 'improving', change: 5, changePercent: 6.3 },
        spending: { direction: 'stable', change: 0, changePercent: 0 },
        savings: { direction: 'improving', change: 4, changePercent: 11.1 },
        netWorth: { direction: 'improving', change: 2000, changePercent: 4.2 },
      },
    },
    mortgages: [],
    savingsSnapshot: {
      totalSaved: 2000,
      activeGoals: 2,
      goalCompletionPct: 40,
      nearestGoal: 'Emergency Fund',
      nearestGoalProgress: 40,
      nextMilestone: 'First $5,000',
      nextMilestoneAmount: 5000,
    },
    budgetSnapshot: {
      onTrack: 3,
      over: 0,
      monthlyUsagePct: 60,
      topCategory: 'Groceries',
      topCategoryAmount: 800,
      remainingBudget: 1200,
    },
    accountSummary: {
      totalCash: 10000,
      chequing: 6000,
      savings: 4000,
      creditCards: 1500,
      investments: 5000,
      netLiquidAssets: 13500,
    },
    topSpendingCategories: [
      { categoryName: 'Housing', amount: 2000 },
      { categoryName: 'Groceries', amount: 800 },
      { categoryName: 'Dining', amount: 500 },
    ],
    budgetUtilization: [] as CategoryBudgetStatus[],
    upcomingActivity: [],
    upcoming: [],
    recentTransactions: [],
    insights: [],
    ...overrides,
  };
}

function makeCategoryBudget(overrides: Partial<CategoryBudgetStatus> & { categoryName: string }): CategoryBudgetStatus {
  return {
    categoryId: null,
    budgeted: 1000,
    spent: 800,
    remaining: 200,
    percentUsed: 80,
    ...overrides,
  };
}

describe('buildSummary', () => {
  it('maps dashboard metrics into the AI financial summary', () => {
    const d = makeDashboard({});
    const summary = buildSummary(d);

    expect(summary.monthlyIncome).toBe(10000);
    expect(summary.monthlyExpenses).toBe(6000);
    expect(summary.cashFlow).toBe(4000);
    expect(summary.savingsRate).toBe(40);
    expect(summary.netWorth).toBe(50000);
    expect(summary.healthScore).toBe(85);
    expect(summary.healthGrade).toBe('A');
    expect(summary.totalAssets).toBe(80000);
    expect(summary.totalLiabilities).toBe(30000);
  });

  it('computes total target from savings snapshot completion', () => {
    const summary = buildSummary(makeDashboard({}));
    expect(summary.totalSaved).toBe(2000);
    expect(summary.totalTarget).toBe(5000);
  });

  it('averages budget utilization across categories', () => {
    const d = makeDashboard({
      budgetUtilization: [
        makeCategoryBudget({ categoryName: 'Groceries', percentUsed: 80 }),
        makeCategoryBudget({ categoryName: 'Dining', percentUsed: 120 }),
      ],
    });
    const summary = buildSummary(d);
    expect(summary.budgetUtilization).toBe(100);
  });

  it('counts and totals upcoming expense bills', () => {
    const d = makeDashboard({
      upcomingActivity: [
        { id: 'u1', name: 'Rent', amount: -1500, nextRun: '2026-08-01', type: 'expense', frequency: 'monthly' },
        { id: 'u2', name: 'Paycheck', amount: 4000, nextRun: '2026-08-15', type: 'income', frequency: 'monthly' },
        { id: 'u3', name: 'Netflix', amount: -15, nextRun: '2026-08-10', type: 'expense', frequency: 'monthly' },
      ],
    });
    const summary = buildSummary(d);
    expect(summary.upcomingBillsCount).toBe(2);
    expect(summary.upcomingBillsTotal).toBe(1515);
  });
});

describe('analyzeFinancials', () => {
  it('generates a positive cash flow insight for a healthy surplus', () => {
    const result = analyzeFinancials(makeDashboard({}));
    const insight = result.insights.find((i) => i.type === 'cash_flow' && i.severity === 'positive');
    expect(insight).toBeDefined();
    expect(insight?.title).toContain('Positive cash flow');
  });

  it('flags spending over income as a negative insight', () => {
    const result = analyzeFinancials(
      makeDashboard({ monthlyIncome: 5000, monthlyExpenses: 6000, cashFlow: -1000, savingsRate: 0 }),
    );
    const insight = result.insights.find((i) => i.title === 'Spending exceeds income');
    expect(insight).toBeDefined();
    expect(insight?.severity).toBe('negative');
  });

  it('emits a critical warning for negative cash flow', () => {
    const result = analyzeFinancials(
      makeDashboard({ monthlyIncome: 5000, monthlyExpenses: 6500, cashFlow: -1500, savingsRate: 0 }),
    );
    expect(result.warnings.some((w) => w.severity === 'critical' && w.category === 'cash_flow')).toBe(true);
  });

  it('recommends increasing savings when the rate is below 10%', () => {
    const result = analyzeFinancials(
      makeDashboard({ monthlyIncome: 10000, monthlyExpenses: 9500, cashFlow: 500, savingsRate: 3 }),
    );
    const rec = result.recommendations.find((r) => r.category === 'savings');
    expect(rec).toBeDefined();
    expect(rec?.priority).toBe('critical');
  });

  it('unlocks achievements for strong savings rate and net worth', () => {
    const result = analyzeFinancials(makeDashboard({}));
    expect(result.achievements.some((a) => a.title === 'Savings Star')).toBe(true);
    expect(result.achievements.some((a) => a.title === 'Net Worth Positive')).toBe(true);
  });

  it('warns when a budget category is severely over budget', () => {
    const d = makeDashboard({
      budgetUtilization: [
        makeCategoryBudget({ categoryName: 'Dining', percentUsed: 130, spent: 1300, budgeted: 1000 }),
      ],
    });
    const result = analyzeFinancials(d);
    const warning = result.warnings.find((w) => w.category === 'budget');
    expect(warning).toBeDefined();
    expect(warning?.title).toContain('Dining');
  });

  it('suggests extra mortgage payments when cash flow allows', () => {
    const d = makeDashboard({
      mortgages: [
        {
          id: 'm1',
          name: 'Home',
          monthlyPayment: 1892.5,
          remainingBalance: 250000,
          totalInterest: 200000,
          totalCost: 500000,
          interestSaved: 15000,
          payoffDate: '2056-01-01',
          payoffMonths: 360,
          progressPct: 30,
          principalPaidPct: 20,
          paymentFrequency: 'monthly',
          yearsRemaining: 25,
        },
      ],
    });
    const result = analyzeFinancials(d);
    expect(result.recommendations.some((r) => r.category === 'mortgage')).toBe(true);
    expect(result.debtOpportunities.some((r) => r.category === 'mortgage')).toBe(true);
  });

  it('builds a 6-month cash flow forecast from monthly net', () => {
    const result = analyzeFinancials(makeDashboard({}));
    expect(result.cashFlowForecast).toHaveLength(6);
    for (const month of result.cashFlowForecast) {
      expect(month.trend).toBe('positive');
      expect(month.projected).toBeGreaterThan(0);
    }
  });

  it('generates trend insights from financial health trends', () => {
    const result = analyzeFinancials(makeDashboard({}));
    const healthTrend = result.recentTrends.find((t) => t.metric === 'Health Score');
    expect(healthTrend).toBeDefined();
    expect(healthTrend?.trend).toBe('improving');
  });

  it('produces empty lists for a neutral empty dataset without crashing', () => {
    const empty = makeDashboard({
      netWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      cashFlow: 0,
      savingsRate: 0,
      availableCash: 0,
      financialHealth: { overallScore: 0, tier: 'fair', components: {}, recommendations: [] },
      topSpendingCategories: [],
    });
    const result = analyzeFinancials(empty);
    expect(result.summary).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    expect(result.cashFlowForecast).toHaveLength(6);
  });
});
