import { describe, it, expect } from 'vitest';
import { computeGoalProgress } from '../goals';

describe('computeGoalProgress', () => {
  it('calculates percent complete', () => {
    const result = computeGoalProgress({
      currentAmount: 2500_00,
      targetAmount: 10000_00,
      targetDate: '2027-01-01',
      monthlyContribution: 500_00,
    });
    expect(result.percentComplete).toBe(25);
    expect(result.onTrack).toBeDefined();
  });

  it('returns 0% when target is 0', () => {
    const result = computeGoalProgress({
      currentAmount: 0,
      targetAmount: 0,
      targetDate: '2027-01-01',
      monthlyContribution: 0,
    });
    expect(result.percentComplete).toBe(0);
  });

  it('caps percent at 100', () => {
    const result = computeGoalProgress({
      currentAmount: 20000_00,
      targetAmount: 10000_00,
      targetDate: '2027-01-01',
      monthlyContribution: 500_00,
    });
    expect(result.percentComplete).toBe(100);
  });

  it('marks as on track when monthly contribution is sufficient', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    const targetDate = futureDate.toISOString().split('T')[0] ?? '';

    const result = computeGoalProgress({
      currentAmount: 0,
      targetAmount: 12000_00,
      targetDate,
      monthlyContribution: 1000_00,
    });
    expect(result.onTrack).toBe(true);
  });

  it('marks as off track when monthly contribution is insufficient', () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);
    const targetDate = futureDate.toISOString().split('T')[0] ?? '';

    const result = computeGoalProgress({
      currentAmount: 0,
      targetAmount: 12000_00,
      targetDate,
      monthlyContribution: 1000_00,
    });
    expect(result.onTrack).toBe(false);
  });

  it('handles infinite months to complete when monthly contribution is 0', () => {
    const result = computeGoalProgress({
      currentAmount: 0,
      targetAmount: 10000_00,
      targetDate: '2027-01-01',
      monthlyContribution: 0,
    });
    expect(result.onTrack).toBe(false);
  });

  it('returns estimatedCompletionDate as "N/A" when contribution is 0', () => {
    const result = computeGoalProgress({
      currentAmount: 0,
      targetAmount: 10000_00,
      targetDate: '2027-01-01',
      monthlyContribution: 0,
    });
    expect(result.estimatedCompletionDate).toBe('N/A');
  });

  it('returns valid date when contribution is positive', () => {
    const result = computeGoalProgress({
      currentAmount: 0,
      targetAmount: 12000_00,
      targetDate: '2027-01-01',
      monthlyContribution: 1000_00,
    });
    expect(result.estimatedCompletionDate).not.toBe('N/A');
    const date = new Date(result.estimatedCompletionDate);
    expect(date.getTime()).toBeGreaterThan(0);
  });

  it('returns monthsRemaining as 0 for past date', () => {
    const result = computeGoalProgress({
      currentAmount: 0,
      targetAmount: 10000_00,
      targetDate: '2020-01-01',
      monthlyContribution: 500_00,
    });
    expect(result.monthsRemaining).toBe(0);
  });

  it('returns monthsRemaining as positive for future date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const targetDate = futureDate.toISOString().split('T')[0] ?? '';

    const result = computeGoalProgress({
      currentAmount: 0,
      targetAmount: 12000_00,
      targetDate,
      monthlyContribution: 1000_00,
    });
    expect(result.monthsRemaining).toBeGreaterThan(0);
  });

  it('handles 50% complete', () => {
    const result = computeGoalProgress({
      currentAmount: 5000_00,
      targetAmount: 10000_00,
      targetDate: '2027-01-01',
      monthlyContribution: 500_00,
    });
    expect(result.percentComplete).toBe(50);
  });

  it('handles 75% complete', () => {
    const result = computeGoalProgress({
      currentAmount: 7500_00,
      targetAmount: 10000_00,
      targetDate: '2027-01-01',
      monthlyContribution: 500_00,
    });
    expect(result.percentComplete).toBe(75);
  });

  it('handles 1% complete', () => {
    const result = computeGoalProgress({
      currentAmount: 100_00,
      targetAmount: 10000_00,
      targetDate: '2027-01-01',
      monthlyContribution: 500_00,
    });
    expect(result.percentComplete).toBe(1);
  });

  it('handles large target amount', () => {
    const result = computeGoalProgress({
      currentAmount: 5000_00,
      targetAmount: 100000_00,
      targetDate: '2030-01-01',
      monthlyContribution: 2000_00,
    });
    expect(result.percentComplete).toBe(5);
  });

  it('handles small monthly contribution', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10);
    const targetDate = futureDate.toISOString().split('T')[0] ?? '';

    const result = computeGoalProgress({
      currentAmount: 0,
      targetAmount: 10000_00,
      targetDate,
      monthlyContribution: 100_00,
    });
    expect(result.onTrack).toBe(true);
  });
});
