import { describe, it, expect } from 'vitest';
import { calculateBudgetRemaining, calculateBudgetUsage, calculateBudgetVariance, calculateBudgetStatus, calculateCategoryTotals, calculatePercentBudget, calculateRollover, calculateMonthlyTotals, calculateBudgetAdherence } from '../budget';
import type { TransactionInput } from '../transactions';
import type { BudgetInput } from '../budget';

const transactions: TransactionInput[] = [
  { id: '1', account_id: 'a1', category_id: 'c1', amount: -200, date: '2024-01-05', merchant: null, note: null, is_archived: false, type: 'expense' },
  { id: '2', account_id: 'a1', category_id: 'c1', amount: -150, date: '2024-01-10', merchant: null, note: null, is_archived: false, type: 'expense' },
  { id: '3', account_id: 'a1', category_id: 'c2', amount: -300, date: '2024-01-15', merchant: null, note: null, is_archived: false, type: 'expense' },
];

const budgets: BudgetInput[] = [
  { category_id: 'c1', year: 2024, month: 1, amount: 500, rollover: false },
  { category_id: 'c2', year: 2024, month: 1, amount: 400, rollover: true },
];

describe('calculateBudgetRemaining', () => {
  it('returns budgeted - spent', () => expect(calculateBudgetRemaining(500, 350)).toBe(150));
  it('never returns negative', () => expect(calculateBudgetRemaining(100, 200)).toBe(0));
});

describe('calculateBudgetUsage', () => {
  it('returns percentage used', () => expect(calculateBudgetUsage(500, 350)).toBe(70));
  it('returns 0 when budgeted is 0 and spent is 0', () => expect(calculateBudgetUsage(0, 0)).toBe(0));
  it('returns 100 when budgeted is 0 and spent > 0', () => expect(calculateBudgetUsage(0, 100)).toBe(100));
});

describe('calculateBudgetVariance', () => {
  it('returns negative when under budget', () => expect(calculateBudgetVariance(500, 350)).toBe(-150));
  it('returns positive when over budget', () => expect(calculateBudgetVariance(500, 600)).toBe(100));
});

describe('calculateBudgetStatus', () => {
  it('returns under when < 75%', () => expect(calculateBudgetStatus(50)).toBe('under'));
  it('returns on_track when 75-89%', () => expect(calculateBudgetStatus(80)).toBe('on_track'));
  it('returns at_limit when 90-100%', () => expect(calculateBudgetStatus(95)).toBe('at_limit'));
  it('returns over when > 100%', () => expect(calculateBudgetStatus(150)).toBe('over'));
});

describe('calculateCategoryTotals', () => {
  it('computes per-category budget breakdown', () => {
    const result = calculateCategoryTotals(transactions, budgets);
    expect(result).toHaveLength(2);

    const c1 = result.find((r) => r.categoryId === 'c1')!;
    expect(c1.budgeted).toBe(500);
    expect(c1.spent).toBe(350);
    expect(c1.remaining).toBe(150);
    expect(c1.percentUsed).toBe(70);
    expect(c1.status).toBe('under');

    const c2 = result.find((r) => r.categoryId === 'c2')!;
    expect(c2.budgeted).toBe(400);
    expect(c2.spent).toBe(300);
    expect(c2.remaining).toBe(100);
    expect(c2.percentUsed).toBe(75);
    expect(c2.status).toBe('on_track');
  });
});

describe('calculatePercentBudget', () => {
  it('returns percentage of total', () => expect(calculatePercentBudget(300, 1000)).toBe(30));
  it('returns 0 when total is 0', () => expect(calculatePercentBudget(100, 0)).toBe(0));
});

describe('calculateRollover', () => {
  it('returns remaining + previous when enabled', () => expect(calculateRollover(150, 50, true)).toBe(200));
  it('returns 0 when disabled', () => expect(calculateRollover(150, 50, false)).toBe(0));
  it('handles negative remaining', () => expect(calculateRollover(-50, 100, true)).toBe(100));
});

describe('calculateMonthlyTotals', () => {
  it('returns complete budget summary', () => {
    const result = calculateMonthlyTotals(transactions, budgets);
    expect(result.totalBudgeted).toBe(900);
    expect(result.totalSpent).toBe(650);
    expect(result.totalRemaining).toBe(250);
    expect(result.categories).toHaveLength(2);
    expect(result.overBudget).toHaveLength(0);
    expect(result.underBudget).toHaveLength(2);
  });
});

describe('calculateBudgetAdherence', () => {
  it('returns 100 when no budgets over', () => {
    const statuses = [
      { categoryId: 'c1', categoryName: '', budgeted: 500, spent: 300, remaining: 200, percentUsed: 60, status: 'under' as const },
    ];
    expect(calculateBudgetAdherence(statuses)).toBe(100);
  });
  it('returns 50 when half are over', () => {
    const statuses = [
      { categoryId: 'c1', categoryName: '', budgeted: 100, spent: 200, remaining: 0, percentUsed: 200, status: 'over' as const },
      { categoryId: 'c2', categoryName: '', budgeted: 100, spent: 50, remaining: 50, percentUsed: 50, status: 'under' as const },
    ];
    expect(calculateBudgetAdherence(statuses)).toBe(50);
  });
});
