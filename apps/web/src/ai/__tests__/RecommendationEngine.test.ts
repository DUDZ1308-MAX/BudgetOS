import { describe, it, expect } from 'vitest';
import { generateRecommendations } from '@/ai/RecommendationEngine';
import type { AiContext } from '@/ai/types';

function createMockContext(overrides?: Partial<AiContext>): AiContext {
  return {
    budgetSummary: {
      income: { total: 5000, averageDaily: 166.67 },
      expenses: { total: 4000, byCategory: [] },
      cashFlow: { netIncome: 1000, dailySpendingAllowance: 133.33, safeToSpendToday: 30, projectedEndBalance: 1500 },
      budgetStatus: {
        categories: [
          { categoryId: '1', categoryName: 'Food', budgeted: 500, spent: 650, remaining: -150, percentUsed: 130, status: 'over' },
        ],
        overBudget: [
          { categoryId: '1', categoryName: 'Food', budgeted: 500, spent: 650, remaining: -150, percentUsed: 130, status: 'over' },
        ],
        underBudget: [],
        totalBudgeted: 3000,
        totalSpent: 2800,
        totalRemaining: 200,
      },
      accounts: { netWorth: 15000, remainingCash: 5000, totalAssets: 25000, totalLiabilities: 10000, accountCount: 3 },
      savingsCapacity: { recommendedAmount: 500, savingsRate: 10, surplus: 200 },
      alerts: [],
    },
    cashFlowSummary: {
      dailyBalances: [],
      sevenDayTrend: -100,
      thirtyDayTrend: -200,
      incomeVsExpenseRatio: 1.25,
      totalIncome: 5000,
      totalExpenses: 4000,
      netFlow: 1000,
    },
    insights: [],
    alerts: [],
    savings: {
      goals: [{ id: '1', name: 'Emergency Fund', target: 10000, current: 3000, progress: { percentComplete: 30, monthsRemaining: 24, onTrack: true, estimatedCompletionDate: '2027-01-01', remainingAmount: 7000, status: 'on_track', daysRemaining: 730 } }],
      dashboard: { totalSaved: 3000, activeGoals: 1, completedGoals: 0, largestGoal: { name: 'Emergency Fund', target: 10000, current: 3000 }, totalTarget: 10000 },
    },
    mortgage: { dashboard: null, details: null },
    safeToSpend: { safeToSpendToday: 30, riskLevel: 'low', explanation: 'On track' },
    recentTransactions: [],
    categories: [],
    netWorth: 15000,
    monthlyIncome: 5000,
    monthlyExpenses: 4000,
    ...overrides,
  };
}

describe('RecommendationEngine', () => {
  it('generates overspend recommendations', () => {
    const ctx = createMockContext();
    const recs = generateRecommendations(ctx);

    const overspendRec = recs.find((r) => r.category === 'budget');
    expect(overspendRec).toBeDefined();
    expect(overspendRec?.title).toContain('Food');
    expect(overspendRec?.priority).toBe('critical');
  });

  it('generates savings recommendations when surplus exists', () => {
    const ctx = createMockContext();
    const recs = generateRecommendations(ctx);

    const savingsRec = recs.find((r) => r.category === 'savings');
    expect(savingsRec).toBeDefined();
    expect(savingsRec?.title).toContain('contribution');
  });

  it('generates mortgage recommendations when mortgage data exists', () => {
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
          paidSoFar: { principal: 50000, interest: 50000 },
          equityBuilt: 50000,
          originalAmount: 300000,
        },
        details: {
          paymentAmount: 1500,
          paymentFrequency: 'monthly',
          paymentsPerYear: 12,
          schedule: [{ month: 1, paymentNumber: 1, date: '2025-02-01', payment: 1500, principal: 400, interest: 1100, cumulativePrincipal: 400, cumulativeInterest: 1100, remainingBalance: 299600, extraPayment: 0 }],
          totalPayments: 360,
          totalPrincipal: 300000,
          totalInterest: 180000,
          totalCost: 480000,
          payoffDate: '2055-01-01',
          payoffMonths: 360,
          interestSaved: 0,
          effectiveAnnualRate: 0.066,
          monthlyEquivalent: 1500,
        },
      },
    });

    const recs = generateRecommendations(ctx);
    const mortgageRec = recs.find((r) => r.category === 'mortgage');
    expect(mortgageRec).toBeDefined();
    expect(mortgageRec?.title).toContain('mortgage');
  });

  it('generates budget allocation adjustment when overspent', () => {
    const ctx = createMockContext({
      budgetSummary: {
        ...createMockContext().budgetSummary,
        budgetStatus: {
          categories: [
            { categoryId: '1', categoryName: 'Food', budgeted: 500, spent: 600, remaining: -100, percentUsed: 120, status: 'over' },
          ],
          overBudget: [
            { categoryId: '1', categoryName: 'Food', budgeted: 500, spent: 600, remaining: -100, percentUsed: 120, status: 'over' },
          ],
          underBudget: [],
          totalBudgeted: 2000,
          totalSpent: 2800,
          totalRemaining: -800,
        },
      },
    });

    const recs = generateRecommendations(ctx);
    const budgetRec = recs.find((r) => r.title.includes('budget allocation'));
    expect(budgetRec).toBeDefined();
    expect(budgetRec?.priority).toBe('high');
  });

  it('returns empty array for empty/zero context', () => {
    const ctx = createMockContext({
      budgetSummary: {
        income: { total: 0, averageDaily: 0 },
        expenses: { total: 0, byCategory: [] },
        cashFlow: { netIncome: 0, dailySpendingAllowance: 0, safeToSpendToday: 0, projectedEndBalance: 0 },
        budgetStatus: { categories: [], overBudget: [], underBudget: [], totalBudgeted: 0, totalSpent: 0, totalRemaining: 0 },
        accounts: { netWorth: 0, remainingCash: 0, totalAssets: 0, totalLiabilities: 0, accountCount: 0 },
        savingsCapacity: { recommendedAmount: 0, savingsRate: 0, surplus: 0 },
        alerts: [],
      },
      savings: {
        goals: [],
        dashboard: { totalSaved: 0, activeGoals: 0, completedGoals: 0, largestGoal: null, totalTarget: 0 },
      },
      mortgage: { dashboard: null, details: null },
      safeToSpend: null,
    });

    const recs = generateRecommendations(ctx);
    expect(recs.length).toBe(0);
  });
});
