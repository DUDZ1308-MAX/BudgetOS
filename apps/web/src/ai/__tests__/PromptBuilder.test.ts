import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildUserPrompt, buildInitialPrompt } from '@/ai/PromptBuilder';
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
    safeToSpend: { safeToSpendToday: 50, riskLevel: 'low', explanation: 'You are on track' },
    recentTransactions: [],
    categories: [],
    netWorth: 15000,
    monthlyIncome: 5000,
    monthlyExpenses: 3500,
    ...overrides,
  };
}

describe('PromptBuilder', () => {
  it('builds a system prompt with financial context', () => {
    const ctx = createMockContext();
    const prompt = buildSystemPrompt(ctx);

    expect(prompt).toContain('MyBudgetOS AI Copilot');
    expect(prompt).toContain('$5000.00');
    expect(prompt).toContain('$3500.00');
    expect(prompt).toContain('$15000.00');
    expect(prompt).toContain('Vacation');
    expect(prompt).toContain('Safe-to-Spend');
  });

  it('includes over-budget categories when present', () => {
    const ctx = createMockContext({
      budgetSummary: {
        ...createMockContext().budgetSummary,
        budgetStatus: {
          categories: [{ categoryId: '1', categoryName: 'Food', budgeted: 500, spent: 600, remaining: -100, percentUsed: 120, status: 'over' }],
          overBudget: [{ categoryId: '1', categoryName: 'Food', budgeted: 500, spent: 600, remaining: -100, percentUsed: 120, status: 'over' }],
          underBudget: [],
          totalBudgeted: 3000,
          totalSpent: 2800,
          totalRemaining: 200,
        },
      },
    });

    const prompt = buildSystemPrompt(ctx);
    expect(prompt).toContain('Over-Budget');
    expect(prompt).toContain('Food');
  });

  it('builds a user prompt wrapping the message', () => {
    const ctx = createMockContext();
    const result = buildUserPrompt('how much did I spend on food?', ctx);
    expect(result).toContain('Based on my current financial situation');
    expect(result).toContain('how much did I spend on food?');
  });

  it('builds an initial greeting with positive context', () => {
    const ctx = createMockContext({
      budgetSummary: {
        ...createMockContext().budgetSummary,
        expenses: {
          total: 3500,
          byCategory: [{ categoryId: '1', categoryName: 'Food', amount: 800, percentage: 22.9, transactionCount: 20 }],
        },
      },
    });
    const greeting = buildInitialPrompt(ctx);
    expect(greeting.length).toBeGreaterThan(0);
    expect(greeting).toContain('top spending category');
  });

  it('builds an initial greeting mentioning overspending', () => {
    const ctx = createMockContext({
      budgetSummary: {
        ...createMockContext().budgetSummary,
        budgetStatus: {
          categories: [{ categoryId: '1', categoryName: 'Food', budgeted: 500, spent: 600, remaining: -100, percentUsed: 120, status: 'over' }],
          overBudget: [{ categoryId: '1', categoryName: 'Food', budgeted: 500, spent: 600, remaining: -100, percentUsed: 120, status: 'over' }],
          underBudget: [],
          totalBudgeted: 3000,
          totalSpent: 2800,
          totalRemaining: 200,
        },
      },
    });

    const greeting = buildInitialPrompt(ctx);
    expect(greeting).toContain('over budget');
    expect(greeting).toContain('Food');
  });

  it('handles empty context gracefully', () => {
    const ctx = createMockContext({
      budgetSummary: {
        ...createMockContext().budgetSummary,
        income: { total: 0, averageDaily: 0 },
        expenses: { total: 0, byCategory: [] },
        cashFlow: { netIncome: 0, dailySpendingAllowance: 0, safeToSpendToday: 0, projectedEndBalance: 0 },
        budgetStatus: { categories: [], overBudget: [], underBudget: [], totalBudgeted: 0, totalSpent: 0, totalRemaining: 0 },
        accounts: { netWorth: 0, remainingCash: 0, totalAssets: 0, totalLiabilities: 0, accountCount: 0 },
        savingsCapacity: { recommendedAmount: 0, savingsRate: 0, surplus: 0 },
        alerts: [],
      },
      safeToSpend: null,
      insights: [],
      alerts: [],
    });

    const greeting = buildInitialPrompt(ctx);
    expect(greeting).toBeTruthy();
  });
});
