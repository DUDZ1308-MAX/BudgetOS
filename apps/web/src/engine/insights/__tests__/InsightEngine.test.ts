import { describe, it, expect } from 'vitest';
import { computeInsights } from '../InsightEngine';
import type { BudgetSummary, CashFlowSummary } from '../../types';

function makeBudgetSummary(overrides?: Partial<BudgetSummary>): BudgetSummary {
  return {
    income: { total: 5000, averageDaily: 166.67 },
    expenses: { total: 3000, byCategory: [] },
    cashFlow: { netIncome: 2000, dailySpendingAllowance: 100, safeToSpendToday: 50, projectedEndBalance: 1000 },
    budgetStatus: {
      categories: [],
      overBudget: [],
      underBudget: [],
      totalBudgeted: 3000,
      totalSpent: 0,
      totalRemaining: 3000,
    },
    accounts: { netWorth: 15000, remainingCash: 5000, totalAssets: 5000, totalLiabilities: 0, accountCount: 3 },
    savingsCapacity: { recommendedAmount: 1000, savingsRate: 40, surplus: 2000 },
    alerts: [],
    ...overrides,
  };
}

function makeCashFlowSummary(overrides?: Partial<CashFlowSummary>): CashFlowSummary {
  return {
    dailyBalances: [],
    sevenDayTrend: 0,
    thirtyDayTrend: 0,
    incomeVsExpenseRatio: 1.5,
    totalIncome: 5000,
    totalExpenses: 3000,
    netFlow: 2000,
    ...overrides,
  };
}

describe('InsightEngine', () => {
  const dateRange = { start: '2026-07-01', end: '2026-07-31' };

  it('returns success insight when savings rate >= 20% and no issues', () => {
    const result = computeInsights({
      budgetSummary: makeBudgetSummary(),
      cashFlowSummary: makeCashFlowSummary(),
      dateRange,
    });
    expect(result.length).toBe(1);
    expect(result[0]!.category).toBe('savings');
    expect(result[0]!.type).toBe('success');
  });

  it('returns no insights when no income and no issues', () => {
    const summary = makeBudgetSummary({ income: { total: 0, averageDaily: 0 } });
    const result = computeInsights({
      budgetSummary: summary,
      cashFlowSummary: makeCashFlowSummary(),
      dateRange,
    });
    expect(result.length).toBe(0);
  });

  describe('Rule 1: Overspending', () => {
    it('warns when category exceeds budget', () => {
      const summary = makeBudgetSummary({
        budgetStatus: {
          categories: [],
          overBudget: [
            { categoryId: 'cat-1', categoryName: 'Groceries', budgeted: 500, spent: 550, remaining: -50, percentUsed: 110, status: 'over' },
          ],
          underBudget: [],
          totalBudgeted: 1000,
          totalSpent: 1100,
          totalRemaining: -100,
        },
      });
      const insights = computeInsights({ budgetSummary: summary, cashFlowSummary: makeCashFlowSummary(), dateRange });
      const overspend = insights.find((i) => i.category === 'budget');
      expect(overspend).toBeDefined();
      expect(overspend!.type).toBe('warning');
    });

    it('flags critical when category exceeds budget by > 120%', () => {
      const summary = makeBudgetSummary({
        budgetStatus: {
          categories: [],
          overBudget: [
            { categoryId: 'cat-1', categoryName: 'Dining', budgeted: 500, spent: 650, remaining: -150, percentUsed: 130, status: 'over' },
          ],
          underBudget: [],
          totalBudgeted: 500,
          totalSpent: 650,
          totalRemaining: -150,
        },
      });
      const insights = computeInsights({ budgetSummary: summary, cashFlowSummary: makeCashFlowSummary(), dateRange });
      const critical = insights.find((i) => i.category === 'budget');
      expect(critical).toBeDefined();
      expect(critical!.type).toBe('critical');
    });
  });

  describe('Rule 2: Cash Flow Risk', () => {
    it('critical when projected end balance is negative', () => {
      const summary = makeBudgetSummary({
        cashFlow: { netIncome: -500, dailySpendingAllowance: 50, safeToSpendToday: 0, projectedEndBalance: -200 },
      });
      const insights = computeInsights({ budgetSummary: summary, cashFlowSummary: makeCashFlowSummary(), dateRange });
      const cashflowRisk = insights.find((i) => i.category === 'cashflow' && i.type === 'critical');
      expect(cashflowRisk).toBeDefined();
    });

    it('warning when 7-day trend is negative with enough data', () => {
      const cashflow = makeCashFlowSummary({
        dailyBalances: Array.from({ length: 7 }, (_, i) => ({
          date: `2026-07-${String(i + 1).padStart(2, '0')}`,
          income: 0,
          expenses: 0,
          net: 0,
          runningBalance: 1000 - i * 20,
        })),
        sevenDayTrend: -150,
      });
      const insights = computeInsights({
        budgetSummary: makeBudgetSummary(),
        cashFlowSummary: cashflow,
        dateRange,
      });
      const trend = insights.find((i) => i.category === 'cashflow' && i.type === 'warning');
      expect(trend).toBeDefined();
    });

    it('no cash flow warning when trend is flat (7-day trend = 0)', () => {
      const cashflow = makeCashFlowSummary({
        dailyBalances: [],
        sevenDayTrend: 0,
      });
      const insights = computeInsights({
        budgetSummary: makeBudgetSummary(),
        cashFlowSummary: cashflow,
        dateRange,
      });
      const trend = insights.find((i) => i.category === 'cashflow' && i.type === 'warning');
      expect(trend).toBeUndefined();
    });
  });

  describe('Rule 3: Savings Rate', () => {
    it('warns when savings rate < 10%', () => {
      const summary = makeBudgetSummary({
        savingsCapacity: { recommendedAmount: 500, savingsRate: 6, surplus: 300 },
      });
      const insights = computeInsights({ budgetSummary: summary, cashFlowSummary: makeCashFlowSummary(), dateRange });
      const savingsWarn = insights.find((i) => i.category === 'savings' && i.type === 'warning');
      expect(savingsWarn).toBeDefined();
    });

    it('success when savings rate >= 20%', () => {
      const summary = makeBudgetSummary({
        savingsCapacity: { recommendedAmount: 1250, savingsRate: 25, surplus: 2000 },
      });
      const insights = computeInsights({ budgetSummary: summary, cashFlowSummary: makeCashFlowSummary(), dateRange });
      const savingsSuccess = insights.find((i) => i.category === 'savings' && i.type === 'success');
      expect(savingsSuccess).toBeDefined();
    });

    it('no savings insight when income is zero', () => {
      const summary = makeBudgetSummary({
        income: { total: 0, averageDaily: 0 },
        savingsCapacity: { recommendedAmount: 0, savingsRate: 0, surplus: 0 },
      });
      const insights = computeInsights({ budgetSummary: summary, cashFlowSummary: makeCashFlowSummary(), dateRange });
      const savings = insights.find((i) => i.category === 'savings');
      expect(savings).toBeUndefined();
    });
  });

  describe('Rule 4: Spending Velocity', () => {
    it('warns when spending pace exceeds 1.3x expected', () => {
      const summary = makeBudgetSummary({
        budgetStatus: {
          categories: [],
          overBudget: [],
          underBudget: [],
          totalBudgeted: 310,
          totalSpent: 500,
          totalRemaining: -190,
        },
      });
      const insights = computeInsights({
        budgetSummary: summary,
        cashFlowSummary: makeCashFlowSummary(),
        dateRange: { start: '2026-07-01', end: '2026-07-31' },
      });
      const velocity = insights.find((i) => i.category === 'spending');
      expect(velocity).toBeDefined();
      expect(velocity!.type).toBe('warning');
    });

    it('no warning when pace is healthy', () => {
      const summary = makeBudgetSummary({
        budgetStatus: {
          categories: [],
          overBudget: [],
          underBudget: [],
          totalBudgeted: 3000,
          totalSpent: 50,
          totalRemaining: 2950,
        },
      });
      const insights = computeInsights({
        budgetSummary: summary,
        cashFlowSummary: makeCashFlowSummary(),
        dateRange: { start: '2026-07-01', end: '2026-07-31' },
      });
      const velocity = insights.find((i) => i.category === 'spending');
      expect(velocity).toBeUndefined();
    });
  });

  describe('Rule 5: Unusual Spending', () => {
    it('warns when category spending spikes > 50% vs previous month', () => {
      const summary = makeBudgetSummary({
        expenses: {
          total: 900,
          byCategory: [
            { categoryId: 'cat-1', categoryName: 'Entertainment', amount: 900, percentage: 100, transactionCount: 1 },
          ],
        },
      });
      const previousMonthSpending: Record<string, number> = { 'cat-1': 500 };
      const insights = computeInsights({
        budgetSummary: summary,
        cashFlowSummary: makeCashFlowSummary(),
        dateRange,
        previousMonthSpending,
      });
      const unusual = insights.find((i) => i.category === 'spending');
      expect(unusual).toBeDefined();
      expect(unusual!.title).toContain('Entertainment');
    });

    it('no warning when spending is similar or less than previous month', () => {
      const summary = makeBudgetSummary({
        expenses: {
          total: 450,
          byCategory: [
            { categoryId: 'cat-1', categoryName: 'Entertainment', amount: 450, percentage: 100, transactionCount: 1 },
          ],
        },
      });
      const previousMonthSpending: Record<string, number> = { 'cat-1': 500 };
      const insights = computeInsights({
        budgetSummary: summary,
        cashFlowSummary: makeCashFlowSummary(),
        dateRange,
        previousMonthSpending,
      });
      const unusual = insights.find((i) => i.category === 'spending');
      expect(unusual).toBeUndefined();
    });

    it('skips if no previous month data provided', () => {
      const summary = makeBudgetSummary({
        expenses: {
          total: 900,
          byCategory: [
            { categoryId: 'cat-1', categoryName: 'Entertainment', amount: 900, percentage: 100, transactionCount: 1 },
          ],
        },
      });
      const insights = computeInsights({
        budgetSummary: summary,
        cashFlowSummary: makeCashFlowSummary(),
        dateRange,
      });
      const unusual = insights.find((i) => i.category === 'spending');
      expect(unusual).toBeUndefined();
    });
  });
});
