import { describe, it, expect } from 'vitest';
import { computeGoalStatus, computeSurplus, computeSavingsDashboard } from '@/engine/SavingsEngine';

function makeGoal(overrides: Partial<any> = {}) {
  return {
    id: 'g1', user_id: 'u1', name: 'Test Goal',
    target_amount: 10000, current_amount: 2500,
    target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    priority: 1, status: 'active', created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('computeGoalStatus', () => {
  it('returns 0% for zero target', () => {
    const r = computeGoalStatus(makeGoal({ target_amount: 0 }));
    expect(r.percentComplete).toBe(0);
    expect(r.status).toBe('not_started');
  });

  it('returns completed when current >= target', () => {
    const r = computeGoalStatus(makeGoal({ current_amount: 15000 }));
    expect(r.percentComplete).toBe(100);
    expect(r.status).toBe('completed');
    expect(r.remainingAmount).toBe(0);
  });

  it('calculates percent complete correctly', () => {
    const r = computeGoalStatus(makeGoal({ target_amount: 2000, current_amount: 500 }));
    expect(r.percentComplete).toBe(25);
    expect(r.remainingAmount).toBe(1500);
  });

  it('returns proper days remaining', () => {
    const r = computeGoalStatus(makeGoal({ target_amount: 1000, current_amount: 100 }));
    expect(r.daysRemaining).toBeGreaterThan(0);
    expect(r.remainingAmount).toBe(900);
    expect(r.percentComplete).toBe(10);
  });

  it('handles no target date', () => {
    const r = computeGoalStatus(makeGoal({ target_date: null }));
    expect(r.percentComplete).toBeGreaterThan(0);
    expect(r.remainingAmount).toBeGreaterThan(0);
  });
});

describe('computeSurplus', () => {
  it('returns income - expenses - sinking funds', () => {
    expect(computeSurplus(5000, 3000, 500)).toBe(1500);
  });

  it('returns 0 when expenses exceed income', () => {
    expect(computeSurplus(2000, 3000)).toBe(0);
  });

  it('handles zero values', () => {
    expect(computeSurplus(0, 0)).toBe(0);
  });
});

describe('computeSavingsDashboard', () => {
  it('aggregates multiple goals', () => {
    const goals = [
      makeGoal({ name: 'Goal A', target_amount: 10000, current_amount: 3000, status: 'active' }),
      makeGoal({ name: 'Goal B', target_amount: 5000, current_amount: 5000, status: 'completed' }),
    ];
    const d = computeSavingsDashboard(goals);
    expect(d.totalSaved).toBe(8000);
    expect(d.totalTarget).toBe(15000);
    expect(d.activeGoals).toBe(1);
    expect(d.completedGoals).toBe(1);
    expect(d.largestGoal?.name).toBe('Goal A');
    expect(d.largestGoal?.target).toBe(10000);
  });

  it('returns empty dashboard for empty goals', () => {
    const d = computeSavingsDashboard([]);
    expect(d.totalSaved).toBe(0);
    expect(d.activeGoals).toBe(0);
    expect(d.completedGoals).toBe(0);
    expect(d.largestGoal).toBeNull();
  });
});
