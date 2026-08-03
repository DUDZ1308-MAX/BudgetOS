import { describe, it, expect } from 'vitest';
import { buildProactiveInsights } from '../insights';
import { makeSnapshot } from './fixtures';

describe('proactive insights (Phase 11)', () => {
  it('returns at most three insights sorted by severity', () => {
    const snapshot = makeSnapshot();
    const insights = buildProactiveInsights(snapshot);

    expect(insights.length).toBeLessThanOrEqual(3);
    const order = { critical: 0, warning: 1, info: 2, positive: 3 };
    for (let i = 1; i < insights.length; i++) {
      expect(order[insights[i]!.severity]).toBeGreaterThanOrEqual(order[insights[i - 1]!.severity]);
    }
  });

  it('surfaces a critical cash-flow warning first', () => {
    const snapshot = makeSnapshot({
      forecast: {
        asOfDate: '2026-08-03',
        availableCash: 500,
        daily: [],
        ranges: {},
        warnings: [
          { id: 'w1', severity: 'critical', title: 'Balance projected below $0', message: 'Your balance drops below zero.', date: '2026-09-02' },
        ],
        eventCount: 0,
        recurringCount: 0,
        mortgageCount: 0,
        savingsCount: 0,
      },
    });

    const insights = buildProactiveInsights(snapshot);
    expect(insights[0]?.severity).toBe('critical');
    expect(insights[0]?.category).toBe('forecast');
  });

  it('flags an over-budget category', () => {
    const snapshot = makeSnapshot({
      dashboard: {
        ...makeSnapshot().dashboard,
        budgetHealth: {
          categories: [
            { categoryId: 'c1', categoryName: 'Food', budgeted: 500, spent: 600, remaining: -100, percentUsed: 120, status: 'over' },
          ],
          totalBudgeted: 3000,
          totalSpent: 2800,
          remaining: 200,
          adherencePercent: 93.3,
          overallStatus: 'healthy',
        },
      },
    });

    const insights = buildProactiveInsights(snapshot);
    const budgetInsight = insights.find((i) => i.category === 'budget');
    expect(budgetInsight).toBeDefined();
    expect(budgetInsight?.title).toContain('over budget');
  });

  it('flags a savings goal behind schedule', () => {
    const snapshot = makeSnapshot({
      dashboard: {
        ...makeSnapshot().dashboard,
        savingsGoals: [
          {
            id: 'g1', name: 'Car Fund', currentAmount: 1000, targetAmount: 8000,
            targetDate: '2027-01-01', percentComplete: 12.5, monthsRemaining: 24,
            onTrack: false, estimatedCompletionDate: null,
          },
        ],
      },
    });

    const insights = buildProactiveInsights(snapshot);
    const goalInsight = insights.find((i) => i.category === 'savings' && i.severity === 'warning');
    expect(goalInsight).toBeDefined();
    expect(goalInsight?.title).toContain('Car Fund');
  });

  it('reports higher spending vs the previous month', () => {
    const snapshot = makeSnapshot({
      currentMonth: {
        label: '2026-08', startDate: '2026-08-01', endDate: '2026-08-31',
        income: 5000, expenses: 4375,
        byCategory: [],
      },
    });

    const insights = buildProactiveInsights(snapshot);
    const spending = insights.find((i) => i.category === 'spending' && i.id === 'spending-up');
    expect(spending).toBeDefined();
    expect(spending?.title).toContain('25%');
  });

  it('handles an empty snapshot gracefully', () => {
    const insights = buildProactiveInsights(makeSnapshot());
    expect(Array.isArray(insights)).toBe(true);
  });
});
