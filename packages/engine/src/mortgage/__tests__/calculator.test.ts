import { describe, it, expect } from 'vitest';
import { calculateFullAmortization } from '../calculator';

const STANDARD_INPUT = {
  principal: 30_000_00,
  annualRate: 6.5,
  termYears: 30,
  startDate: '2024-01-01',
  extraPayments: [],
};

describe('calculateFullAmortization', () => {
  it('returns success for standard 30yr mortgage', () => {
    const result = calculateFullAmortization(STANDARD_INPUT);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.schedule.length).toBeGreaterThan(0);
    expect(result.data.schedule.length).toBeLessThanOrEqual(360);
  });

  it('final balance is zero', () => {
    const result = calculateFullAmortization(STANDARD_INPUT);
    if (!result.success) return;
    const lastRow = result.data.schedule[result.data.schedule.length - 1];
    expect(lastRow).toBeDefined();
    if (lastRow) {
      expect(lastRow.remainingBalance).toBe(0);
    }
  });

  it('total principal equals original principal', () => {
    const result = calculateFullAmortization(STANDARD_INPUT);
    if (!result.success) return;
    const totalPrincipal = result.data.schedule.reduce((sum, row) => sum + row.principal, 0);
    expect(totalPrincipal).toBe(STANDARD_INPUT.principal);
  });

  it('total interest is positive', () => {
    const result = calculateFullAmortization(STANDARD_INPUT);
    if (!result.success) return;
    expect(result.data.totalInterest).toBeGreaterThan(0);
  });

  it('returns failure for negative principal', () => {
    const result = calculateFullAmortization({ ...STANDARD_INPUT, principal: -1000 });
    expect(result.success).toBe(false);
  });

  it('returns failure for invalid rate', () => {
    const result = calculateFullAmortization({ ...STANDARD_INPUT, annualRate: 101 });
    expect(result.success).toBe(false);
  });

  it('returns failure for term > 50', () => {
    const result = calculateFullAmortization({ ...STANDARD_INPUT, termYears: 51 });
    expect(result.success).toBe(false);
  });

  it('returns failure for term < 1', () => {
    const result = calculateFullAmortization({ ...STANDARD_INPUT, termYears: 0 });
    expect(result.success).toBe(false);
  });

  it('extra payment reduces term', () => {
    const baseline = calculateFullAmortization(STANDARD_INPUT);
    const withExtra = calculateFullAmortization({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
    });

    if (!baseline.success || !withExtra.success) return;
    expect(withExtra.data.schedule.length).toBeLessThan(baseline.data.schedule.length);
  });

  it('extra payment reduces total interest', () => {
    const baseline = calculateFullAmortization(STANDARD_INPUT);
    const withExtra = calculateFullAmortization({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
    });

    if (!baseline.success || !withExtra.success) return;
    expect(withExtra.data.totalInterest).toBeLessThan(baseline.data.totalInterest);
  });

  it('handles 0% interest rate', () => {
    const result = calculateFullAmortization({
      ...STANDARD_INPUT,
      annualRate: 0,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.totalInterest).toBe(0);
  });

  it('handles very short term (1 year)', () => {
    const result = calculateFullAmortization({
      ...STANDARD_INPUT,
      termYears: 1,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.schedule.length).toBeLessThanOrEqual(12);
  });
});
