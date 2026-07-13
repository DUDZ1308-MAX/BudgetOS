import { describe, it, expect } from 'vitest';
import { calculateSavingsRate, calculateDebtToIncome, calculateEmergencyFundMonths, calculateNetWorthTrend, computeSavingsRateScore, computeEmergencyFundScore, computeDebtToIncomeScore, computeSpendingConsistencyScore, computeFinancialHealthScore } from '../financialHealth';
import type { CategoryBudgetBreakdown } from '../budget';

describe('calculateSavingsRate', () => {
  it('returns savings as % of income', () => expect(calculateSavingsRate(5000, 1000)).toBe(20));
  it('returns 0 when income is 0', () => expect(calculateSavingsRate(0, 100)).toBe(0));
});

describe('calculateDebtToIncome', () => {
  it('returns liabilities as % of annual income', () => {
    const dti = calculateDebtToIncome(120000, 5000);
    expect(dti).toBeCloseTo(200, 0);
  });
  it('returns 0 when income is 0', () => expect(calculateDebtToIncome(100000, 0)).toBe(0));
});

describe('calculateEmergencyFundMonths', () => {
  it('returns months of expenses covered', () => {
    expect(calculateEmergencyFundMonths(15000, 3000)).toBe(5);
  });
  it('returns 0 when expenses are 0', () => expect(calculateEmergencyFundMonths(1000, 0)).toBe(0));
});

describe('calculateNetWorthTrend', () => {
  it('returns positive trend', () => {
    expect(calculateNetWorthTrend([50000, 55000, 60000])).toBe(20);
  });
  it('returns 0 for insufficient data', () => expect(calculateNetWorthTrend([50000])).toBe(0));
  it('handles negative start', () => {
    expect(calculateNetWorthTrend([-10000, -5000])).toBe(50);
  });
});

describe('computeSavingsRateScore', () => {
  it('returns 100 for >= 20%', () => expect(computeSavingsRateScore(25)).toBe(100));
  it('returns 80 for >= 15%', () => expect(computeSavingsRateScore(15)).toBe(80));
  it('returns 60 for >= 10%', () => expect(computeSavingsRateScore(10)).toBe(60));
  it('returns 40 for >= 5%', () => expect(computeSavingsRateScore(5)).toBe(40));
  it('returns 20 for > 0%', () => expect(computeSavingsRateScore(1)).toBe(20));
  it('returns 0 for 0%', () => expect(computeSavingsRateScore(0)).toBe(0));
});

describe('computeEmergencyFundScore', () => {
  it('returns 100 for >= 6 months', () => expect(computeEmergencyFundScore(6)).toBe(100));
  it('returns 70 for >= 3 months', () => expect(computeEmergencyFundScore(3)).toBe(70));
  it('returns 40 for >= 1 month', () => expect(computeEmergencyFundScore(1)).toBe(40));
  it('scales below 1 month', () => expect(computeEmergencyFundScore(0.5)).toBe(20));
  it('returns 0 for 0', () => expect(computeEmergencyFundScore(0)).toBe(0));
});

describe('computeDebtToIncomeScore', () => {
  it('returns 100 for 0 DTI', () => expect(computeDebtToIncomeScore(0)).toBe(100));
  it('returns 80 for <= 0.36', () => expect(computeDebtToIncomeScore(0.3)).toBe(80));
  it('returns 50 for <= 0.43', () => expect(computeDebtToIncomeScore(0.4)).toBe(50));
  it('returns 30 for <= 0.5', () => expect(computeDebtToIncomeScore(0.45)).toBe(30));
  it('declines above 0.5', () => expect(computeDebtToIncomeScore(0.8)).toBe(20));
});

describe('computeSpendingConsistencyScore', () => {
  it('returns 50 for insufficient data', () => expect(computeSpendingConsistencyScore([100, 200])).toBe(50));
  it('returns 90 for low variance', () => expect(computeSpendingConsistencyScore([100, 110, 105])).toBe(90));
  it('returns 30 for high variance', () => {
    expect(computeSpendingConsistencyScore([1, 1, 1, 10000])).toBe(30);
  });
});

describe('computeFinancialHealthScore', () => {
  const budgetStatuses: CategoryBudgetBreakdown[] = [
    { categoryId: 'c1', categoryName: 'Food', budgeted: 500, spent: 400, remaining: 100, percentUsed: 80, status: 'on_track' },
    { categoryId: 'c2', categoryName: 'Rent', budgeted: 1500, spent: 1500, remaining: 0, percentUsed: 100, status: 'at_limit' },
  ];

  it('returns score between 0 and 100', () => {
    const result = computeFinancialHealthScore(5000, 3000, 1000, 50000, 20000, 3000, budgetStatuses, [100, 200, 150]);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
  it('returns detailed factor breakdown', () => {
    const result = computeFinancialHealthScore(5000, 3000, 1000, 50000, 20000, 3000, budgetStatuses, [100, 200, 150]);
    expect(result.factors.savingsRate.score).toBeGreaterThanOrEqual(0);
    expect(result.factors.budgetAdherence.score).toBeGreaterThanOrEqual(0);
    expect(result.factors.emergencyFund.score).toBeGreaterThanOrEqual(0);
    expect(result.factors.debtToIncome.score).toBeGreaterThanOrEqual(0);
    expect(result.factors.spendingConsistency.score).toBeGreaterThanOrEqual(0);
  });
  it('provides breakdown items', () => {
    const result = computeFinancialHealthScore(1000, 2000, 50, 100000, 500, 2000, [], []);
    expect(result.breakdown.length).toBeGreaterThanOrEqual(1);
  });
});
