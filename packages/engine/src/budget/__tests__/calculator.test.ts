import { describe, it, expect } from 'vitest';
import { computeBudgetSummary } from '../calculator';

describe('computeBudgetSummary', () => {
  it('returns correct summary for simple case', () => {
    const result = computeBudgetSummary({
      budgets: [
        { categoryId: 'cat-1', amount: 1000_00, percentage: null, rolloverEnabled: false },
        { categoryId: 'cat-2', amount: 500_00, percentage: null, rolloverEnabled: false },
      ],
      transactions: [
        { categoryId: 'cat-1', totalAmount: -800_00 },
        { categoryId: 'cat-2', totalAmount: -300_00 },
      ],
      previousMonthRollovers: [],
      totalIncome: 5000_00,
    });

    expect(result.categories).toHaveLength(2);
    expect(result.overall.totalBudgeted).toBe(1500_00);
    expect(result.overall.totalSpent).toBe(1100_00);
    expect(result.overall.remaining).toBe(400_00);
  });

  it('handles percentage-based budgets', () => {
    const result = computeBudgetSummary({
      budgets: [
        { categoryId: 'cat-1', amount: null, percentage: 0.30, rolloverEnabled: false },
      ],
      transactions: [
        { categoryId: 'cat-1', totalAmount: -1000_00 },
      ],
      previousMonthRollovers: [],
      totalIncome: 5000_00,
    });

    expect(result.categories[0]?.budgeted).toBe(1500_00);
    expect(result.categories[0]?.spent).toBe(1000_00);
  });

  it('applies rollover when enabled', () => {
    const result = computeBudgetSummary({
      budgets: [
        { categoryId: 'cat-1', amount: 1000_00, percentage: null, rolloverEnabled: true },
      ],
      transactions: [
        { categoryId: 'cat-1', totalAmount: -600_00 },
      ],
      previousMonthRollovers: [
        { categoryId: 'cat-1', unspentAmount: 200_00 },
      ],
      totalIncome: 5000_00,
    });

    expect(result.categories[0]?.available).toBe(600_00);
  });

  it('handles empty budgets', () => {
    const result = computeBudgetSummary({
      budgets: [],
      transactions: [],
      previousMonthRollovers: [],
      totalIncome: 0,
    });

    expect(result.categories).toHaveLength(0);
    expect(result.overall.totalBudgeted).toBe(0);
    expect(result.overall.totalSpent).toBe(0);
  });

  it('computes overspend status correctly', () => {
    const result = computeBudgetSummary({
      budgets: [
        { categoryId: 'cat-1', amount: 100_00, percentage: null, rolloverEnabled: false },
      ],
      transactions: [
        { categoryId: 'cat-1', totalAmount: -150_00 },
      ],
      previousMonthRollovers: [],
      totalIncome: 1000_00,
    });

    expect(result.categories[0]?.percentUsed).toBeGreaterThan(100);
    expect(result.categories[0]?.status).toBe('over');
  });

  it('falls back to 0 when budget has neither amount nor percentage', () => {
    const result = computeBudgetSummary({
      budgets: [
        { categoryId: 'cat-1', amount: null, percentage: null, rolloverEnabled: false },
      ],
      transactions: [],
      previousMonthRollovers: [],
      totalIncome: 0,
    });

    expect(result.categories[0]?.budgeted).toBe(0);
  });
});
