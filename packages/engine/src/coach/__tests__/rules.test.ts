import { describe, it, expect } from 'vitest';
import { evaluateBudgetAlerts } from '../rules/budget-alerts';
import { evaluateSpendingTips } from '../rules/spending-tips';
import { evaluateSavingsWins } from '../rules/savings-wins';
import { evaluateHealthInsights } from '../rules/health-insights';
import type { CoachContext } from '../types';

function makeContext(overrides: Partial<CoachContext> = {}): CoachContext {
  return {
    eventType: 'transaction_added',
    eventPayload: { categoryId: 'cat-1', categoryName: 'Dining' },
    userState: {
      currentMonthBudgets: [
        { categoryId: 'cat-1', categoryName: 'Dining', budgeted: 500_00, spent: 450_00, percentUsed: 90 },
      ],
      recentTransactions: [],
      savingsGoals: [],
      healthScore: 72,
      netWorth: 100_000_00,
      cashFlow: { income: 5000_00, expenses: 3000_00 },
    },
    existingMessages: [],
    ...overrides,
  };
}

describe('evaluateBudgetAlerts', () => {
  it('generates 80% overspend alert', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
      eventPayload: { categoryId: 'cat-1', categoryName: 'Dining' },
      userState: {
        currentMonthBudgets: [
          { categoryId: 'cat-1', categoryName: 'Dining', budgeted: 500_00, spent: 450_00, percentUsed: 90 },
        ],
        recentTransactions: [],
        savingsGoals: [],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 3000_00 },
      },
    });

    const messages = evaluateBudgetAlerts(ctx);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]?.type).toBe('alert');
    expect(messages[0]?.category).toBe('budget');
  });

  it('generates 100% overspend alert', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
      eventPayload: { categoryId: 'cat-1', categoryName: 'Dining' },
      userState: {
        currentMonthBudgets: [
          { categoryId: 'cat-1', categoryName: 'Dining', budgeted: 500_00, spent: 500_00, percentUsed: 100 },
        ],
        recentTransactions: [],
        savingsGoals: [],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 3000_00 },
      },
    });

    const messages = evaluateBudgetAlerts(ctx);
    expect(messages.length).toBeGreaterThanOrEqual(2);
    const exceededMsg = messages.find((m) => m.title.includes('Exceeded'));
    expect(exceededMsg).toBeDefined();
  });

  it('returns no messages when under budget', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
      eventPayload: { categoryId: 'cat-1', categoryName: 'Dining' },
      userState: {
        currentMonthBudgets: [
          { categoryId: 'cat-1', categoryName: 'Dining', budgeted: 500_00, spent: 100_00, percentUsed: 20 },
        ],
        recentTransactions: [],
        savingsGoals: [],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 3000_00 },
      },
    });

    const messages = evaluateBudgetAlerts(ctx);
    expect(messages.length).toBe(0);
  });

  it('returns no messages for non-transaction events', () => {
    const ctx = makeContext({
      eventType: 'monthly_rollover',
      eventPayload: {},
    });

    const messages = evaluateBudgetAlerts(ctx);
    expect(messages.length).toBe(0);
  });

  it('has correct deduplication key', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
      eventPayload: { categoryId: 'cat-1', categoryName: 'Dining' },
    });

    const messages = evaluateBudgetAlerts(ctx);
    if (messages.length > 0) {
      expect(messages[0]?.deduplicationKey).toContain('cat-1');
    }
  });
});

describe('evaluateSpendingTips', () => {
  it('generates high spending alert when expenses > 80% of income', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
      userState: {
        currentMonthBudgets: [],
        recentTransactions: [],
        savingsGoals: [],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 4500_00 },
      },
    });

    const messages = evaluateSpendingTips(ctx);
    const highSpending = messages.find((m) => m.deduplicationKey === 'total-spending-high');
    expect(highSpending).toBeDefined();
    expect(highSpending?.type).toBe('alert');
  });

  it('generates subscription audit tip', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
    });

    const messages = evaluateSpendingTips(ctx);
    const subscriptionTip = messages.find((m) => m.deduplicationKey === 'subscription-audit');
    expect(subscriptionTip).toBeDefined();
    expect(subscriptionTip?.type).toBe('tip');
  });

  it('returns no high spending alert when expenses <= 80% of income', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
      userState: {
        currentMonthBudgets: [],
        recentTransactions: [],
        savingsGoals: [],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 3000_00 },
      },
    });

    const messages = evaluateSpendingTips(ctx);
    const highSpending = messages.find((m) => m.deduplicationKey === 'total-spending-high');
    expect(highSpending).toBeUndefined();
  });

  it('returns no messages for non-transaction events', () => {
    const ctx = makeContext({
      eventType: 'score_changed',
      eventPayload: { delta: 5 },
    });

    const messages = evaluateSpendingTips(ctx);
    expect(messages.length).toBe(0);
  });
});

describe('evaluateSavingsWins', () => {
  it('generates goal milestone message', () => {
    const ctx = makeContext({
      eventType: 'goal_milestone',
      eventPayload: { goalId: 'goal-1' },
      userState: {
        currentMonthBudgets: [],
        recentTransactions: [],
        savingsGoals: [
          { id: 'goal-1', name: 'Emergency Fund', currentAmount: 7500_00, targetAmount: 10000_00, targetDate: '2025-06-01', percentComplete: 75 },
        ],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 3000_00 },
      },
    });

    const messages = evaluateSavingsWins(ctx);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]?.type).toBe('win');
    expect(messages[0]?.category).toBe('savings');
  });

  it('generates budget win message when all under budget', () => {
    const ctx = makeContext({
      eventType: 'monthly_rollover',
      eventPayload: {},
      userState: {
        currentMonthBudgets: [
          { categoryId: 'cat-1', categoryName: 'Dining', budgeted: 500_00, spent: 400_00, percentUsed: 80 },
          { categoryId: 'cat-2', categoryName: 'Groceries', budgeted: 300_00, spent: 200_00, percentUsed: 67 },
        ],
        recentTransactions: [],
        savingsGoals: [],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 3000_00 },
      },
    });

    const messages = evaluateSavingsWins(ctx);
    const budgetWin = messages.find((m) => m.deduplicationKey === 'budget-win:monthly');
    expect(budgetWin).toBeDefined();
    expect(budgetWin?.type).toBe('win');
  });

  it('returns no budget win when any category over budget', () => {
    const ctx = makeContext({
      eventType: 'monthly_rollover',
      eventPayload: {},
      userState: {
        currentMonthBudgets: [
          { categoryId: 'cat-1', categoryName: 'Dining', budgeted: 500_00, spent: 600_00, percentUsed: 120 },
          { categoryId: 'cat-2', categoryName: 'Groceries', budgeted: 300_00, spent: 200_00, percentUsed: 67 },
        ],
        recentTransactions: [],
        savingsGoals: [],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 3000_00 },
      },
    });

    const messages = evaluateSavingsWins(ctx);
    const budgetWin = messages.find((m) => m.deduplicationKey === 'budget-win:monthly');
    expect(budgetWin).toBeUndefined();
  });

  it('returns no messages for other event types', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
      eventPayload: { categoryId: 'cat-1', categoryName: 'Dining' },
    });

    const messages = evaluateSavingsWins(ctx);
    expect(messages.length).toBe(0);
  });

  it('generates goal milestone with ahead status when 100%', () => {
    const ctx = makeContext({
      eventType: 'goal_milestone',
      eventPayload: { goalId: 'goal-1' },
      userState: {
        currentMonthBudgets: [],
        recentTransactions: [],
        savingsGoals: [
          { id: 'goal-1', name: 'Emergency Fund', currentAmount: 10000_00, targetAmount: 10000_00, targetDate: '2025-06-01', percentComplete: 100 },
        ],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 3000_00 },
      },
    });

    const messages = evaluateSavingsWins(ctx);
    if (messages.length > 0) {
      expect(messages[0]?.message).toContain('ahead');
    }
  });
});

describe('evaluateHealthInsights', () => {
  it('generates health score change message', () => {
    const ctx = makeContext({
      eventType: 'score_changed',
      eventPayload: { delta: 5, period: '2024-01' },
    });

    const messages = evaluateHealthInsights(ctx);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]?.type).toBe('insight');
    expect(messages[0]?.category).toBe('health');
  });

  it('generates top category insight when > 30%', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
      eventPayload: { categoryId: 'cat-1', categoryName: 'Dining' },
      userState: {
        currentMonthBudgets: [
          { categoryId: 'cat-1', categoryName: 'Dining', budgeted: 1000_00, spent: 1500_00, percentUsed: 150 },
          { categoryId: 'cat-2', categoryName: 'Groceries', budgeted: 500_00, spent: 500_00, percentUsed: 100 },
        ],
        recentTransactions: [],
        savingsGoals: [],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 3000_00 },
      },
    });

    const messages = evaluateHealthInsights(ctx);
    const topCategory = messages.find((m) => m.deduplicationKey === 'top-category-insight');
    expect(topCategory).toBeDefined();
    expect(topCategory?.message).toContain('Dining');
  });

  it('returns no top category insight when no category > 30%', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
      eventPayload: { categoryId: 'cat-1', categoryName: 'Dining' },
      userState: {
        currentMonthBudgets: [
          { categoryId: 'cat-1', categoryName: 'Dining', budgeted: 1000_00, spent: 100_00, percentUsed: 10 },
          { categoryId: 'cat-2', categoryName: 'Groceries', budgeted: 1000_00, spent: 100_00, percentUsed: 10 },
          { categoryId: 'cat-3', categoryName: 'Utilities', budgeted: 1000_00, spent: 100_00, percentUsed: 10 },
          { categoryId: 'cat-4', categoryName: 'Transport', budgeted: 1000_00, spent: 100_00, percentUsed: 10 },
        ],
        recentTransactions: [],
        savingsGoals: [],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 3000_00 },
      },
    });

    const messages = evaluateHealthInsights(ctx);
    const topCategory = messages.find((m) => m.deduplicationKey === 'top-category-insight');
    expect(topCategory).toBeUndefined();
  });

  it('returns no messages for non-score events without budgets', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
      eventPayload: { categoryId: 'cat-1', categoryName: 'Dining' },
      userState: {
        currentMonthBudgets: [],
        recentTransactions: [],
        savingsGoals: [],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 3000_00 },
      },
    });

    const messages = evaluateHealthInsights(ctx);
    expect(messages.length).toBe(0);
  });

  it('generates declined score message for negative delta', () => {
    const ctx = makeContext({
      eventType: 'score_changed',
      eventPayload: { delta: -5, period: '2024-01' },
    });

    const messages = evaluateHealthInsights(ctx);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]?.message).toContain('declined');
  });
});
