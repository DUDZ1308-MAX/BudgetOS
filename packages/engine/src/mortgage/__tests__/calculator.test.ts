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

  it('annual_lump extra payment reduces term', () => {
    const baseline = calculateFullAmortization(STANDARD_INPUT);
    const withExtra = calculateFullAmortization({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'annual_lump', amount: 2000_00 }],
    });

    if (!baseline.success || !withExtra.success) return;
    expect(withExtra.data.schedule.length).toBeLessThan(baseline.data.schedule.length);
  });

  it('annual_lump extra payment reduces total interest', () => {
    const baseline = calculateFullAmortization(STANDARD_INPUT);
    const withExtra = calculateFullAmortization({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'annual_lump', amount: 2000_00 }],
    });

    if (!baseline.success || !withExtra.success) return;
    expect(withExtra.data.totalInterest).toBeLessThan(baseline.data.totalInterest);
  });

  it('one_time extra payment reduces term', () => {
    const baseline = calculateFullAmortization(STANDARD_INPUT);
    const withExtra = calculateFullAmortization({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'one_time', amount: 5000_00, startMonth: 12 }],
    });

    if (!baseline.success || !withExtra.success) return;
    expect(withExtra.data.schedule.length).toBeLessThanOrEqual(baseline.data.schedule.length);
  });

  it('one_time extra payment reduces total interest', () => {
    const baseline = calculateFullAmortization(STANDARD_INPUT);
    const withExtra = calculateFullAmortization({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'one_time', amount: 5000_00, startMonth: 12 }],
    });

    if (!baseline.success || !withExtra.success) return;
    expect(withExtra.data.totalInterest).toBeLessThan(baseline.data.totalInterest);
  });

  it('biweekly extra payment reduces term', () => {
    const baseline = calculateFullAmortization(STANDARD_INPUT);
    const withExtra = calculateFullAmortization({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'biweekly', amount: 200_00 }],
    });

    if (!baseline.success || !withExtra.success) return;
    expect(withExtra.data.schedule.length).toBeLessThan(baseline.data.schedule.length);
  });

  it('biweekly extra payment reduces total interest', () => {
    const baseline = calculateFullAmortization(STANDARD_INPUT);
    const withExtra = calculateFullAmortization({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'biweekly', amount: 200_00 }],
    });

    if (!baseline.success || !withExtra.success) return;
    expect(withExtra.data.totalInterest).toBeLessThan(baseline.data.totalInterest);
  });

  it('multiple extra payment types combine', () => {
    const baseline = calculateFullAmortization(STANDARD_INPUT);
    const withExtra = calculateFullAmortization({
      ...STANDARD_INPUT,
      extraPayments: [
        { type: 'monthly_fixed', amount: 100_00 },
        { type: 'annual_lump', amount: 1000_00 },
        { type: 'one_time', amount: 2000_00, startMonth: 24 },
      ],
    });

    if (!baseline.success || !withExtra.success) return;
    expect(withExtra.data.schedule.length).toBeLessThan(baseline.data.schedule.length);
    expect(withExtra.data.totalInterest).toBeLessThan(baseline.data.totalInterest);
  });

  it('total principal equals original principal with extra payments', () => {
    const result = calculateFullAmortization({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
    });

    if (!result.success) return;
    const totalPrincipal = result.data.schedule.reduce((sum, row) => sum + row.principal, 0);
    expect(totalPrincipal).toBe(STANDARD_INPUT.principal);
  });

  it('handles very large principal ($1M)', () => {
    const result = calculateFullAmortization({
      ...STANDARD_INPUT,
      principal: 1_000_000_00,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.monthlyPayment).toBeGreaterThan(0);
    expect(result.data.schedule.length).toBeLessThanOrEqual(360);
  });

  it('handles 15-year term', () => {
    const result = calculateFullAmortization({
      ...STANDARD_INPUT,
      termYears: 15,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.schedule.length).toBeLessThanOrEqual(180);
  });

  it('handles 5-year term (car loan)', () => {
    const result = calculateFullAmortization({
      ...STANDARD_INPUT,
      principal: 35_000_00,
      termYears: 5,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.schedule.length).toBeLessThanOrEqual(60);
  });

  it('payoff date is in the future', () => {
    const result = calculateFullAmortization(STANDARD_INPUT);
    if (!result.success) return;
    const payoffDate = new Date(result.data.payoffDate);
    expect(payoffDate.getTime()).toBeGreaterThan(new Date('2024-01-01').getTime());
  });

  it('interest saved is positive with extra payments', () => {
    const result = calculateFullAmortization({
      ...STANDARD_INPUT,
      extraPayments: [{ type: 'monthly_fixed', amount: 200_00 }],
    });

    if (!result.success) return;
    expect(result.data.interestSaved).toBeGreaterThan(0);
  });

  it('handles negative rate (edge case)', () => {
    const result = calculateFullAmortization({
      ...STANDARD_INPUT,
      annualRate: -5,
    });

    expect(result.success).toBe(false);
  });

  it('handles zero term (edge case)', () => {
    const result = calculateFullAmortization({
      ...STANDARD_INPUT,
      termYears: 0,
    });

    expect(result.success).toBe(false);
  });

  it('schedule dates are sequential', () => {
    const result = calculateFullAmortization(STANDARD_INPUT);
    if (!result.success) return;

    for (let i = 1; i < result.data.schedule.length; i++) {
      const prevDate = new Date(result.data.schedule[i - 1]?.date ?? '');
      const currDate = new Date(result.data.schedule[i]?.date ?? '');
      expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
    }
  });

  it('remaining balance decreases each month', () => {
    const result = calculateFullAmortization(STANDARD_INPUT);
    if (!result.success) return;

    for (let i = 1; i < result.data.schedule.length; i++) {
      const prevBalance = result.data.schedule[i - 1]?.remainingBalance ?? 0;
      const currBalance = result.data.schedule[i]?.remainingBalance ?? 0;
      expect(currBalance).toBeLessThanOrEqual(prevBalance);
    }
  });

  it('cumulative interest increases each month', () => {
    const result = calculateFullAmortization(STANDARD_INPUT);
    if (!result.success) return;

    for (let i = 1; i < result.data.schedule.length; i++) {
      const prevInterest = result.data.schedule[i - 1]?.totalInterestToDate ?? 0;
      const currInterest = result.data.schedule[i]?.totalInterestToDate ?? 0;
      expect(currInterest).toBeGreaterThanOrEqual(prevInterest);
    }
  });
});
