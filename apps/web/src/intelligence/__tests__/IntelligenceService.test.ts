import { describe, it, expect } from 'vitest';
import { generate } from '../IntelligenceService';
import type { IntelligenceInput } from '../types';

function createMinimalInput(): IntelligenceInput {
  return {
    budgetSummary: {
      income: { total: 5000, averageDaily: 166.67 },
      expenses: {
        total: 3500,
        byCategory: [
          { categoryId: 'cat1', categoryName: 'Housing', amount: 1500, percentage: 42.86, transactionCount: 1 },
          { categoryId: 'cat2', categoryName: 'Food', amount: 500, percentage: 14.29, transactionCount: 10 },
        ],
      },
      cashFlow: {
        netIncome: 1500,
        dailySpendingAllowance: 50,
        safeToSpendToday: 30,
        projectedEndBalance: 1200,
      },
      budgetStatus: {
        categories: [
          { categoryId: 'cat1', categoryName: 'Housing', budgeted: 1600, spent: 1500, remaining: 100, percentUsed: 93.75, status: 'on_track' },
          { categoryId: 'cat2', categoryName: 'Food', budgeted: 600, spent: 500, remaining: 100, percentUsed: 83.33, status: 'on_track' },
        ],
        overBudget: [],
        underBudget: [],
        totalBudgeted: 2200,
        totalSpent: 2000,
        totalRemaining: 200,
      },
      accounts: {
        netWorth: 25000,
        remainingCash: 5000,
        totalAssets: 35000,
        totalLiabilities: 10000,
        accountCount: 3,
      },
      savingsCapacity: {
        recommendedAmount: 1000,
        savingsRate: 15,
        surplus: 500,
      },
      alerts: [],
    },
    cashFlowSummary: {
      dailyBalances: [
        { date: '2026-07-01', income: 5000, expenses: 1000, net: 4000, runningBalance: 4000 },
        { date: '2026-07-02', income: 0, expenses: 500, net: -500, runningBalance: 3500 },
      ],
      sevenDayTrend: 100,
      thirtyDayTrend: 500,
      incomeVsExpenseRatio: 1.43,
      totalIncome: 5000,
      totalExpenses: 3500,
      netFlow: 1500,
    },
    savingsGoals: [
      {
        id: 'goal1',
        user_id: 'user1',
        name: 'Emergency Fund',
        target_amount: 10000,
        current_amount: 5000,
        target_date: null,
        priority: 1,
        status: 'active',
        created_at: '2026-01-01T00:00:00Z',
      },
    ],
    transactions: [
      { id: 'txn1', amount: -100, date: '2026-07-01', category: 'Food', merchant: 'Grocery Store' },
      { id: 'txn2', amount: -50, date: '2026-07-02', category: 'Food', merchant: 'Cafe' },
    ],
  };
}

describe('IntelligenceService', () => {
  it('generates all expected output fields', () => {
    const input = createMinimalInput();
    const output = generate(input);

    expect(output).toHaveProperty('healthScore');
    expect(output).toHaveProperty('alerts');
    expect(output).toHaveProperty('recommendations');
    expect(output).toHaveProperty('notifications');
    expect(output).toHaveProperty('spendingPatterns');
    expect(output).toHaveProperty('trends');
    expect(output).toHaveProperty('goalAnalyses');
    expect(output).toHaveProperty('weeklySummary');
    expect(output).toHaveProperty('monthlyReview');
  });

  it('computes a health score between 0 and 100', () => {
    const input = createMinimalInput();
    const output = generate(input);

    expect(output.healthScore.overallScore).toBeGreaterThanOrEqual(0);
    expect(output.healthScore.overallScore).toBeLessThanOrEqual(100);
    expect(output.healthScore.factors.length).toBeGreaterThan(0);
    expect(output.healthScore.improvementSuggestions).toBeDefined();
    expect(output.healthScore.trend.length).toBeGreaterThanOrEqual(2);
  });

  it('returns alerts array', () => {
    const input = createMinimalInput();
    const output = generate(input);

    expect(Array.isArray(output.alerts)).toBe(true);
  });

  it('returns recommendations array', () => {
    const input = createMinimalInput();
    const output = generate(input);

    expect(Array.isArray(output.recommendations)).toBe(true);
  });

  it('returns notifications array', () => {
    const input = createMinimalInput();
    const output = generate(input);

    expect(Array.isArray(output.notifications)).toBe(true);
  });

  it('returns spendingPatterns with expected fields', () => {
    const input = createMinimalInput();
    const output = generate(input);

    expect(output.spendingPatterns).toHaveProperty('weeklyAverage');
    expect(output.spendingPatterns).toHaveProperty('weekendSpending');
    expect(output.spendingPatterns).toHaveProperty('weekdaySpending');
    expect(output.spendingPatterns).toHaveProperty('categoryTrends');
    expect(output.spendingPatterns).toHaveProperty('recurringMerchants');
  });

  it('returns trend data', () => {
    const input = createMinimalInput();
    const output = generate(input);

    expect(output.trends).toHaveProperty('dailyBalances');
    expect(output.trends).toHaveProperty('weeklyAverages');
    expect(output.trends).toHaveProperty('monthlyAverages');
    expect(output.trends).toHaveProperty('trend');
    expect(output.trends).toHaveProperty('volatility');
  });

  it('returns goal analyses for each goal', () => {
    const input = createMinimalInput();
    const output = generate(input);

    expect(output.goalAnalyses).toHaveProperty('goal1');
    expect(output.goalAnalyses.goal1).toHaveProperty('projectedCompletion');
    expect(output.goalAnalyses.goal1).toHaveProperty('probability');
    expect(output.goalAnalyses.goal1).toHaveProperty('onTrack');
  });

  it('returns a weekly summary', () => {
    const input = createMinimalInput();
    const output = generate(input);

    expect(output.weeklySummary).not.toBeNull();
    expect(output.weeklySummary).toHaveProperty('weekEnding');
    expect(output.weeklySummary).toHaveProperty('totalSpent');
  });

  it('returns a monthly review', () => {
    const input = createMinimalInput();
    const output = generate(input);

    expect(output.monthlyReview).not.toBeNull();
    expect(output.monthlyReview).toHaveProperty('month');
    expect(output.monthlyReview).toHaveProperty('healthScore');
  });
});
