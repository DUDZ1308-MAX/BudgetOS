import { describe, it, expect } from 'vitest';
import { calculateMonthlyPayment, generateAmortizationSchedule, calculateInterestSaved, calculatePayoffDate, calculateRemainingBalance, calculateInvestVsMortgage, computeMortgageDashboard, computeMortgage } from '../mortgage';
import type { MortgageInput } from '../mortgage';

describe('calculateMonthlyPayment', () => {
  it('calculates standard 30-year fixed', () => {
    const payment = calculateMonthlyPayment(300000, 6.5, 30);
    expect(payment).toBeCloseTo(1896.20, 0);
  });
  it('handles 0% interest', () => {
    const payment = calculateMonthlyPayment(120000, 0, 10);
    expect(payment).toBe(1000);
  });
  it('handles 15-year term', () => {
    const payment = calculateMonthlyPayment(200000, 5.0, 15);
    expect(payment).toBeCloseTo(1581.59, 0);
  });
});

describe('generateAmortizationSchedule', () => {
  it('generates correct number of payments', () => {
    const schedule = generateAmortizationSchedule(100000, 5.0, 30, '2024-01-01');
    expect(schedule.length).toBe(360);
  });
  it('first payment has more interest than principal', () => {
    const schedule = generateAmortizationSchedule(100000, 5.0, 30, '2024-01-01');
    expect(schedule[0]!.interest).toBeGreaterThan(schedule[0]!.principal);
  });
  it('ending balance is 0', () => {
    const schedule = generateAmortizationSchedule(100000, 5.0, 30, '2024-01-01');
    const last = schedule[schedule.length - 1]!;
    expect(last.remainingBalance).toBeLessThanOrEqual(1);
  });
});

describe('generateAmortizationSchedule with extra payments', () => {
  it('shortens loan term with extra payments', () => {
    const base = generateAmortizationSchedule(100000, 5.0, 30, '2024-01-01');
    const accelerated = generateAmortizationSchedule(100000, 5.0, 30, '2024-01-01', [
      { month: 1, amount: 200 },
    ]);
    expect(accelerated.length).toBeLessThan(base.length);
  });
});

describe('calculateInterestSaved', () => {
  it('returns 0 when schedule matches original', () => {
    const schedule = generateAmortizationSchedule(100000, 5.0, 30, '2024-01-01');
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
    expect(calculateInterestSaved(schedule, totalInterest)).toBe(0);
  });
  it('returns > 0 when extra payments made', () => {
    const base = generateAmortizationSchedule(100000, 5.0, 30, '2024-01-01');
    const accelerated = generateAmortizationSchedule(100000, 5.0, 30, '2024-01-01', [
      { month: 1, amount: 200 },
    ]);
    const originalInterest = base.reduce((s, r) => s + r.interest, 0);
    const saved = calculateInterestSaved(accelerated, originalInterest);
    expect(saved).toBeGreaterThan(0);
  });
});

describe('calculatePayoffDate', () => {
  it('returns last schedule date', () => {
    const schedule = generateAmortizationSchedule(100000, 5.0, 30, '2024-01-01');
    const date = calculatePayoffDate(schedule);
    expect(date).toBeTruthy();
    expect(date).toContain('2053');
  });
  it('returns null for empty schedule', () => {
    expect(calculatePayoffDate([])).toBeNull();
  });
});

describe('calculateRemainingBalance', () => {
  it('returns balance at given month', () => {
    const schedule = generateAmortizationSchedule(100000, 5.0, 30, '2024-01-01');
    const balance = calculateRemainingBalance(schedule, 1);
    expect(balance).toBeGreaterThan(0);
    expect(balance).toBeLessThan(100000);
  });
});

describe('calculateInvestVsMortgage', () => {
  it('returns comparison result', () => {
    const result = calculateInvestVsMortgage(100000, 5.0, 30, 7.0, 200);
    expect(result.mortgageSaved).toBeGreaterThanOrEqual(0);
    expect(result.investmentEarned).toBeGreaterThanOrEqual(0);
    expect(['mortgage', 'invest']).toContain(result.betterOption);
  });
});

describe('computeMortgageDashboard', () => {
  it('computes dashboard metrics', () => {
    const mortgage = computeMortgage({
      principal: 100000, annualRate: 5.0, termYears: 30, startDate: '2024-01-01',
    })!;
    const dashboard = computeMortgageDashboard(mortgage);
    expect(dashboard.totalCost).toBeGreaterThan(100000);
    expect(dashboard.progressPct).toBeGreaterThanOrEqual(0);
    expect(dashboard.totalPaymentsMade).toBeGreaterThanOrEqual(0);
  });
});

describe('computeMortgage', () => {
  it('returns null for invalid input', () => {
    expect(computeMortgage({ principal: 0, annualRate: 5, termYears: 30, startDate: '2024-01-01' })).toBeNull();
    expect(computeMortgage({ principal: 100000, annualRate: -1, termYears: 30, startDate: '2024-01-01' })).toBeNull();
    expect(computeMortgage({ principal: 100000, annualRate: 5, termYears: 0, startDate: '2024-01-01' })).toBeNull();
  });
  it('returns valid result for standard input', () => {
    const result = computeMortgage({
      principal: 100000, annualRate: 5.0, termYears: 30, startDate: '2024-01-01',
    });
    expect(result).not.toBeNull();
    expect(result!.monthlyPayment).toBeGreaterThan(0);
    expect(result!.totalInterest).toBeGreaterThan(0);
    expect(result!.schedule.length).toBe(360);
  });
});
