import { describe, it, expect } from 'vitest';
import { computeIncomeVsExpense, computeCategoryBreakdown, computeMerchantTotals, computeMonthlyComparison, computeYearOverYearComparison, computeRecurringVsManual } from '../reports';
import type { TransactionInput } from '../transactions';

const transactions: TransactionInput[] = [
  { id: '1', account_id: 'a1', category_id: 'c1', amount: 5000, date: '2024-01-05', merchant: 'Employer', note: null, is_archived: false, type: 'income' },
  { id: '2', account_id: 'a1', category_id: 'c2', amount: -150, date: '2024-01-10', merchant: 'Store', note: null, is_archived: false, type: 'expense' },
  { id: '3', account_id: 'a1', category_id: 'c2', amount: -200, date: '2024-01-15', merchant: 'Market', note: null, is_archived: false, type: 'expense' },
  { id: '4', account_id: 'a1', category_id: 'c4', amount: 200, date: '2024-02-01', merchant: 'Freelance', note: null, is_archived: false, type: 'income', recurring_id: 'r1' },
  { id: '5', account_id: 'a1', category_id: 'c5', amount: -100, date: '2024-02-05', merchant: 'Sub', note: null, is_archived: false, type: 'expense', recurring_id: 'r2' },
];

describe('computeIncomeVsExpense', () => {
  it('returns totals and ratio', () => {
    const result = computeIncomeVsExpense(transactions);
    expect(result.totalIncome).toBe(5200);
    expect(result.totalExpenses).toBe(450);
    expect(result.netIncome).toBe(4750);
    expect(result.incomeVsExpenseRatio).toBeGreaterThan(1);
  });
  it('handles empty transactions', () => {
    const result = computeIncomeVsExpense([]);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netIncome).toBe(0);
  });
});

describe('computeCategoryBreakdown', () => {
  it('returns category amounts with percentages', () => {
    const result = computeCategoryBreakdown(transactions);
    expect(result.length).toBeGreaterThan(0);
    const totalPct = result.reduce((s, r) => s + r.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });
});

describe('computeMerchantTotals', () => {
  it('returns merchants sorted by total', () => {
    const result = computeMerchantTotals(transactions);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.total).toBeGreaterThanOrEqual(result[result.length - 1]!.total);
  });
});

describe('computeMonthlyComparison', () => {
  it('groups by YYYY-MM', () => {
    const result = computeMonthlyComparison(transactions);
    expect(result.length).toBe(2);
    expect(result[0]!.month).toBe('2024-01');
    expect(result[1]!.month).toBe('2024-02');
  });
  it('returns income/expenses/net per month', () => {
    const result = computeMonthlyComparison(transactions);
    expect(result[0]!.income).toBe(5000);
    expect(result[0]!.expenses).toBe(350);
    expect(result[0]!.net).toBe(4650);
  });
});

describe('computeYearOverYearComparison', () => {
  it('groups by year', () => {
    const result = computeYearOverYearComparison(transactions);
    expect(result.length).toBe(1);
    expect(result[0]!.year).toBe(2024);
  });
});

describe('computeRecurringVsManual', () => {
  it('separates recurring from manual', () => {
    const result = computeRecurringVsManual(transactions);
    expect(result.recurringCount).toBe(2);
    expect(result.manualCount).toBe(3);
    expect(result.recurringTotal).toBe(300);
    expect(result.manualTotal).toBe(5350);
  });
});
