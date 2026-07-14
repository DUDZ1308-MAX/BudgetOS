import { describe, it, expect } from 'vitest';
import { computeScore } from '../calculator';

const EXCELLENT_INPUT = {
  totalIncomeMonthly: 10_000_00,
  totalSavingsMonthly: 3000_00,
  totalDebtPaymentsMonthly: 2000_00,
  emergencyFundBalance: 80_000_00,
  monthlyExpenses: 6000_00,
  budgets: [
    { categoryId: 'cat-1', budgeted: 1000_00 },
    { categoryId: 'cat-2', budgeted: 500_00 },
  ],
  actualSpending: [
    { categoryId: 'cat-1', spent: 900_00 },
    { categoryId: 'cat-2', spent: 400_00 },
  ],
  currentNetWorth: 150_000_00,
  netWorthThreeMonthsAgo: 140_000_00,
};

const POOR_INPUT = {
  totalIncomeMonthly: 5000_00,
  totalSavingsMonthly: 200_00,
  totalDebtPaymentsMonthly: 2800_00,
  emergencyFundBalance: 3000_00,
  monthlyExpenses: 5000_00,
  budgets: [
    { categoryId: 'cat-1', budgeted: 500_00 },
  ],
  actualSpending: [
    { categoryId: 'cat-1', spent: 800_00 },
  ],
  currentNetWorth: -20_000_00,
  netWorthThreeMonthsAgo: -10_000_00,
};

describe('computeScore', () => {
  it('returns excellent for healthy finances', () => {
    const result = computeScore(EXCELLENT_INPUT);
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.tier).toMatch(/excellent|good/);
  });

  it('returns lower score for poor finances', () => {
    const result = computeScore(POOR_INPUT);
    expect(result.overallScore).toBeLessThan(60);
    expect(result.components.savingsRate!.earnedPoints).toBeLessThan(result.components.savingsRate!.maxPoints);
  });

  it('returns all 5 components', () => {
    const result = computeScore(EXCELLENT_INPUT);
    expect(result.components.savingsRate).toBeDefined();
    expect(result.components.debtToIncome).toBeDefined();
    expect(result.components.emergencyFund).toBeDefined();
    expect(result.components.budgetAdherence).toBeDefined();
    expect(result.components.netWorthTrend).toBeDefined();
  });

  it('score is between 0 and 100', () => {
    const result = computeScore(EXCELLENT_INPUT);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('generates recommendations for poor score', () => {
    const result = computeScore(POOR_INPUT);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('returns correct tier strings', () => {
    const tiers = ['excellent', 'good', 'fair', 'concerning', 'critical'] as const;
    const result = computeScore(EXCELLENT_INPUT);
    expect(tiers).toContain(result.tier);
  });


});
