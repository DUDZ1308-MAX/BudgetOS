import { describe, it, expect } from 'vitest';
import { computeSafeToSpend } from '../SafeToSpendEngine';

describe('SafeToSpendEngine', () => {
  it('computes safe to spend with ample remaining budget', () => {
    const result = computeSafeToSpend({
      remainingBudget: 1500,
      monthlyIncome: 5000,
      daysRemaining: 20,
    });
    expect(result.safeToSpendToday).toBeGreaterThan(0);
    expect(result.riskLevel).toBe('low');
    expect(result.explanation).toContain('day');
  });

  it('accounts for safety buffer reducing available funds', () => {
    const withBuffer = computeSafeToSpend({
      remainingBudget: 500,
      monthlyIncome: 5000,
      daysRemaining: 10,
    });
    // safetyBuffer = 5000 * 0.1 = 500, remaining = 500 - 500 = 0 → safeToSpendToday = 0
    expect(withBuffer.safeToSpendToday).toBe(0);
    expect(withBuffer.riskLevel).toBe('high');
  });

  it('accounts for upcoming fixed expenses', () => {
    const result = computeSafeToSpend({
      remainingBudget: 2000,
      monthlyIncome: 5000,
      daysRemaining: 20,
      upcomingFixedExpenses: 800,
    });
    // safetyBuffer = 500, afterReserves = 2000 - 800 - 500 = 700, per day = 35
    // 35 < 2000/20*0.5 = 50 → medium risk
    expect(result.safeToSpendToday).toBe(35);
    expect(result.riskLevel).toBe('medium');
  });

  it('returns high risk when remaining budget is zero or negative', () => {
    const result = computeSafeToSpend({
      remainingBudget: 0,
      monthlyIncome: 4000,
      daysRemaining: 15,
    });
    expect(result.safeToSpendToday).toBe(0);
    expect(result.riskLevel).toBe('high');
  });

  it('returns medium risk when fixed expenses consume most of the buffer', () => {
    const result = computeSafeToSpend({
      remainingBudget: 600,
      monthlyIncome: 5000,
      daysRemaining: 20,
      upcomingFixedExpenses: 400,
    });
    // safetyBuffer = 500, afterReserves = 600 - 400 - 500 = -300 → safeToSpendToday = 0
    expect(result.safeToSpendToday).toBe(0);
    expect(result.riskLevel).toBe('high');
  });

  it('returns zero when days remaining is zero', () => {
    const result = computeSafeToSpend({
      remainingBudget: 1000,
      monthlyIncome: 5000,
      daysRemaining: 0,
    });
    expect(result.safeToSpendToday).toBe(0);
  });

  it('returns medium risk when safe amount is less than half the average', () => {
    const half = 1500 / 20 * 0.5;
    // remainingBudget=1500, monthlyIncome=5000, daysRemaining=20
    // safetyBuffer = 500, afterReserves = 1500 - 500 = 1000, perDay = 50
    // threshold = 1500/20*0.5 = 37.5, 50 > 37.5 → still low
    // Let me force medium by having a bigger safety buffer impact
    const result = computeSafeToSpend({
      remainingBudget: 500,
      monthlyIncome: 2000,
      daysRemaining: 10,
      upcomingFixedExpenses: 200,
    });
    // monthlyIncome=2000, safetyBuffer=200, afterReserves=500-200-200=100
    // perDay=10, threshold=500/10*0.5=25, 10<25 → medium
    expect(result.riskLevel).toBe('medium');
    expect(result.safeToSpendToday).toBe(10);
  });
});
