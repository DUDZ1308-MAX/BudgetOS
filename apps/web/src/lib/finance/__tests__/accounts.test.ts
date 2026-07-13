import { describe, it, expect } from 'vitest';
import { categorizeAccountType, calculateNetWorth, calculateTotalAssets, calculateTotalLiabilities, calculateAvailableCash, calculateRunningBalance, calculateAccountBalance, calculateTransfer, getActiveAccounts } from '../accounts';
import type { AccountInput } from '../accounts';

const accounts: AccountInput[] = [
  { id: '1', name: 'Checking', type: 'checking', balance: 5000, is_active: true },
  { id: '2', name: 'Savings', type: 'savings', balance: 10000, is_active: true },
  { id: '3', name: 'Credit Card', type: 'credit', balance: -2000, is_active: true },
  { id: '4', name: 'Loan', type: 'loan', balance: -15000, is_active: true },
  { id: '5', name: 'Closed', type: 'checking', balance: 0, is_active: false },
];

describe('categorizeAccountType', () => {
  it('returns asset for checking', () => expect(categorizeAccountType('checking')).toBe('asset'));
  it('returns asset for savings', () => expect(categorizeAccountType('savings')).toBe('asset'));
  it('returns asset for investment', () => expect(categorizeAccountType('investment')).toBe('asset'));
  it('returns asset for cash', () => expect(categorizeAccountType('cash')).toBe('asset'));
  it('returns liability for credit', () => expect(categorizeAccountType('credit')).toBe('liability'));
  it('returns liability for loan', () => expect(categorizeAccountType('loan')).toBe('liability'));
});

describe('calculateNetWorth', () => {
  it('sums all account balances', () => {
    expect(calculateNetWorth(accounts)).toBe(-2000);
  });
  it('returns 0 for empty list', () => {
    expect(calculateNetWorth([])).toBe(0);
  });
});

describe('calculateTotalAssets', () => {
  it('sums only asset account balances', () => {
    expect(calculateTotalAssets(accounts)).toBe(15000);
  });
});

describe('calculateTotalLiabilities', () => {
  it('returns absolute sum of liability balances', () => {
    expect(calculateTotalLiabilities(accounts)).toBe(17000);
  });
});

describe('calculateAvailableCash', () => {
  it('returns assets minus liabilities', () => {
    expect(calculateAvailableCash(accounts)).toBe(-2000);
  });
});

describe('calculateRunningBalance', () => {
  it('adds income', () => expect(calculateRunningBalance(1000, 500, 'income')).toBe(1500));
  it('subtracts expense', () => expect(calculateRunningBalance(1000, 200, 'expense')).toBe(800));
  it('returns same for transfer', () => expect(calculateRunningBalance(1000, 300, 'transfer')).toBe(1000));
});

describe('calculateAccountBalance', () => {
  it('calculates from transactions', () => {
    const txns = [
      { amount: 1000, type: 'income' },
      { amount: 200, type: 'expense' },
      { amount: 300, type: 'expense' },
    ];
    expect(calculateAccountBalance(txns)).toBe(500);
  });
});

describe('calculateTransfer', () => {
  it('deducts from source and adds to destination', () => {
    const result = calculateTransfer(5000, 1000, 500);
    expect(result.fromBalance).toBe(4500);
    expect(result.toBalance).toBe(1500);
  });
});

describe('getActiveAccounts', () => {
  it('filters only active accounts', () => {
    const active = getActiveAccounts(accounts);
    expect(active).toHaveLength(4);
    expect(active.every((a) => a.is_active)).toBe(true);
  });
});
