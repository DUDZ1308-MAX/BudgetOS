import { describe, it, expect } from 'vitest';
import { generateEnhancedInsights, computeCashFlowForecast } from '@/ai/InsightEngine';
import type { AiContext } from '@/ai/types';

function createMockContext(overrides?: Partial<AiContext>): AiContext {
  return {
    budgetSummary: {
      income: { total: 5000, averageDaily: 166.67 },
      expenses: { total: 3500, byCategory: [
        { categoryId: '1', categoryName: 'Food', amount: 800, percentage: 22.9, transactionCount: 20 },
      ]},
      cashFlow: { netIncome: 1500, dailySpendingAllowance: 116.67, safeToSpendToday: 50, projectedEndBalance: 2000 },
      budgetStatus: { categories: [], overBudget: [], underBudget: [], totalBudgeted: 3000, totalSpent: 2800, totalRemaining: 200 },
      accounts: { netWorth: 15000, remainingCash: 5000, totalAssets: 25000, totalLiabilities: 10000, accountCount: 3 },
      savingsCapacity: { recommendedAmount: 500, savingsRate: 10, surplus: 200 },
      alerts: [],
    },
    cashFlowSummary: {
      dailyBalances: [],
      sevenDayTrend: -100,
      thirtyDayTrend: -200,
      incomeVsExpenseRatio: 1.43,
      totalIncome: 5000,
      totalExpenses: 3500,
      netFlow: 1500,
    },
    insights: [],
    alerts: [],
    savings: {
      goals: [],
      dashboard: { totalSaved: 0, activeGoals: 0, completedGoals: 0, largestGoal: null, averageMonthlySavings: 0, totalTarget: 0 },
    },
    mortgage: { dashboard: null, details: null },
    safeToSpend: { safeToSpendToday: 50, riskLevel: 'low', explanation: 'On track' },
    recentTransactions: [],
    categories: [],
    netWorth: 15000,
    monthlyIncome: 5000,
    monthlyExpenses: 3500,
    ...overrides,
  };
}

describe('InsightEngine', () => {
  it('generates enhanced insights from context', () => {
    const ctx = createMockContext();
    const insights = generateEnhancedInsights(ctx);
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeGreaterThan(0);
  });

  it('includes savings opportunity when surplus exists', () => {
    const ctx = createMockContext({
      budgetSummary: {
        ...createMockContext().budgetSummary,
        income: { total: 5000, averageDaily: 166.67 },
        budgetStatus: {
          categories: [],
          overBudget: [],
          underBudget: [],
          totalBudgeted: 3000,
          totalSpent: 2500,
          totalRemaining: 500,
        },
      },
    });

    const insights = generateEnhancedInsights(ctx);
    const savingsInsight = insights.find((i) => i.category === 'savings');
    expect(savingsInsight).toBeDefined();
    expect(savingsInsight?.actionable).toBe(true);
  });

  it('generates cash flow forecast', () => {
    const ctx = createMockContext();
    const forecasts = computeCashFlowForecast(ctx, 3);
    expect(forecasts.length).toBeGreaterThan(0);

    const spendingForecast = forecasts.find((f) => f.type === 'spending');
    expect(spendingForecast).toBeDefined();
    expect(spendingForecast?.months.length).toBe(3);
  });

  it('detects income vs expense warning', () => {
    const ctx = createMockContext({
      cashFlowSummary: {
        ...createMockContext().cashFlowSummary,
        incomeVsExpenseRatio: 1.05,
        totalIncome: 3500,
        totalExpenses: 3400,
      },
    });

    const insights = generateEnhancedInsights(ctx);
    const incomeWarning = insights.find((i) => i.category === 'cashflow');
    expect(incomeWarning).toBeDefined();
  });

  it('includes under-budget success insights', () => {
    const ctx = createMockContext({
      budgetSummary: {
        ...createMockContext().budgetSummary,
        budgetStatus: {
          categories: [
            { categoryId: '1', categoryName: 'Food', budgeted: 500, spent: 300, remaining: 200, percentUsed: 60, status: 'under' },
          ],
          overBudget: [],
          underBudget: [
            { categoryId: '1', categoryName: 'Food', budgeted: 500, spent: 300, remaining: 200, percentUsed: 60, status: 'under' },
          ],
          totalBudgeted: 3000,
          totalSpent: 2800,
          totalRemaining: 200,
        },
      },
    });

    const insights = generateEnhancedInsights(ctx);
    const underInsight = insights.find((i) => i.title.includes('under budget'));
    expect(underInsight).toBeDefined();
  });
});
