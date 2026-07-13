import { describe, it, expect } from 'vitest';
import { toSignedAmount, filterIncome, filterExpenses, filterActive, filterRecurring, filterManual, sumAmounts, sumIncome, sumExpenses, sumByCategory, sumByMerchant, sumByMonth, formatCurrency } from '../transactions';
import type { TransactionInput } from '../transactions';

const transactions: TransactionInput[] = [
  { id: '1', account_id: 'a1', category_id: 'c1', amount: 5000, date: '2024-01-05', merchant: 'Employer', note: null, is_archived: false, type: 'income' },
  { id: '2', account_id: 'a1', category_id: 'c2', amount: -150, date: '2024-01-10', merchant: 'Store', note: null, is_archived: false, type: 'expense' },
  { id: '3', account_id: 'a2', category_id: 'c2', amount: -200, date: '2024-01-15', merchant: 'Store', note: null, is_archived: false, type: 'expense' },
  { id: '4', account_id: 'a1', category_id: 'c3', amount: -50, date: '2024-01-20', merchant: 'Coffee Shop', note: null, is_archived: true, type: 'expense' },
  { id: '5', account_id: 'a1', category_id: 'c4', amount: 200, date: '2024-02-01', merchant: 'Freelance', note: null, is_archived: false, type: 'income', recurring_id: 'r1' },
  { id: '6', account_id: 'a2', category_id: 'c5', amount: -100, date: '2024-02-05', merchant: 'Subscription', note: null, is_archived: false, type: 'expense', recurring_id: 'r2' },
];

describe('toSignedAmount', () => {
  it('returns positive for income', () => expect(toSignedAmount(500, 'income')).toBe(500));
  it('returns negative for expense', () => expect(toSignedAmount(500, 'expense')).toBe(-500));
});

describe('filterIncome', () => {
  it('returns only income transactions', () => {
    const result = filterIncome(transactions);
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.type === 'income')).toBe(true);
  });
  it('excludes archived', () => {
    const result = filterIncome(transactions);
    expect(result.every((t) => !t.is_archived)).toBe(true);
  });
});

describe('filterExpenses', () => {
  it('returns only non-archived expense transactions', () => {
    const result = filterExpenses(transactions);
    expect(result).toHaveLength(3);
    expect(result.every((t) => t.type === 'expense' && !t.is_archived)).toBe(true);
  });
});

describe('filterActive', () => {
  it('excludes archived transactions', () => {
    const result = filterActive(transactions);
    expect(result).toHaveLength(5);
    expect(result.every((t) => !t.is_archived)).toBe(true);
  });
});

describe('filterRecurring', () => {
  it('returns only transactions with recurring_id', () => {
    const result = filterRecurring(transactions);
    expect(result).toHaveLength(2);
    expect(result.every((t) => !!t.recurring_id)).toBe(true);
  });
});

describe('filterManual', () => {
  it('returns transactions without recurring_id', () => {
    const result = filterManual(transactions);
    expect(result.every((t) => !t.recurring_id)).toBe(true);
  });
});

describe('sumAmounts', () => {
  it('sums absolute amounts of all active', () => {
    expect(sumAmounts(transactions)).toBe(5650);
  });
});

describe('sumIncome', () => {
  it('sums absolute amounts of income', () => {
    expect(sumIncome(transactions)).toBe(5200);
  });
});

describe('sumExpenses', () => {
  it('sums absolute amounts of expenses (excludes archived)', () => {
    expect(sumExpenses(transactions)).toBe(450);
  });
});

describe('sumByCategory', () => {
  it('groups amounts by category_id', () => {
    const result = sumByCategory(transactions);
    expect(result['c1']).toBe(5000);
    expect(result['c2']).toBe(350);
    expect(result['c5']).toBe(100);
  });
  it('skips archived transactions', () => {
    const result = sumByCategory(transactions);
    expect(result['c3']).toBeUndefined();
  });
});

describe('sumByMerchant', () => {
  it('groups amounts by merchant', () => {
    const result = sumByMerchant(transactions);
    expect(result['Store']).toBe(350);
    expect(result['Employer']).toBe(5000);
  });
});

describe('sumByMonth', () => {
  it('groups amounts by YYYY-MM', () => {
    const result = sumByMonth(transactions);
    expect(result['2024-01']).toBe(5350);
    expect(result['2024-02']).toBe(300);
  });
});

describe('formatCurrency', () => {
  it('formats with $ and 2 decimals', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });
  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
  it('formats absolute of negative', () => {
    expect(formatCurrency(-500)).toBe('$500.00');
  });
});
