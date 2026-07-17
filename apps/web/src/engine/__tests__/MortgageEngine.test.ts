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
});
