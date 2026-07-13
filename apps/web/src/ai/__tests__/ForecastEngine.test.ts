import { describe, it, expect } from 'vitest';
import { generateForecasts, calculateSavingsCompletionDate, calculateMortgageImpact } from '@/ai/ForecastEngine';
import type { AiContext } from '@/ai/types';

function createMockContext(overrides?: Partial<AiContext>): AiContext {
  return {
    budgetSummary: {
      income: { total: 5000, averageDaily: 166.67 },
      expenses: { total: 3500, byCategory: [] },
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
      goals: [{ id: '1', name: 'Vacation', target: 5000, current: 2000, progress: { percentComplete: 40, monthsRemaining: 6, onTrack: true, estimatedCompletionDate: '2026-01-01', remainingAmount: 3000, status: 'on_track', daysRemaining: 180 } }],
      dashboard: { totalSaved: 2000, activeGoals: 1, completedGoals: 0, largestGoal: { name: 'Vacation', target: 5000, current: 2000 }, totalTarget: 5000 },
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

describe('ForecastEngine', () => {
  it('generates spending and cash flow forecasts', () => {
    const ctx = createMockContext();
    const forecasts = generateForecasts(ctx, 3);

    expect(forecasts.length).toBeGreaterThanOrEqual(2);

    const spending = forecasts.find((f) => f.type === 'spending');
    expect(spending).toBeDefined();
    expect(spending?.months.length).toBe(3);

    const cashflow = forecasts.find((f) => f.type === 'cashflow');
    expect(cashflow).toBeDefined();
    expect(cashflow?.months.length).toBe(3);
  });

  it('generates savings forecast for active goals', () => {
    const ctx = createMockContext();
    const forecasts = generateForecasts(ctx, 6);

    const savings = forecasts.find((f) => f.type === 'savings');
    expect(savings).toBeDefined();
    expect(savings?.title).toContain('Vacation');
    expect(savings?.trend).toBe('up');
  });

  it('generates mortgage forecast when mortgage exists', () => {
    const ctx = createMockContext({
      mortgage: {
        dashboard: {
          remainingBalance: 200000,
          monthlyPayment: 1500,
          payoffDate: '2055-01-01',
          totalInterest: 180000,
          totalPrincipal: 300000,
          interestPaid: 50000,
          principalPaid: 50000,
          progressPct: 16.7,
        },
        details: {
          monthlyPayment: 1500,
          schedule: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            date: `2025-${String(i + 1).padStart(2, '0')}-01`,
            payment: 1500,
            principal: 400,
            interest: 1100,
            remainingBalance: 300000 - 400 * (i + 1),
            extraPayment: 0,
          })),
          totalPayments: 360,
          totalPrincipal: 300000,
          totalInterest: 180000,
          payoffDate: '2055-01-01',
          payoffMonths: 360,
          interestSaved: 0,
        },
      },
    });

    const forecasts = generateForecasts(ctx, 6);
    const mortgageFc = forecasts.find((f) => f.type === 'mortgage');
    expect(mortgageFc).toBeDefined();
    expect(mortgageFc?.trend).toBe('down');
  });

  it('calculates savings completion date', () => {
    const result = calculateSavingsCompletionDate(1000, 5000, 500);
    expect(result.months).toBe(8);
    expect(result.date).toBeTruthy();
  });

  it('returns infinity for zero contribution', () => {
    const result = calculateSavingsCompletionDate(1000, 5000, 0);
    expect(result.months).toBe(Infinity);
  });

  it('calculates mortgage impact of extra payments', () => {
    const result = calculateMortgageImpact(300000, 6.5, 1896.20, 200);
    expect(result.monthsSaved).toBeGreaterThan(0);
    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.newPayoffMonths).toBeGreaterThan(0);
  });

  it('handles zero principal', () => {
    const result = calculateMortgageImpact(0, 6.5, 0, 0);
    expect(result.monthsSaved).toBe(0);
    expect(result.interestSaved).toBe(0);
    expect(result.newPayoffMonths).toBe(0);
  });
});
