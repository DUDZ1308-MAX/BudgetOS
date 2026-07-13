import { describe, it, expect } from 'vitest';
import { calculateMonthlyIncome, calculateMonthlyExpenses, calculateCashFlow, calculateNetFlow, calculateIncomeVsExpenseRatio, calculateBurnRate, calculateAverageMonthlySpend, calculateSafeToSpend, computeCashFlowSummary } from '../cashFlow';
import type { TransactionInput } from '../transactions';

const transactions: TransactionInput[] = [
  { id: '1', account_id: 'a1', category_id: 'c1', amount: 5000, date: '2024-01-05', merchant: 'Employer', note: null, is_archived: false, type: 'income' },
  { id: '2', account_id: 'a1', category_id: 'c2', amount: -150, date: '2024-01-10', merchant: 'Store', note: null, is_archived: false, type: 'expense' },
  { id: '3', account_id: 'a1', category_id: 'c2', amount: -200, date: '2024-01-15', merchant: 'Market', note: null, is_archived: false, type: 'expense' },
  { id: '4', account_id: 'a1', category_id: 'c3', amount: 200, date: '2024-02-01', merchant: 'Freelance', note: null, is_archived: false, type: 'income' },
  { id: '5', account_id: 'a1', category_id: 'c4', amount: -100, date: '2024-02-05', merchant: 'Sub', note: null, is_archived: false, type: 'expense' },
];

describe('calculateMonthlyIncome', () => {
  it('returns average monthly income', () => {
    expect(calculateMonthlyIncome(transactions, 2)).toBe(2600);
  });
  it('returns 0 for empty', () => expect(calculateMonthlyIncome([], 1)).toBe(0));
});

describe('calculateMonthlyExpenses', () => {
  it('returns average monthly expenses', () => {
    expect(calculateMonthlyExpenses(transactions, 2)).toBe(225);
  });
});

describe('calculateCashFlow', () => {
  it('returns income minus expenses', () => {
    expect(calculateCashFlow(transactions, 2)).toBe(2375);
  });
});

describe('calculateNetFlow', () => {
  it('subtracts expenses from income', () => {
    expect(calculateNetFlow(5000, 350)).toBe(4650);
  });
});

describe('calculateIncomeVsExpenseRatio', () => {
  it('returns ratio > 1 when income > expenses', () => {
    expect(calculateIncomeVsExpenseRatio(5000, 350)).toBeCloseTo(14.29, 1);
  });
  it('returns Infinity when expenses are 0', () => {
    expect(calculateIncomeVsExpenseRatio(100, 0)).toBe(Infinity);
  });
  it('returns 0 when both are 0', () => {
    expect(calculateIncomeVsExpenseRatio(0, 0)).toBe(0);
  });
});

describe('calculateBurnRate', () => {
  it('returns daily expense rate', () => {
    const daily = calculateBurnRate(transactions, 30);
    expect(daily).toBeCloseTo(15, 0);
  });
  it('returns 0 for 0 days', () => {
    expect(calculateBurnRate(transactions, 0)).toBe(0);
  });
});

describe('calculateAverageMonthlySpend', () => {
  it('returns monthly average', () => {
    const avg = calculateAverageMonthlySpend(transactions);
    expect(avg).toBeGreaterThan(0);
  });
});

describe('calculateSafeToSpend', () => {
  it('returns low risk when budget is comfortable', () => {
    const result = calculateSafeToSpend(2000, 5000, 15);
    expect(result.safeToSpendToday).toBeGreaterThan(0);
    expect(result.riskLevel).toBe('low');
  });
  it('returns high risk when remaining budget is 0', () => {
    const result = calculateSafeToSpend(0, 5000, 15);
    expect(result.safeToSpendToday).toBe(0);
    expect(result.riskLevel).toBe('high');
  });
  it('returns 0 when days remaining is 0', () => {
    const result = calculateSafeToSpend(1000, 5000, 0);
    expect(result.safeToSpendToday).toBe(0);
    expect(result.riskLevel).toBe('high');
  });
  it('accounts for upcoming fixed expenses', () => {
    const withoutFixed = calculateSafeToSpend(1000, 5000, 15, 0);
    const withFixed = calculateSafeToSpend(1000, 5000, 15, 800);
    expect(withFixed.safeToSpendToday).toBeLessThan(withoutFixed.safeToSpendToday);
  });
});

describe('computeCashFlowSummary', () => {
  it('computes complete cash flow summary', () => {
    const result = computeCashFlowSummary(transactions, '2024-01-01', '2024-01-31');
    expect(result.totalIncome).toBe(5000);
    expect(result.totalExpenses).toBe(350);
    expect(result.netFlow).toBe(4650);
    expect(result.dailyBalances.length).toBeGreaterThan(0);
  });
});
