import { describe, it, expect } from 'vitest';
import { computeMortgage, computeMortgageDashboard } from '@/engine/MortgageEngine';

describe('computeMortgage', () => {
  it('computes a standard 30-year mortgage', () => {
    const r = computeMortgage({
      principal: 300000,
      annualRate: 6.5,
      termYears: 30,
      startDate: '2024-01-01',
    });
    expect(r).not.toBeNull();
    expect(r!.paymentAmount).toBeGreaterThan(1800);
    expect(r!.paymentAmount).toBeLessThan(2000);
    expect(r!.totalPrincipal).toBe(300000);
    expect(r!.payoffMonths).toBe(360);
    expect(r!.schedule.length).toBe(360);
  });

  it('returns null for invalid input', () => {
    expect(computeMortgage({ principal: 0, annualRate: 6.5, termYears: 30, startDate: '2024-01-01' })).toBeNull();
    expect(computeMortgage({ principal: -100, annualRate: 6.5, termYears: 30, startDate: '2024-01-01' })).toBeNull();
    expect(computeMortgage({ principal: 300000, annualRate: -1, termYears: 30, startDate: '2024-01-01' })).toBeNull();
  });

  it('computes a 15-year mortgage correctly', () => {
    const r = computeMortgage({
      principal: 200000,
      annualRate: 5.0,
      termYears: 15,
      startDate: '2024-06-15',
    });
    expect(r).not.toBeNull();
    expect(r!.payoffMonths).toBe(180);
    expect(r!.schedule[0]!.principal).toBeGreaterThan(0);
  });

  it('uses amortizationYears for payment when different from termYears', () => {
    const r = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      termYears: 5,
      amortizationYears: 25,
      startDate: '2024-01-01',
    });
    expect(r).not.toBeNull();
    expect(r!.payoffMonths).toBe(300);
    expect(r!.schedule.length).toBe(300);
  });

  it('remaining balance is NOT zero for a mortgage started 2 years ago', () => {
    const r = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
    });
    expect(r).not.toBeNull();
    const d = computeMortgageDashboard(r!);
    expect(d.remainingBalance).toBeGreaterThan(0);
    expect(d.remainingBalance).toBeLessThan(400000);
  });

  it('remaining balance decreases as more payments are made', () => {
    const r = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
    });
    expect(r).not.toBeNull();
    for (let i = 1; i < r!.schedule.length; i++) {
      expect(r!.schedule[i]!.remainingBalance).toBeLessThanOrEqual(
        r!.schedule[i - 1]!.remainingBalance,
      );
    }
  });

  it('schedule eventually reaches zero', () => {
    const r = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
    });
    expect(r).not.toBeNull();
    const lastRow = r!.schedule[r!.schedule.length - 1];
    expect(lastRow!.remainingBalance).toBe(0);
  });

  it('interest calculations are reasonable for $400k at 5%', () => {
    const r = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
    });
    expect(r).not.toBeNull();
    expect(r!.totalInterest).toBeGreaterThan(0);
    expect(r!.totalInterest).toBeLessThan(r!.totalPrincipal);
    expect(r!.paymentAmount).toBeGreaterThan(0);
  });

  it('Canadian semi-annual compounding produces different payment than monthly', () => {
    const monthly = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
      compoundSemiAnnual: false,
    });
    const semiAnnual = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
      compoundSemiAnnual: true,
    });
    expect(monthly).not.toBeNull();
    expect(semiAnnual).not.toBeNull();
    expect(monthly!.paymentAmount).not.toBe(semiAnnual!.paymentAmount);
  });

  it('bi-weekly payments produce correct schedule length', () => {
    const r = computeMortgage({
      principal: 300000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
      paymentFrequency: 'bi_weekly',
    });
    expect(r).not.toBeNull();
    expect(r!.paymentFrequency).toBe('bi_weekly');
    expect(r!.schedule.length).toBe(25 * 26);
  });

  it('accelerated bi-weekly payment is half of monthly', () => {
    const monthly = computeMortgage({
      principal: 300000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
      paymentFrequency: 'monthly',
    });
    const accel = computeMortgage({
      principal: 300000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
      paymentFrequency: 'accelerated_bi_weekly',
    });
    expect(monthly).not.toBeNull();
    expect(accel).not.toBeNull();
    expect(accel!.paymentAmount).toBeCloseTo(monthly!.paymentAmount / 2, 0);
  });

  it('extra payments reduce total interest', () => {
    const baseline = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
    });
    const withExtra = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
      extraPayments: [{ amount: 200, type: 'monthly_fixed' }],
    });
    expect(baseline).not.toBeNull();
    expect(withExtra).not.toBeNull();
    expect(withExtra!.totalInterest).toBeLessThan(baseline!.totalInterest);
    expect(withExtra!.interestSaved).toBeGreaterThan(0);
  });
});

describe('computeMortgageDashboard', () => {
  it('derives dashboard metrics from calc result', () => {
    const r = computeMortgage({
      principal: 300000,
      annualRate: 6.5,
      termYears: 30,
      startDate: '2024-01-01',
    });
    expect(r).not.toBeNull();
    const d = computeMortgageDashboard(r!);
    expect(d.monthlyPayment).toBeGreaterThan(1800);
    expect(d.monthlyPayment).toBeLessThan(2000);
    expect(d.totalPrincipal).toBe(300000);
    expect(d.payoffDate).toBeTruthy();
    expect(d.progressPct).toBeGreaterThanOrEqual(0);
  });

  it('remaining balance is NOT zero for recent mortgage', () => {
    const r = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
    });
    expect(r).not.toBeNull();
    const d = computeMortgageDashboard(r!);
    expect(d.remainingBalance).toBeGreaterThan(0);
    expect(d.remainingBalance).toBeLessThan(d.totalPrincipal);
  });

  it('progressPct is between 0 and 100', () => {
    const r = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
    });
    expect(r).not.toBeNull();
    const d = computeMortgageDashboard(r!);
    expect(d.progressPct).toBeGreaterThanOrEqual(0);
    expect(d.progressPct).toBeLessThanOrEqual(100);
  });

  it('paidSoFar.principal + remainingBalance approx equals totalPrincipal', () => {
    const r = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
    });
    expect(r).not.toBeNull();
    const d = computeMortgageDashboard(r!);
    const total = d.paidSoFar.principal + d.remainingBalance;
    expect(Math.abs(total - d.totalPrincipal)).toBeLessThan(1);
  });

  it('equityBuilt equals principalPaid', () => {
    const r = computeMortgage({
      principal: 400000,
      annualRate: 5.0,
      amortizationYears: 25,
      termYears: 5,
      startDate: '2024-01-01',
    });
    expect(r).not.toBeNull();
    const d = computeMortgageDashboard(r!);
    expect(d.equityBuilt).toBeCloseTo(d.paidSoFar.principal, 0);
  });
});
