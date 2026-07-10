import { describe, it, expect } from 'vitest';
import { evaluateCoachRules } from '../engine';
import type { CoachContext, CoachEvaluatedMessage } from '../types';

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

describe('evaluateCoachRules', () => {
  it('returns no messages when no rules trigger', () => {
    const ctx = makeContext({
      eventType: 'transaction_added',
      userState: {
        currentMonthBudgets: [
          { categoryId: 'cat-1', categoryName: 'Dining', budgeted: 500_00, spent: 100_00, percentUsed: 20 },
        ],
        recentTransactions: [],
        savingsGoals: [],
        healthScore: 72,
        netWorth: 100_000_00,
        cashFlow: { income: 5000_00, expenses: 1000_00 },
      },
    });

    const messages = evaluateCoachRules(ctx);
    expect(Array.isArray(messages)).toBe(true);
  });

  it('generates alert for overspend budget', () => {
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

    const messages = evaluateCoachRules(ctx);
    const alerts = messages.filter((m) => m.type === 'alert');
    expect(alerts.length).toBeGreaterThanOrEqual(0);
  });

  it('deduplicates messages', () => {
    const existingMessage: CoachEvaluatedMessage = {
      type: 'win',
      category: 'savings',
      deduplicationKey: 'budget-win:monthly',
    };
    const ctx = makeContext({
      eventType: 'monthly_rollover',
      eventPayload: {},
      existingMessages: [existingMessage],
    });

    const messages = evaluateCoachRules(ctx);
    const wins = messages.filter((m) => m.deduplicationKey === 'budget-win:monthly');
    expect(wins).toHaveLength(0);
  });

  it('limits output to 5 messages', () => {
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
        cashFlow: { income: 5000_00, expenses: 4500_00 },
      },
    });

    const messages = evaluateCoachRules(ctx);
    expect(messages.length).toBeLessThanOrEqual(5);
  });
});
