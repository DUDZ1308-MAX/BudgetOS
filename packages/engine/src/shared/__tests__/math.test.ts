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

  it('handles 15-year mortgage at 5%', () => {
    const payment = computeMonthlyPayment(200_000_00, 0.05 / 12, 180);
    expect(payment).toBeGreaterThan(0);
    expect(payment).toBe(1_581_59);
  });

  it('handles 10-year loan at 4.5%', () => {
    const payment = computeMonthlyPayment(50_000_00, 0.045 / 12, 120);
    expect(payment).toBeGreaterThan(0);
    expect(payment).toBe(518_19);
  });

  it('handles very high interest rate (25%)', () => {
    const payment = computeMonthlyPayment(10_000_00, 0.25 / 12, 24);
    expect(payment).toBeGreaterThan(0);
    expect(payment).toBe(533_72);
  });

  it('handles 1-month term (emergency loan)', () => {
    const payment = computeMonthlyPayment(1_000_00, 0.10 / 12, 1);
    expect(payment).toBe(1_008_33);
  });

  it('handles very large principal ($1M)', () => {
    const payment = computeMonthlyPayment(1_000_000_00, 0.06 / 12, 360);
    expect(payment).toBeGreaterThan(0);
    expect(payment).toBe(5_995_51);
  });

  it('handles very small principal ($100)', () => {
    const payment = computeMonthlyPayment(100_00, 0.06 / 12, 12);
    expect(payment).toBeGreaterThan(0);
  });

  it('handles 5-year car loan at 6.9%', () => {
    const payment = computeMonthlyPayment(35_000_00, 0.069 / 12, 60);
    expect(payment).toBeGreaterThan(0);
    expect(payment).toBe(691_39);
  });

  it('computes total payment consistent with principal + interest', () => {
    const principal = 200_000_00;
    const monthlyRate = 0.05 / 12;
    const totalPayments = 360;
    const payment = computeMonthlyPayment(principal, monthlyRate, totalPayments);
    const totalPaid = payment * totalPayments;
    expect(totalPaid).toBeGreaterThan(principal);
    const totalInterest = totalPaid - principal;
    expect(totalInterest).toBeGreaterThan(0);
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

  it('returns 0 for 0 periods', () => {
    const fv = computeFutureValue(100_00, 0.07 / 12, 0);
    expect(fv).toBe(0);
  });

  it('returns 0 for 0 payment', () => {
    const fv = computeFutureValue(0, 0.07 / 12, 360);
    expect(fv).toBe(0);
  });

  it('handles large periods (30 years monthly)', () => {
    const fv = computeFutureValue(500_00, 0.07 / 12, 360);
    expect(fv).toBeGreaterThan(500_00 * 360);
  });

  it('handles small rate (1%)', () => {
    const fv = computeFutureValue(1000_00, 0.01 / 12, 60);
    expect(fv).toBeGreaterThan(1000_00 * 60);
  });

  it('handles high rate (20%)', () => {
    const fv = computeFutureValue(500_00, 0.20 / 12, 60);
    expect(fv).toBeGreaterThan(500_00 * 60);
  });

  it('0% rate with large periods', () => {
    const fv = computeFutureValue(1000_00, 0, 360);
    expect(fv).toBe(360_000_00);
  });

  it('annuity formula correctness: 10% annual, 10 years', () => {
    const payment = 100_00;
    const rate = 0.10 / 12;
    const periods = 120;
    const fv = computeFutureValue(payment, rate, periods);
    const expected = payment * ((Math.pow(1 + rate, periods) - 1) / rate);
    expect(fv).toBe(Math.round(expected));
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

  it('handles 0% rate', () => {
    const interest = computeInterestPortion(300_000_00, 0);
    expect(interest).toBe(0);
  });

  it('handles small balance', () => {
    const interest = computeInterestPortion(100_00, 0.06 / 12);
    expect(interest).toBe(50);
  });

  it('handles large balance ($1M)', () => {
    const interest = computeInterestPortion(1_000_000_00, 0.06 / 12);
    expect(interest).toBe(5_000_00);
  });

  it('rounds to nearest cent', () => {
    const interest = computeInterestPortion(1_000_00, 0.03 / 12);
    expect(interest).toBe(250);
  });

  it('handles high rate (15%)', () => {
    const interest = computeInterestPortion(10_000_00, 0.15 / 12);
    expect(interest).toBe(12_500);
  });

  it('handles negative balance (edge case)', () => {
    const interest = computeInterestPortion(-100_00, 0.06 / 12);
    expect(interest).toBe(-50);
  });
});

describe('computePrincipalPortion', () => {
  it('subtracts interest from payment', () => {
    const principal = computePrincipalPortion(1000_00, 200_00);
    expect(principal).toBe(800_00);
  });

  it('returns 0 when payment equals interest', () => {
    const principal = computePrincipalPortion(500_00, 500_00);
    expect(principal).toBe(0);
  });

  it('handles negative interest (edge case)', () => {
    const principal = computePrincipalPortion(1000_00, -100_00);
    expect(principal).toBe(1100_00);
  });

  it('handles 0 payment', () => {
    const principal = computePrincipalPortion(0, 0);
    expect(principal).toBe(0);
  });

  it('handles large payment ($2000)', () => {
    const principal = computePrincipalPortion(2000_00, 800_00);
    expect(principal).toBe(1200_00);
  });
});

describe('computeSavingsRate', () => {
  it('returns 0 for zero income', () => {
    expect(computeSavingsRate(100, 0)).toBe(0);
  });

  it('calculates rate correctly', () => {
    expect(computeSavingsRate(500_00, 5000_00)).toBeCloseTo(0.1, 10);
  });

  it('returns 1 for 100% savings', () => {
    expect(computeSavingsRate(5000_00, 5000_00)).toBe(1);
  });

  it('returns 0 for 0 savings', () => {
    expect(computeSavingsRate(0, 5000_00)).toBe(0);
  });

  it('handles negative income', () => {
    expect(computeSavingsRate(100_00, -5000_00)).toBe(0);
  });

  it('handles negative savings (spending more than income)', () => {
    expect(computeSavingsRate(-500_00, 5000_00)).toBe(-0.1);
  });

  it('handles large numbers', () => {
    expect(computeSavingsRate(20_000_00, 100_000_00)).toBeCloseTo(0.2, 10);
  });

  it('handles cents precision', () => {
    expect(computeSavingsRate(33_33, 100_00)).toBeCloseTo(0.3333, 3);
  });
});

describe('computeDTI', () => {
  it('returns 1 for zero income', () => {
    expect(computeDTI(100, 0)).toBe(1);
  });

  it('calculates DTI correctly', () => {
    expect(computeDTI(1500_00, 5000_00)).toBeCloseTo(0.3, 10);
  });

  it('returns 0 for zero debt', () => {
    expect(computeDTI(0, 5000_00)).toBe(0);
  });

  it('returns > 1 when debt exceeds income', () => {
    expect(computeDTI(6000_00, 5000_00)).toBeGreaterThan(1);
  });

  it('handles negative income', () => {
    expect(computeDTI(1000_00, -5000_00)).toBe(1);
  });

  it('handles 100% DTI', () => {
    expect(computeDTI(5000_00, 5000_00)).toBe(1);
  });

  it('handles small income', () => {
    expect(computeDTI(1000_00, 100_00)).toBe(10);
  });

  it('handles large debt payments', () => {
    expect(computeDTI(100_000_00, 200_000_00)).toBeCloseTo(0.5, 10);
  });
});

describe('computeEmergencyFundMonths', () => {
  it('returns 0 for zero expenses', () => {
    expect(computeEmergencyFundMonths(10_000_00, 0)).toBe(0);
  });

  it('calculates months correctly', () => {
    expect(computeEmergencyFundMonths(30_000_00, 5000_00)).toBe(6);
  });

  it('returns 0 for zero balance', () => {
    expect(computeEmergencyFundMonths(0, 5000_00)).toBe(0);
  });

  it('handles partial months', () => {
    expect(computeEmergencyFundMonths(1500_00, 1000_00)).toBe(1.5);
  });

  it('handles negative expenses', () => {
    expect(computeEmergencyFundMonths(10_000_00, -1000_00)).toBe(0);
  });

  it('handles large balance ($100k)', () => {
    expect(computeEmergencyFundMonths(100_000_00, 5000_00)).toBe(20);
  });

  it('handles small expenses ($100)', () => {
    expect(computeEmergencyFundMonths(10_000_00, 100_00)).toBe(100);
  });

  it('handles fractional months', () => {
    expect(computeEmergencyFundMonths(10_000_00, 3000_00)).toBeCloseTo(3.333, 2);
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

  it('returns max when ratio >= target (including zero target)', () => {
    expect(linearScore(0.10, 0, 30)).toBe(30);
  });

  it('returns max when ratio equals target exactly', () => {
    expect(linearScore(0.20, 0.20, 30)).toBe(30);
  });

  it('handles large maxScore (100)', () => {
    expect(linearScore(0.20, 0.20, 100)).toBe(100);
  });

  it('handles ratio above target', () => {
    expect(linearScore(0.30, 0.20, 30)).toBe(30);
  });

  it('handles 75% of target', () => {
    expect(linearScore(0.15, 0.20, 30)).toBeCloseTo(22.5, 1);
  });

  it('handles 50% of target', () => {
    expect(linearScore(0.10, 0.20, 30)).toBeCloseTo(15, 1);
  });

  it('handles 25% of target', () => {
    expect(linearScore(0.05, 0.20, 30)).toBeCloseTo(7.5, 1);
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

  it('returns max when ratio equals good threshold', () => {
    expect(inverseLinearScore(0.36, 0.36, 0.50, 25)).toBe(25);
  });

  it('returns 0 when ratio equals bad threshold', () => {
    expect(inverseLinearScore(0.50, 0.36, 0.50, 25)).toBe(0);
  });

  it('handles 50% between thresholds', () => {
    const mid = (0.36 + 0.50) / 2;
    const score = inverseLinearScore(mid, 0.36, 0.50, 25);
    expect(score).toBeCloseTo(12.5, 1);
  });

  it('handles negative ratio', () => {
    expect(inverseLinearScore(-0.10, 0.36, 0.50, 25)).toBe(25);
  });

  it('handles very high ratio', () => {
    expect(inverseLinearScore(1.0, 0.36, 0.50, 25)).toBe(0);
  });

  it('handles large maxScore (100)', () => {
    expect(inverseLinearScore(0.30, 0.36, 0.50, 100)).toBe(100);
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

  it('returns flat when current equals past', () => {
    expect(computeNetWorthTrend(100_000_00, 100_000_00)).toBe('flat');
  });

  it('returns positive when increased by 1%', () => {
    expect(computeNetWorthTrend(101_000_00, 100_000_00)).toBe('positive');
  });

  it('returns flat when decreased by exactly 5%', () => {
    expect(computeNetWorthTrend(95_000_00, 100_000_00)).toBe('flat');
  });

  it('returns negative when decreased by 6%', () => {
    expect(computeNetWorthTrend(94_000_00, 100_000_00)).toBe('negative');
  });

  it('returns positive when increased significantly', () => {
    expect(computeNetWorthTrend(200_000_00, 100_000_00)).toBe('positive');
  });

  it('handles negative net worth', () => {
    expect(computeNetWorthTrend(-100_000_00, -200_000_00)).toBe('positive');
  });

  it('handles zero current net worth', () => {
    expect(computeNetWorthTrend(0, 100_000_00)).toBe('negative');
  });

  it('handles both zero', () => {
    expect(computeNetWorthTrend(0, 0)).toBe('flat');
  });
});
