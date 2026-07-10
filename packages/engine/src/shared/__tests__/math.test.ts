import { describe, it, expect } from 'vitest';
import {
  computeMonthlyPayment,
  computeFutureValue,
  computeInterestPortion,
  computePrincipalPortion,
  computeSavingsRate,
  computeDTI,
  computeEmergencyFundMonths,
  linearScore,
  inverseLinearScore,
  computeNetWorthTrend,
} from '../math';

describe('computeMonthlyPayment', () => {
  it('calculates standard 30yr mortgage at 6.5% on $300k', () => {
    const payment = computeMonthlyPayment(300_000_00, 0.065 / 12, 360);
    expect(payment).toBeGreaterThan(0);
    expect(payment).toBe(1_896_20);
  });

  it('returns principal/n for 0% rate', () => {
    const payment = computeMonthlyPayment(30_000_00, 0, 360);
    expect(payment).toBe(8333);
  });

  it('returns positive for small principal', () => {
    const payment = computeMonthlyPayment(10_000_00, 0.05 / 12, 12);
    expect(payment).toBeGreaterThan(0);
  });
});

describe('computeFutureValue', () => {
  it('returns payment * periods for 0% rate', () => {
    const fv = computeFutureValue(100_00, 0, 12);
    expect(fv).toBe(12_00_00);
  });

  it('grows with positive rate', () => {
    const fv = computeFutureValue(100_00, 0.07 / 12, 360);
    expect(fv).toBeGreaterThan(100_00 * 360);
  });
});

describe('computeInterestPortion', () => {
  it('calculates interest correctly', () => {
    const interest = computeInterestPortion(300_000_00, 0.065 / 12);
    expect(interest).toBe(1_625_00);
  });

  it('returns 0 for zero balance', () => {
    const interest = computeInterestPortion(0, 0.065 / 12);
    expect(interest).toBe(0);
  });
});

describe('computePrincipalPortion', () => {
  it('subtracts interest from payment', () => {
    const principal = computePrincipalPortion(1000_00, 200_00);
    expect(principal).toBe(800_00);
  });
});

describe('computeSavingsRate', () => {
  it('returns 0 for zero income', () => {
    expect(computeSavingsRate(100, 0)).toBe(0);
  });

  it('calculates rate correctly', () => {
    expect(computeSavingsRate(500_00, 5000_00)).toBeCloseTo(0.1, 10);
  });
});

describe('computeDTI', () => {
  it('returns 1 for zero income', () => {
    expect(computeDTI(100, 0)).toBe(1);
  });

  it('calculates DTI correctly', () => {
    expect(computeDTI(1500_00, 5000_00)).toBeCloseTo(0.3, 10);
  });
});

describe('computeEmergencyFundMonths', () => {
  it('returns 0 for zero expenses', () => {
    expect(computeEmergencyFundMonths(10_000_00, 0)).toBe(0);
  });

  it('calculates months correctly', () => {
    expect(computeEmergencyFundMonths(30_000_00, 5000_00)).toBe(6);
  });
});

describe('linearScore', () => {
  it('returns max when ratio >= target', () => {
    expect(linearScore(0.25, 0.20, 30)).toBe(30);
  });

  it('scales linearly below target', () => {
    expect(linearScore(0.10, 0.20, 30)).toBe(15);
  });

  it('returns 0 for zero ratio', () => {
    expect(linearScore(0, 0.20, 30)).toBe(0);
  });
});

describe('inverseLinearScore', () => {
  it('returns max when ratio <= good', () => {
    expect(inverseLinearScore(0.30, 0.36, 0.50, 25)).toBe(25);
  });

  it('returns 0 when ratio >= bad', () => {
    expect(inverseLinearScore(0.55, 0.36, 0.50, 25)).toBe(0);
  });

  it('scales linearly between thresholds', () => {
    const mid = (0.36 + 0.50) / 2;
    const score = inverseLinearScore(mid, 0.36, 0.50, 25);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(25);
  });
});

describe('computeNetWorthTrend', () => {
  it('returns positive when increased', () => {
    expect(computeNetWorthTrend(110_000_00, 100_000_00)).toBe('positive');
  });

  it('returns flat when slightly decreased', () => {
    expect(computeNetWorthTrend(98_000_00, 100_000_00)).toBe('flat');
  });

  it('returns negative when significantly decreased', () => {
    expect(computeNetWorthTrend(90_000_00, 100_000_00)).toBe('negative');
  });

  it('returns flat when past was zero', () => {
    expect(computeNetWorthTrend(100_00, 0)).toBe('flat');
  });
});
