import { describe, it, expect } from 'vitest';
import { computeSavingsRateScore } from '../components/savings-rate';
import { computeDTIScore } from '../components/dti';
import { computeEmergencyFundScore } from '../components/emergency-fund';
import { computeBudgetAdherenceScore } from '../components/budget-adherence';
import { computeNetWorthTrendScore } from '../components/net-worth-trend';
import { FHS_WEIGHTS } from '@budgetos/shared';

describe('computeSavingsRateScore', () => {
  it('returns max points when savings rate meets target', () => {
    const result = computeSavingsRateScore(2000_00, 10000_00);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.SAVINGS_RATE_MAX);
  });

  it('returns 0 points when savings rate is 0', () => {
    const result = computeSavingsRateScore(0, 10000_00);
    expect(result.earnedPoints).toBe(0);
  });

  it('returns partial points when savings rate is below target', () => {
    const result = computeSavingsRateScore(1000_00, 10000_00);
    expect(result.earnedPoints).toBeGreaterThan(0);
    expect(result.earnedPoints).toBeLessThan(FHS_WEIGHTS.SAVINGS_RATE_MAX);
  });

  it('returns 0 for zero income', () => {
    const result = computeSavingsRateScore(1000_00, 0);
    expect(result.earnedPoints).toBe(0);
  });

  it('returns max points when savings rate exceeds target', () => {
    const result = computeSavingsRateScore(3000_00, 10000_00);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.SAVINGS_RATE_MAX);
  });

  it('has correct maxPoints', () => {
    const result = computeSavingsRateScore(2000_00, 10000_00);
    expect(result.maxPoints).toBe(FHS_WEIGHTS.SAVINGS_RATE_MAX);
  });

  it('has correct percentage when at target', () => {
    const result = computeSavingsRateScore(2000_00, 10000_00);
    expect(result.percentage).toBe(100);
  });

  it('has correct percentage when below target', () => {
    const result = computeSavingsRateScore(1000_00, 10000_00);
    expect(result.percentage).toBeCloseTo(50, 0);
  });

  it('details string contains savings rate', () => {
    const result = computeSavingsRateScore(2000_00, 10000_00);
    expect(result.details).toContain('Savings rate');
  });
});

describe('computeDTIScore', () => {
  it('returns max points when DTI is below max ratio', () => {
    const result = computeDTIScore(1500_00, 10000_00);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.DTI_MAX);
  });

  it('returns 0 points when DTI is critical', () => {
    const result = computeDTIScore(6000_00, 10000_00);
    expect(result.earnedPoints).toBe(0);
  });

  it('returns partial points when DTI is between thresholds', () => {
    const result = computeDTIScore(4300_00, 10000_00);
    expect(result.earnedPoints).toBeGreaterThan(0);
    expect(result.earnedPoints).toBeLessThan(FHS_WEIGHTS.DTI_MAX);
  });

  it('returns 1 (max) for zero debt', () => {
    const result = computeDTIScore(0, 10000_00);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.DTI_MAX);
  });

  it('returns 0 for zero income', () => {
    const result = computeDTIScore(1000_00, 0);
    expect(result.earnedPoints).toBe(0);
  });

  it('has correct maxPoints', () => {
    const result = computeDTIScore(1500_00, 10000_00);
    expect(result.maxPoints).toBe(FHS_WEIGHTS.DTI_MAX);
  });

  it('has correct percentage when at good threshold', () => {
    const result = computeDTIScore(3600_00, 10000_00);
    expect(result.percentage).toBe(100);
  });

  it('has correct percentage when at bad threshold', () => {
    const result = computeDTIScore(5000_00, 10000_00);
    expect(result.percentage).toBe(0);
  });

  it('details string contains DTI ratio', () => {
    const result = computeDTIScore(1500_00, 10000_00);
    expect(result.details).toContain('Debt-to-income');
  });
});

describe('computeEmergencyFundScore', () => {
  it('returns max points when emergency fund covers tier 2 months', () => {
    const result = computeEmergencyFundScore(60000_00, 5000_00);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.EMERGENCY_FUND_MAX);
  });

  it('returns 0 points when emergency fund is 0', () => {
    const result = computeEmergencyFundScore(0, 5000_00);
    expect(result.earnedPoints).toBe(0);
  });

  it('returns partial points when emergency fund is between tiers', () => {
    const result = computeEmergencyFundScore(20000_00, 5000_00);
    expect(result.earnedPoints).toBeGreaterThan(0);
    expect(result.earnedPoints).toBeLessThan(FHS_WEIGHTS.EMERGENCY_FUND_MAX);
  });

  it('returns 0 for zero expenses', () => {
    const result = computeEmergencyFundScore(30000_00, 0);
    expect(result.earnedPoints).toBe(0);
  });

  it('returns max points when emergency fund exceeds tier 2', () => {
    const result = computeEmergencyFundScore(100000_00, 5000_00);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.EMERGENCY_FUND_MAX);
  });

  it('has correct maxPoints', () => {
    const result = computeEmergencyFundScore(60000_00, 5000_00);
    expect(result.maxPoints).toBe(FHS_WEIGHTS.EMERGENCY_FUND_MAX);
  });

  it('has correct percentage when at target', () => {
    const result = computeEmergencyFundScore(60000_00, 5000_00);
    expect(result.percentage).toBe(100);
  });

  it('has correct percentage when at tier 1', () => {
    const result = computeEmergencyFundScore(15000_00, 5000_00);
    expect(result.percentage).toBeCloseTo(50, 0);
  });

  it('details string contains emergency fund', () => {
    const result = computeEmergencyFundScore(60000_00, 5000_00);
    expect(result.details).toContain('Emergency fund');
  });
});

describe('computeBudgetAdherenceScore', () => {
  it('returns max points when all categories under budget', () => {
    const budgets = [
      { categoryId: 'cat-1', budgeted: 1000_00 },
      { categoryId: 'cat-2', budgeted: 500_00 },
    ];
    const actuals = [
      { categoryId: 'cat-1', spent: 800_00 },
      { categoryId: 'cat-2', spent: 400_00 },
    ];
    const result = computeBudgetAdherenceScore(budgets, actuals);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.BUDGET_ADHERENCE_MAX);
  });

  it('returns 0 points when all categories overspent', () => {
    const budgets = [
      { categoryId: 'cat-1', budgeted: 1000_00 },
    ];
    const actuals = [
      { categoryId: 'cat-1', spent: 2000_00 },
    ];
    const result = computeBudgetAdherenceScore(budgets, actuals);
    expect(result.earnedPoints).toBe(0);
  });

  it('returns partial points for mixed adherence', () => {
    const budgets = [
      { categoryId: 'cat-1', budgeted: 1000_00 },
      { categoryId: 'cat-2', budgeted: 500_00 },
    ];
    const actuals = [
      { categoryId: 'cat-1', spent: 800_00 },
      { categoryId: 'cat-2', spent: 600_00 },
    ];
    const result = computeBudgetAdherenceScore(budgets, actuals);
    expect(result.earnedPoints).toBeGreaterThan(0);
    expect(result.earnedPoints).toBeLessThan(FHS_WEIGHTS.BUDGET_ADHERENCE_MAX);
  });

  it('returns max points when no spending', () => {
    const budgets = [
      { categoryId: 'cat-1', budgeted: 1000_00 },
    ];
    const actuals = [
      { categoryId: 'cat-1', spent: 0 },
    ];
    const result = computeBudgetAdherenceScore(budgets, actuals);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.BUDGET_ADHERENCE_MAX);
  });

  it('returns max points when no budgets', () => {
    const result = computeBudgetAdherenceScore([], []);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.BUDGET_ADHERENCE_MAX);
  });

  it('has correct maxPoints', () => {
    const budgets = [{ categoryId: 'cat-1', budgeted: 1000_00 }];
    const actuals = [{ categoryId: 'cat-1', spent: 800_00 }];
    const result = computeBudgetAdherenceScore(budgets, actuals);
    expect(result.maxPoints).toBe(FHS_WEIGHTS.BUDGET_ADHERENCE_MAX);
  });

  it('handles missing actuals for category', () => {
    const budgets = [
      { categoryId: 'cat-1', budgeted: 1000_00 },
      { categoryId: 'cat-2', budgeted: 500_00 },
    ];
    const actuals = [
      { categoryId: 'cat-1', spent: 800_00 },
    ];
    const result = computeBudgetAdherenceScore(budgets, actuals);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.BUDGET_ADHERENCE_MAX);
  });

  it('details string contains budget adherence', () => {
    const budgets = [{ categoryId: 'cat-1', budgeted: 1000_00 }];
    const actuals = [{ categoryId: 'cat-1', spent: 800_00 }];
    const result = computeBudgetAdherenceScore(budgets, actuals);
    expect(result.details).toContain('Budget adherence');
  });
});

describe('computeNetWorthTrendScore', () => {
  it('returns max points for positive trend', () => {
    const result = computeNetWorthTrendScore(110_000_00, 100_000_00);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.NET_WORTH_TREND_MAX);
  });

  it('returns 0 points for negative trend', () => {
    const result = computeNetWorthTrendScore(90_000_00, 100_000_00);
    expect(result.earnedPoints).toBe(0);
  });

  it('returns half points for flat trend', () => {
    const result = computeNetWorthTrendScore(98_000_00, 100_000_00);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.NET_WORTH_TREND_MAX / 2);
  });

  it('returns flat trend for zero past net worth', () => {
    const result = computeNetWorthTrendScore(100_000_00, 0);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.NET_WORTH_TREND_MAX / 2);
  });

  it('returns flat trend when current equals past', () => {
    const result = computeNetWorthTrendScore(100_000_00, 100_000_00);
    expect(result.earnedPoints).toBe(FHS_WEIGHTS.NET_WORTH_TREND_MAX / 2);
  });

  it('has correct maxPoints', () => {
    const result = computeNetWorthTrendScore(110_000_00, 100_000_00);
    expect(result.maxPoints).toBe(FHS_WEIGHTS.NET_WORTH_TREND_MAX);
  });

  it('has correct percentage for positive trend', () => {
    const result = computeNetWorthTrendScore(110_000_00, 100_000_00);
    expect(result.percentage).toBe(100);
  });

  it('has correct percentage for flat trend', () => {
    const result = computeNetWorthTrendScore(98_000_00, 100_000_00);
    expect(result.percentage).toBe(50);
  });

  it('has correct percentage for negative trend', () => {
    const result = computeNetWorthTrendScore(90_000_00, 100_000_00);
    expect(result.percentage).toBe(0);
  });

  it('details string for positive trend', () => {
    const result = computeNetWorthTrendScore(110_000_00, 100_000_00);
    expect(result.details).toContain('upward');
  });

  it('details string for flat trend', () => {
    const result = computeNetWorthTrendScore(98_000_00, 100_000_00);
    expect(result.details).toContain('stable');
  });

  it('details string for negative trend', () => {
    const result = computeNetWorthTrendScore(90_000_00, 100_000_00);
    expect(result.details).toContain('declined');
  });
});
