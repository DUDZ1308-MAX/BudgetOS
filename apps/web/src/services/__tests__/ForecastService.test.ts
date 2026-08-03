import { describe, expect, it } from 'vitest';
import {
  buildDailySeries,
  buildForecastEvents,
  computeCashFlowForecast,
  computeRangeSummary,
  daysInMonth,
  expandRecurring,
  generateWarnings,
  isLeapYear,
} from '@/services/ForecastService';
import type {
  ForecastMortgageInput,
  ForecastRecurringInput,
  ForecastSavingsInput,
  ForecastTransactionInput,
} from '@/lib/forecast/types';

const AS_OF = '2026-08-01';

function rec(partial: Partial<ForecastRecurringInput> & { id: string; name: string; amount: number }): ForecastRecurringInput {
  return {
    type: 'expense',
    frequency: 'monthly',
    intervalCount: 1,
    dayOfWeek: null,
    dayOfMonth: null,
    monthOfYear: null,
    startDate: '2026-01-01',
    endDate: null,
    nextRun: '2026-08-15',
    lastRun: null,
    status: 'active',
    ...partial,
  };
}

function mort(partial: Partial<ForecastMortgageInput> & { id: string }): ForecastMortgageInput {
  return {
    name: 'Home',
    monthlyPayment: 1892.5,
    paymentFrequency: 'monthly',
    remainingBalance: 300000,
    startDate: '2026-03-05',
    ...partial,
  };
}

function sav(partial: Partial<ForecastSavingsInput> & { id: string; name: string }): ForecastSavingsInput {
  return {
    monthlyContribution: 500,
    isCompleted: false,
    ...partial,
  };
}

function txn(partial: Partial<ForecastTransactionInput> & { id: string }): ForecastTransactionInput {
  return {
    amount: 100,
    date: AS_OF,
    merchant: 'Merchant',
    categoryId: null,
    accountId: null,
    recurringId: null,
    isArchived: false,
    ...partial,
  };
}

describe('date helpers', () => {
  it('isLeapYear identifies 2024 as a leap year and 2025 as not', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
  });

  it('daysInMonth returns correct lengths including February', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe('expandRecurring', () => {
  it('expands a biweekly recurring into every occurrence in the window', () => {
    const r = rec({ id: 'r1', name: 'Payroll', amount: 2000, type: 'income', frequency: 'biweekly', nextRun: '2026-08-07' });
    expect(expandRecurring(r, AS_OF, '2026-08-30')).toEqual(['2026-08-07', '2026-08-21']);
    expect(expandRecurring(r, AS_OF, '2026-10-29')).toEqual([
      '2026-08-07', '2026-08-21', '2026-09-04', '2026-09-18', '2026-10-02', '2026-10-16',
    ]);
  });

  it('expands a monthly recurring once per month', () => {
    const r = rec({ id: 'r1', name: 'Rent', amount: 1500, nextRun: '2026-08-15' });
    expect(expandRecurring(r, AS_OF, '2026-08-30')).toEqual(['2026-08-15']);
    expect(expandRecurring(r, AS_OF, '2026-10-29')).toEqual(['2026-08-15', '2026-09-15', '2026-10-15']);
  });

  it('expands semimonthly to two occurrences per month', () => {
    const r = rec({ id: 'r1', name: 'Car Loan', amount: 300, frequency: 'semimonthly', dayOfMonth: 1, nextRun: '2026-08-01' });
    expect(expandRecurring(r, AS_OF, '2026-08-30')).toEqual(['2026-08-01', '2026-08-15']);
  });

  it('chains forward from a past next_run into the window', () => {
    const r = rec({ id: 'r1', name: 'Old Bill', amount: 100, nextRun: '2026-07-15' });
    expect(expandRecurring(r, AS_OF, '2026-08-30')).toEqual(['2026-08-15']);
  });

  it('returns nothing for paused or cancelled recurrings', () => {
    const paused = rec({ id: 'r1', name: 'Paused', amount: 100, status: 'paused', nextRun: '2026-08-10' });
    const cancelled = rec({ id: 'r2', name: 'Cancelled', amount: 100, status: 'cancelled', nextRun: '2026-08-10' });
    expect(expandRecurring(paused, AS_OF, '2026-08-30')).toEqual([]);
    expect(expandRecurring(cancelled, AS_OF, '2026-08-30')).toEqual([]);
  });

  it('returns nothing when the next occurrence is beyond the window', () => {
    const r = rec({ id: 'r1', name: 'Far Bill', amount: 100, nextRun: '2026-09-01' });
    expect(expandRecurring(r, AS_OF, '2026-08-30')).toEqual([]);
  });
});

describe('computeCashFlowForecast — empty data', () => {
  it('keeps the starting balance flat and reports no activity', () => {
    const result = computeCashFlowForecast({
      asOfDate: AS_OF,
      availableCash: 5000,
      transactions: [],
      recurrings: [],
      savingsGoals: [],
      mortgages: [],
    });

    const r30 = result.ranges[30]!;
    expect(r30.startingBalance).toBe(5000);
    expect(r30.income).toBe(0);
    expect(r30.expenses).toBe(0);
    expect(r30.netCashFlow).toBe(0);
    expect(r30.endingBalance).toBe(5000);
    expect(r30.lowestBalance).toBe(5000);
    expect(r30.daysBelowZero).toBe(0);
    expect(result.daily).toHaveLength(90);
    expect(result.daily[0]!.balance).toBe(5000);
    expect(result.daily[89]!.balance).toBe(5000);
    expect(result.warnings[0]?.severity).toBe('info');
  });
});

describe('computeCashFlowForecast — income and expenses', () => {
  it('adds projected income to the starting balance', () => {
    const result = computeCashFlowForecast({
      asOfDate: AS_OF,
      availableCash: 1000,
      transactions: [],
      recurrings: [rec({ id: 'r1', name: 'Salary', amount: 2000, type: 'income', nextRun: '2026-08-15' })],
      savingsGoals: [],
      mortgages: [],
    });
    const r30 = result.ranges[30]!;
    expect(r30.income).toBe(2000);
    expect(r30.expenses).toBe(0);
    expect(r30.endingBalance).toBe(3000);
  });

  it('subtracts projected expenses from the starting balance', () => {
    const result = computeCashFlowForecast({
      asOfDate: AS_OF,
      availableCash: 5000,
      transactions: [],
      recurrings: [
        rec({ id: 'r1', name: 'Rent', amount: 1500, nextRun: '2026-08-01' }),
        rec({ id: 'r2', name: 'Phone', amount: 80, nextRun: '2026-08-10' }),
      ],
      savingsGoals: [],
      mortgages: [],
    });
    const r30 = result.ranges[30]!;
    expect(r30.expenses).toBe(1580);
    expect(r30.endingBalance).toBe(3420);
    expect(r30.lowestBalance).toBe(3420);
  });

  it('counts each biweekly occurrence separately (no double-counting gaps)', () => {
    const result = computeCashFlowForecast({
      asOfDate: AS_OF,
      availableCash: 10000,
      transactions: [],
      recurrings: [rec({ id: 'r1', name: 'Payroll', amount: 2000, type: 'income', frequency: 'biweekly', nextRun: '2026-08-07' })],
      savingsGoals: [],
      mortgages: [],
    });
    expect(result.ranges[30]!.income).toBe(4000);
    expect(result.ranges[90]!.income).toBe(12000);
  });
});

describe('computeCashFlowForecast — mortgage and savings', () => {
  it('projects monthly mortgage payments on the start day', () => {
    const result = computeCashFlowForecast({
      asOfDate: AS_OF,
      availableCash: 10000,
      transactions: [],
      recurrings: [],
      savingsGoals: [],
      mortgages: [mort({ id: 'm1', startDate: '2026-03-05' })],
    });
    const r30 = result.ranges[30]!;
    expect(r30.expenses).toBe(1892.5);
    const event = r30.events.find((e) => e.source === 'mortgage');
    expect(event?.date).toBe('2026-08-05');
    expect(event?.amount).toBe(1892.5);
    expect(result.ranges[90]!.expenses).toBeCloseTo(1892.5 * 3, 5);
  });

  it('skips paid-off mortgages', () => {
    const result = computeCashFlowForecast({
      asOfDate: AS_OF,
      availableCash: 10000,
      transactions: [],
      recurrings: [],
      savingsGoals: [],
      mortgages: [mort({ id: 'm1', remainingBalance: 0 })],
    });
    expect(result.ranges[30]!.events).toHaveLength(0);
    expect(result.mortgageCount).toBe(0);
  });

  it('does not let extra payments alter the scheduled mortgage payment', () => {
    const result = computeCashFlowForecast({
      asOfDate: AS_OF,
      availableCash: 10000,
      transactions: [],
      recurrings: [],
      savingsGoals: [],
      mortgages: [mort({ id: 'm1', monthlyPayment: 1892.5, remainingBalance: 150000 })],
    });
    const event = result.ranges[30]!.events.find((e) => e.source === 'mortgage');
    expect(event?.amount).toBe(1892.5);
  });

  it('projects monthly savings contributions and skips completed goals', () => {
    const result = computeCashFlowForecast({
      asOfDate: AS_OF,
      availableCash: 10000,
      transactions: [],
      recurrings: [],
      savingsGoals: [
        sav({ id: 'g1', name: 'Emergency Fund' }),
        sav({ id: 'g2', name: 'Completed Trip', isCompleted: true }),
      ],
      mortgages: [],
    });
    const r30 = result.ranges[30]!;
    expect(r30.expenses).toBe(500);
    expect(result.savingsCount).toBe(1);
    expect(r30.events.filter((e) => e.source === 'savings')).toHaveLength(1);
    expect(result.ranges[90]!.expenses).toBe(1500);
  });
});

describe('computeCashFlowForecast — actual vs projected', () => {
  it('marks transactions as actual and recurring/mortgage/savings as projected', () => {
    const events = buildForecastEvents({
      transactions: [txn({ id: 't1', amount: 250, date: '2026-08-03', merchant: 'Groceries' })],
      recurrings: [rec({ id: 'r1', name: 'Rent', amount: 1500, nextRun: '2026-08-01' })],
      savingsGoals: [sav({ id: 'g1', name: 'Fund' })],
      mortgages: [mort({ id: 'm1' })],
      startDate: AS_OF,
      endDate: '2026-08-30',
    });

    const actual = events.filter((e) => e.status === 'actual');
    const projected = events.filter((e) => e.status === 'projected');
    expect(actual).toHaveLength(1);
    expect(actual[0]).toMatchObject({ id: 'txn-t1', source: 'transaction', isForecast: false });
    expect(projected.length).toBeGreaterThanOrEqual(3);
    expect(projected.every((e) => e.isForecast === true)).toBe(true);
    expect(projected.map((e) => e.source)).toEqual(expect.arrayContaining(['recurring', 'mortgage', 'savings']));
  });
});

describe('computeCashFlowForecast — duplicate prevention', () => {
  it('suppresses a projected occurrence that is already posted as a transaction', () => {
    const result = computeCashFlowForecast({
      asOfDate: AS_OF,
      availableCash: 5000,
      transactions: [txn({ id: 't1', amount: -1500, date: '2026-08-01', merchant: 'Rent Posted', recurringId: 'r1' })],
      recurrings: [rec({ id: 'r1', name: 'Rent', amount: 1500, nextRun: '2026-08-01' })],
      savingsGoals: [],
      mortgages: [],
    });
    const r30 = result.ranges[30]!;
    expect(r30.events.filter((e) => e.id === 'rec-r1-2026-08-01')).toHaveLength(0);
    expect(r30.events.filter((e) => e.id === 'txn-t1')).toHaveLength(1);
    expect(r30.expenses).toBe(1500);
  });
});

describe('computeCashFlowForecast — negative balance and warnings', () => {
  it('tracks days below zero and raises a critical warning', () => {
    const result = computeCashFlowForecast({
      asOfDate: AS_OF,
      availableCash: 1000,
      transactions: [],
      recurrings: [rec({ id: 'r1', name: 'Big Bill', amount: 2500, nextRun: '2026-08-03' })],
      savingsGoals: [],
      mortgages: [],
    });
    const r30 = result.ranges[30]!;
    expect(r30.lowestBalance).toBe(-1500);
    expect(r30.lowestBalanceDate).toBe('2026-08-03');
    expect(r30.daysBelowZero).toBeGreaterThan(0);
    expect(r30.endingBalance).toBe(-1500);
    expect(result.warnings.some((w) => w.severity === 'critical' && w.id === 'overdraft-30')).toBe(true);
  });

  it('raises a low-balance warning without an overdraft', () => {
    const result = computeCashFlowForecast({
      asOfDate: AS_OF,
      availableCash: 1000,
      transactions: [txn({ id: 't1', amount: -950, date: '2026-08-02', merchant: 'One-off Bill' })],
      recurrings: [],
      savingsGoals: [],
      mortgages: [],
    });
    expect(result.warnings.some((w) => w.severity === 'warning' && w.id === 'low-balance-30')).toBe(true);
    expect(result.warnings.some((w) => w.severity === 'critical')).toBe(false);
  });
});

describe('computeCashFlowForecast — boundaries', () => {
  it('clamps month-end days in leap and non-leap February', () => {
    const rLeap = rec({ id: 'r1', name: 'Clamped', amount: 100, nextRun: '2024-01-31', startDate: '2024-01-01', dayOfMonth: 31 });
    const rNoLeap = rec({ id: 'r2', name: 'Clamped2', amount: 100, nextRun: '2025-01-31', startDate: '2025-01-01', dayOfMonth: 31 });
    expect(expandRecurring(rLeap, '2024-02-01', '2024-04-30')).toEqual(['2024-02-29', '2024-03-31', '2024-04-30']);
    expect(expandRecurring(rNoLeap, '2025-02-01', '2025-04-30')).toEqual(['2025-02-28', '2025-03-31', '2025-04-30']);
  });

  it('handles a 90-day window crossing the year boundary', () => {
    const result = computeCashFlowForecast({
      asOfDate: '2026-12-01',
      availableCash: 5000,
      transactions: [],
      recurrings: [rec({ id: 'r1', name: 'Rent', amount: 1500, nextRun: '2026-12-15', startDate: '2026-01-01' })],
      savingsGoals: [],
      mortgages: [],
    });
    const r90 = result.ranges[90]!;
    expect(r90.endDate).toBe('2027-02-28');
    expect(r90.income).toBe(0);
    expect(r90.expenses).toBe(4500);
    expect(r90.events.map((e) => e.date)).toEqual(['2026-12-15', '2027-01-15', '2027-02-15']);
    expect(r90.endingBalance).toBe(500);
  });
});

describe('computeRangeSummary and buildDailySeries', () => {
  it('builds a daily balance series reflecting each event day', () => {
    const events = buildForecastEvents({
      transactions: [],
      recurrings: [rec({ id: 'r1', name: 'Salary', amount: 1000, type: 'income', nextRun: '2026-08-10' })],
      savingsGoals: [],
      mortgages: [],
      startDate: AS_OF,
      endDate: '2026-08-20',
    });
    const series = buildDailySeries(events, 500, 20, AS_OF);
    expect(series).toHaveLength(20);
    expect(series[0]!.balance).toBe(500);
    expect(series[9]!.balance).toBe(1500);
    expect(series[10]!.balance).toBe(1500);
  });

  it('range summary income/expenses/net cash flow add up consistently', () => {
    const events = buildForecastEvents({
      transactions: [txn({ id: 't1', amount: 800, date: '2026-08-12', merchant: 'Refund' })],
      recurrings: [
        rec({ id: 'r1', name: 'Salary', amount: 2000, type: 'income', nextRun: '2026-08-15' }),
        rec({ id: 'r2', name: 'Bill', amount: 300, nextRun: '2026-08-05' }),
      ],
      savingsGoals: [],
      mortgages: [],
      startDate: AS_OF,
      endDate: '2026-08-30',
    });
    const summary = computeRangeSummary(events, 1000, 30, AS_OF);
    expect(summary.income).toBe(2800);
    expect(summary.expenses).toBe(300);
    expect(summary.netCashFlow).toBe(2500);
    expect(summary.endingBalance).toBe(3500);
  });
});

describe('generateWarnings', () => {
  it('returns only an info warning when cash flow is healthy', () => {
    const warnings = generateWarnings({}, 5000);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.severity).toBe('info');
  });
});
