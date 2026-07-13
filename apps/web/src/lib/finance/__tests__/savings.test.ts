import { describe, it, expect } from 'vitest';
import { calculateGoalProgress, calculateRemainingAmount, calculateRequiredMonthlyContribution, calculateGoalCompletionDate, calculateSavingsAllocation, calculateSurplus, computeSavingsDashboard } from '../savings';
import type { SavingsGoalInput } from '../savings';

const goal: SavingsGoalInput = {
  id: '1',
  name: 'Vacation',
  target_amount: 5000,
  current_amount: 1500,
  target_date: '2025-06-01',
  status: 'active',
};

const completedGoal: SavingsGoalInput = {
  id: '2',
  name: 'Done',
  target_amount: 1000,
  current_amount: 1000,
  target_date: null,
  status: 'completed',
};

describe('calculateGoalProgress', () => {
  it('returns remaining and percent', () => {
    const result = calculateGoalProgress(goal);
    expect(result.remaining).toBe(3500);
    expect(result.percent).toBe(30);
  });
  it('marks completed when current >= target', () => {
    const result = calculateGoalProgress(completedGoal);
    expect(result.status).toBe('completed');
    expect(result.percent).toBe(100);
  });
  it('handles zero target', () => {
    const zeroGoal: SavingsGoalInput = { ...goal, target_amount: 0, current_amount: 0 };
    const result = calculateGoalProgress(zeroGoal);
    expect(result.status).toBe('not_started');
    expect(result.percent).toBe(0);
  });
});

describe('calculateRemainingAmount', () => {
  it('returns target - current', () => expect(calculateRemainingAmount(5000, 1500)).toBe(3500));
  it('returns 0 when met', () => expect(calculateRemainingAmount(1000, 1500)).toBe(0));
});

describe('calculateRequiredMonthlyContribution', () => {
  it('divides remaining by months', () => {
    expect(calculateRequiredMonthlyContribution(5000, 1000, 10)).toBe(400);
  });
  it('returns remaining when months <= 0', () => {
    expect(calculateRequiredMonthlyContribution(5000, 1000, 0)).toBe(4000);
  });
});

describe('calculateGoalCompletionDate', () => {
  it('returns months and date', () => {
    const result = calculateGoalCompletionDate(1000, 5000, 500);
    expect(result).not.toBeNull();
    expect(result!.months).toBe(8);
  });
  it('returns null when monthly contribution is 0', () => {
    expect(calculateGoalCompletionDate(1000, 5000, 0)).toBeNull();
  });
  it('returns 0 months when already met', () => {
    const result = calculateGoalCompletionDate(5000, 5000, 100);
    expect(result).not.toBeNull();
    expect(result!.months).toBe(0);
  });
});

describe('calculateSavingsAllocation', () => {
  it('returns surplus capped at income * rate', () => {
    expect(calculateSavingsAllocation(5000, 3000)).toBe(1000);
  });
  it('returns 0 when no surplus', () => {
    expect(calculateSavingsAllocation(3000, 5000)).toBe(0);
  });
});

describe('calculateSurplus', () => {
  it('returns income minus expenses', () => {
    expect(calculateSurplus(5000, 3000)).toBe(2000);
  });
  it('accounts for sinking funds', () => {
    expect(calculateSurplus(5000, 3000, 500)).toBe(1500);
  });
  it('returns 0 when expenses exceed income', () => {
    expect(calculateSurplus(2000, 3000)).toBe(0);
  });
});

describe('computeSavingsDashboard', () => {
  it('computes aggregate stats', () => {
    const result = computeSavingsDashboard([goal, completedGoal]);
    expect(result.totalSaved).toBe(2500);
    expect(result.totalTarget).toBe(6000);
    expect(result.activeGoals).toBe(1);
    expect(result.completedGoals).toBe(1);
    expect(result.largestGoal?.id).toBe('1');
  });
  it('handles empty list', () => {
    const result = computeSavingsDashboard([]);
    expect(result.totalSaved).toBe(0);
    expect(result.totalTarget).toBe(0);
    expect(result.activeGoals).toBe(0);
    expect(result.completedGoals).toBe(0);
    expect(result.largestGoal).toBeNull();
  });
});
