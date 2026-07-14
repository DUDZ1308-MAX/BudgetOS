import { describe, it, expect } from 'vitest';
import { toMonthlyEquivalent, FREQUENCY_MULTIPLIERS, computeMonthlyRunRate } from '../frequency';

describe('toMonthlyEquivalent', () => {
  describe('standard conversions', () => {
    it('converts $2,000 biweekly to $4,333.33/month', () => {
      const result = toMonthlyEquivalent(2000, 'biweekly');
      expect(result).toBeCloseTo(4333.33, 1);
    });

    it('converts $500 weekly to $2,166.67/month', () => {
      const result = toMonthlyEquivalent(500, 'weekly');
      expect(result).toBeCloseTo(2166.67, 1);
    });

    it('converts $6,000 yearly to $500/month', () => {
      const result = toMonthlyEquivalent(6000, 'yearly');
      expect(result).toBe(500);
    });

    it('converts $900 quarterly to $300/month', () => {
      const result = toMonthlyEquivalent(900, 'quarterly');
      expect(result).toBe(300);
    });

    it('converts $1,200 semi-annual to $200/month', () => {
      const result = toMonthlyEquivalent(1200, 'semi_annual');
      expect(result).toBe(200);
    });

    it('converts $100 daily to $3,041.67/month', () => {
      const result = toMonthlyEquivalent(100, 'daily');
      expect(result).toBeCloseTo(3041.67, 1);
    });

    it('converts $500 semimonthly to $1,000/month', () => {
      const result = toMonthlyEquivalent(500, 'semimonthly');
      expect(result).toBe(1000);
    });
  });

  describe('monthly values remain unchanged', () => {
    it('returns same amount for monthly frequency', () => {
      const result = toMonthlyEquivalent(2000, 'monthly');
      expect(result).toBe(2000);
    });

    it('returns same amount for zero monthly', () => {
      const result = toMonthlyEquivalent(0, 'monthly');
      expect(result).toBe(0);
    });

    it('returns same amount for decimal monthly', () => {
      const result = toMonthlyEquivalent(1234.56, 'monthly');
      expect(result).toBe(1234.56);
    });
  });

  describe('one_time frequency', () => {
    it('returns 0 for one_time', () => {
      const result = toMonthlyEquivalent(5000, 'one_time');
      expect(result).toBe(0);
    });

    it('returns 0 for one_time with negative', () => {
      const result = toMonthlyEquivalent(-5000, 'one_time');
      expect(result).toBe(0);
    });
  });

  describe('zero values', () => {
    it('returns 0 for all frequencies with zero amount', () => {
      const frequencies = ['one_time', 'daily', 'weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'semi_annual', 'yearly'] as const;
      for (const freq of frequencies) {
        expect(toMonthlyEquivalent(0, freq)).toBe(0);
      }
    });
  });

  describe('negative values (refunds/adjustments)', () => {
    it('converts negative weekly refund', () => {
      const result = toMonthlyEquivalent(-50, 'weekly');
      expect(result).toBeCloseTo(-216.67, 1);
    });

    it('converts negative biweekly adjustment', () => {
      const result = toMonthlyEquivalent(-100, 'biweekly');
      expect(result).toBeCloseTo(-216.67, 1);
    });

    it('converts negative yearly refund', () => {
      const result = toMonthlyEquivalent(-1200, 'yearly');
      expect(result).toBe(-100);
    });
  });

  describe('decimal amounts', () => {
    it('converts $49.99 weekly to monthly', () => {
      const result = toMonthlyEquivalent(49.99, 'weekly');
      expect(result).toBeCloseTo(216.62, 1);
    });

    it('converts $9.99 monthly stays $9.99', () => {
      const result = toMonthlyEquivalent(9.99, 'monthly');
      expect(result).toBe(9.99);
    });

    it('converts $199.99 biweekly to monthly', () => {
      const result = toMonthlyEquivalent(199.99, 'biweekly');
      expect(result).toBeCloseTo(433.31, 1);
    });
  });

  describe('precision', () => {
    it('does not lose precision on exact values', () => {
      const result = toMonthlyEquivalent(1200, 'yearly');
      expect(result).toBe(100);
    });

    it('handles large numbers', () => {
      const result = toMonthlyEquivalent(100000, 'monthly');
      expect(result).toBe(100000);
    });

    it('handles very small decimal values', () => {
      const result = toMonthlyEquivalent(0.01, 'biweekly');
      expect(result).toBeCloseTo(0.0217, 3);
    });
  });
});

describe('computeMonthlyRunRate', () => {
  it('computes income and expenses from mixed recurring items', () => {
    const items = [
      { amount: 2000, frequency: 'biweekly' as const, type: 'income' as const },
      { amount: 500, frequency: 'weekly' as const, type: 'expense' as const },
      { amount: 100, frequency: 'monthly' as const, type: 'expense' as const },
    ];
    const result = computeMonthlyRunRate(items);
    expect(result.income).toBeCloseTo(4333.33, 1);
    expect(result.expenses).toBeCloseTo(2266.67, 1);
  });

  it('returns zeros for empty items', () => {
    const result = computeMonthlyRunRate([]);
    expect(result.income).toBe(0);
    expect(result.expenses).toBe(0);
  });

  it('handles only income items', () => {
    const items = [
      { amount: 6000, frequency: 'yearly' as const, type: 'income' as const },
      { amount: 900, frequency: 'quarterly' as const, type: 'income' as const },
    ];
    const result = computeMonthlyRunRate(items);
    expect(result.income).toBe(500 + 300);
    expect(result.expenses).toBe(0);
  });

  it('handles only expense items', () => {
    const items = [
      { amount: 1200, frequency: 'semi_annual' as const, type: 'expense' as const },
      { amount: 200, frequency: 'semimonthly' as const, type: 'expense' as const },
    ];
    const result = computeMonthlyRunRate(items);
    expect(result.income).toBe(0);
    expect(result.expenses).toBe(200 + 400);
  });

  it('excludes one_time items from run rate', () => {
    const items = [
      { amount: 5000, frequency: 'one_time' as const, type: 'income' as const },
      { amount: 2000, frequency: 'monthly' as const, type: 'income' as const },
    ];
    const result = computeMonthlyRunRate(items);
    expect(result.income).toBe(2000);
  });

  it('matches user scenario: $2,000 biweekly salary', () => {
    const items = [
      { amount: 2000, frequency: 'biweekly' as const, type: 'income' as const },
    ];
    const result = computeMonthlyRunRate(items);
    expect(result.income).toBeCloseTo(4333.33, 1);
  });
});

describe('FREQUENCY_MULTIPLIERS', () => {
  it('one_time has zero multiplier', () => {
    expect(FREQUENCY_MULTIPLIERS.one_time).toBe(0);
  });

  it('monthly has unit multiplier', () => {
    expect(FREQUENCY_MULTIPLIERS.monthly).toBe(1);
  });

  it('biweekly multiplier is 26/12', () => {
    expect(FREQUENCY_MULTIPLIERS.biweekly).toBe(26 / 12);
  });

  it('weekly multiplier is 52/12', () => {
    expect(FREQUENCY_MULTIPLIERS.weekly).toBe(52 / 12);
  });

  it('yearly multiplier is 1/12', () => {
    expect(FREQUENCY_MULTIPLIERS.yearly).toBe(1 / 12);
  });

  it('quarterly multiplier is 1/3', () => {
    expect(FREQUENCY_MULTIPLIERS.quarterly).toBeCloseTo(1 / 3, 10);
  });

  it('semimonthly multiplier is 2', () => {
    expect(FREQUENCY_MULTIPLIERS.semimonthly).toBe(2);
  });

  it('semi_annual multiplier is 1/6', () => {
    expect(FREQUENCY_MULTIPLIERS.semi_annual).toBeCloseTo(1 / 6, 10);
  });
});
