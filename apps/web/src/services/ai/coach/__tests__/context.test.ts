import { describe, it, expect } from 'vitest';
import { buildCoachContext } from '../context';
import { makeSnapshot } from './fixtures';

describe('tiered context (Phase 4)', () => {
  it('only includes basic + forecast tiers for a forecast question', () => {
    const snapshot = makeSnapshot();
    const ctx = buildCoachContext(snapshot, 'forecast');

    expect(ctx.intent).toBe('forecast');
    expect(ctx.tiers).toEqual(['basic', 'forecast']);
    expect(ctx.basic).toBeDefined();
    expect(ctx.forecast).toBeDefined();
    expect(ctx.spending).toBeUndefined();
    expect(ctx.budget).toBeUndefined();
    expect(ctx.debt).toBeUndefined();
    expect(ctx.goal).toBeUndefined();
    expect(ctx.health).toBeUndefined();
  });

  it('includes spending + budget for a spending question', () => {
    const ctx = buildCoachContext(makeSnapshot(), 'spending_analysis');
    expect(ctx.tiers).toContain('spending');
    expect(ctx.tiers).toContain('budget');
    expect(ctx.spending).toBeDefined();
    expect(ctx.budget).toBeDefined();
    expect(ctx.forecast).toBeUndefined();
  });

  it('computes month-over-month spending change', () => {
    const snapshot = makeSnapshot({
      currentMonth: {
        label: '2026-08', startDate: '2026-08-01', endDate: '2026-08-31',
        income: 5000, expenses: 4025,
        byCategory: [
          { categoryId: 'c1', categoryName: 'Food', amount: 900, percentage: 22.4, transactionCount: 0 },
        ],
      },
      previousMonth: {
        label: '2026-07', startDate: '2026-07-01', endDate: '2026-07-31',
        income: 5000, expenses: 3500,
        byCategory: [
          { categoryId: 'c1', categoryName: 'Food', amount: 700, percentage: 20, transactionCount: 0 },
        ],
      },
    });

    const ctx = buildCoachContext(snapshot, 'spending_analysis');
    expect(ctx.spending?.change).toBe(525);
    expect(ctx.spending?.changePercent).toBeCloseTo(15, 5);
    expect(ctx.spending?.topCategories[0]?.name).toBe('Food');
  });

  it('exposes authoritative net worth in the basic tier', () => {
    const ctx = buildCoachContext(makeSnapshot(), 'general_finance');
    expect(ctx.basic?.netWorth).toBe(25000);
    expect(ctx.basic?.monthlyIncome).toBe(5000);
  });
});
