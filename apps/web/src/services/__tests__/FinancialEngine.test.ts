import { describe, it, expect } from 'vitest';
import { FinancialEngine } from '../FinancialEngine';
import type { Account, Budget, Category, Transaction } from '@budgetos/database';

type AccountFixture = Omit<Account, 'institution'> & { institution?: string | null };
type MortgageFixture = {
  id: string;
  user_id: string;
  name: string;
  principal: number;
  annual_rate: number;
  term_years: number;
  start_date: string;
  extra_payment: number;
  is_active: boolean;
};

// ============================================================================
// FinancialEngine Regression Tests — Scenarios A through F
// ============================================================================
//
// These tests verify that the FinancialEngine produces correct results for
// specific financial scenarios. Every calculation MUST pass through
// @budgetos/engine — no independent math is allowed.
// ============================================================================

function makeAccount(overrides: Partial<Account> & { id: string; name: string; type: Account['type'] }): Account {
  return {
    user_id: 'user-1',
    balance: 0,
    currency: 'USD',
    institution: null,
    is_active: true,
    include_in_net_worth: true,
    sort_order: 0,
    created_at: '2024-01-01',
    ...overrides,
  };
}

function makeMortgage(overrides: Partial<MortgageFixture> & { id: string; name: string }): MortgageFixture {
  return {
    user_id: 'user-1',
    principal: 300000,
    annual_rate: 6.5,
    term_years: 30,
    start_date: '2024-01-01',
    extra_payment: 0,
    is_active: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Scenario A: Net Worth with Checking, Savings, and Credit Card
// ---------------------------------------------------------------------------
describe('Scenario A: Net Worth', () => {
  it('should calculate net worth correctly with mixed account types', () => {
    const accounts = [
      makeAccount({ id: 'acc-1', name: 'Checking', type: 'checking', balance: 5000 }),
      makeAccount({ id: 'acc-2', name: 'Savings', type: 'savings', balance: 12000 }),
      makeAccount({ id: 'acc-3', name: 'Credit Card', type: 'credit', balance: -800 }),
    ];

    const result = FinancialEngine.getNetWorth(accounts);

    // Net Worth = $5000 + $12000 + (-$800) = $16200
    expect(result.netWorth).toBe(16200);

    // Assets = $5000 + $12000 = $17000
    expect(result.totalAssets).toBe(17000);

    // Liabilities = |-800| = $800
    expect(result.totalLiabilities).toBe(800);
  });

  it('should exclude inactive accounts from net worth', () => {
    const accounts = [
      makeAccount({ id: 'acc-1', name: 'Active Checking', type: 'checking', balance: 5000, is_active: true }),
      makeAccount({ id: 'acc-2', name: 'Old Savings', type: 'savings', balance: 3000, is_active: false }),
    ];

    const result = FinancialEngine.getNetWorth(accounts);
    expect(result.netWorth).toBe(5000);
  });

  it('should exclude accounts with include_in_net_worth=false', () => {
    const accounts = [
      makeAccount({ id: 'acc-1', name: 'Checking', type: 'checking', balance: 5000, include_in_net_worth: true }),
      makeAccount({ id: 'acc-2', name: 'Hidden Savings', type: 'savings', balance: 12000, include_in_net_worth: false }),
    ];

    const result = FinancialEngine.getNetWorth(accounts);
    expect(result.netWorth).toBe(5000);
    expect(result.totalAssets).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// Scenario B: Cash Flow — Income $6000, Expenses $4200
// ---------------------------------------------------------------------------
describe('Scenario B: Cash Flow', () => {
  it('should calculate cash flow correctly from transactions', () => {
    const transactions: Transaction[] = [
      {
        id: 'txn-1',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-salary',
        amount: 6000,
        date: '2026-07-01',
        merchant: null,
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-01',
      },
      {
        id: 'txn-2',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-housing',
        amount: -1500,
        date: '2026-07-05',
        merchant: 'Landlord',
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-05',
      },
      {
        id: 'txn-3',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-groceries',
        amount: -800,
        date: '2026-07-10',
        merchant: 'Grocery Store',
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-10',
      },
      {
        id: 'txn-4',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-utilities',
        amount: -400,
        date: '2026-07-12',
        merchant: 'Utility Co',
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-12',
      },
      {
        id: 'txn-5',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-transport',
        amount: -300,
        date: '2026-07-15',
        merchant: 'Gas Station',
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-15',
      },
      {
        id: 'txn-6',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-entertainment',
        amount: -200,
        date: '2026-07-18',
        merchant: 'Movie Theater',
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-18',
      },
      {
        id: 'txn-7',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-shopping',
        amount: -600,
        date: '2026-07-20',
        merchant: 'Online Store',
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-20',
      },
      {
        id: 'txn-8',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-insurance',
        amount: -400,
        date: '2026-07-22',
        merchant: 'Insurance Co',
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-22',
      },
    ];

    const recurrings: Array<{ amount: number; frequency: string; type: string; status: string }> = [];

    const result = FinancialEngine.getCashFlow(transactions, recurrings, {
      start: '2026-07-01',
      end: '2026-07-31',
    });

    // Income = $6000
    expect(result.income).toBe(6000);

    // Expenses = $1500 + $800 + $400 + $300 + $200 + $600 + $400 = $4200
    expect(result.expenses).toBe(4200);

    // Cash Flow = $6000 - $4200 = $1800
    expect(result.cashFlow).toBe(1800);
  });

  it('should use recurring run rate when higher than posted transactions', () => {
    const transactions: Transaction[] = [];

    const recurrings = [
      { amount: 6000, frequency: 'monthly', type: 'income', status: 'active' },
      { amount: 4200, frequency: 'monthly', type: 'expense', status: 'active' },
    ];

    const result = FinancialEngine.getCashFlow(transactions, recurrings, {
      start: '2026-07-01',
      end: '2026-07-31',
    });

    expect(result.monthlyIncome).toBe(6000);
    expect(result.monthlyExpenses).toBe(4200);
    expect(result.cashFlow).toBe(1800);
  });

  it('should use posted transactions when higher than recurring run rate', () => {
    const transactions: Transaction[] = [
      {
        id: 'txn-1',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-salary',
        amount: 8000,
        date: '2026-07-01',
        merchant: null,
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-01',
      },
    ];

    const recurrings = [
      { amount: 6000, frequency: 'monthly', type: 'income', status: 'active' },
    ];

    const result = FinancialEngine.getCashFlow(transactions, recurrings, {
      start: '2026-07-01',
      end: '2026-07-31',
    });

    // Posted income ($8000) is higher than recurring ($6000)
    expect(result.monthlyIncome).toBe(8000);
  });
});

// ---------------------------------------------------------------------------
// Scenario C: Mortgage — 30-year, $300k, 6.5%
// ---------------------------------------------------------------------------
describe('Scenario C: Mortgage', () => {
  it('should calculate mortgage amortization correctly', () => {
    const mortgages = [
      makeMortgage({ id: 'mort-1', name: 'Home Mortgage' }),
    ];

    const results = FinancialEngine.getMortgages(mortgages as any);
    expect(results).toHaveLength(1);

    const mortgage = results[0]!;
    expect(mortgage.name).toBe('Home Mortgage');
    expect(mortgage.monthlyPayment).toBeGreaterThan(0);
    expect(mortgage.remainingBalance).toBeGreaterThanOrEqual(0);
    expect(mortgage.totalInterest).toBeGreaterThan(0);
    expect(mortgage.payoffMonths).toBe(360);
    expect(mortgage.progressPct).toBeGreaterThanOrEqual(0);
    expect(mortgage.progressPct).toBeLessThanOrEqual(100);
  });

  it('should reduce interest with extra payments', () => {
    const mortgagesNoExtra = [
      makeMortgage({ id: 'mort-1', name: 'No Extra', extra_payment: 0 }),
    ];

    const mortgagesWithExtra = [
      makeMortgage({ id: 'mort-2', name: 'With Extra', extra_payment: 200 }),
    ];

    const resultNoExtra = FinancialEngine.getMortgages(mortgagesNoExtra as any);
    const resultWithExtra = FinancialEngine.getMortgages(mortgagesWithExtra as any);

    expect(resultWithExtra[0]!.interestSaved).toBeGreaterThan(0);
    expect(resultWithExtra[0]!.payoffMonths).toBeLessThan(resultNoExtra[0]!.payoffMonths);
  });
});

// ---------------------------------------------------------------------------
// Scenario D: Recurring Biweekly Salary → Monthly Total
// ---------------------------------------------------------------------------
describe('Scenario D: Recurring Transactions', () => {
  it('should convert biweekly salary to monthly equivalent correctly', () => {
    const recurrings = [
      { amount: 3000, frequency: 'biweekly', type: 'income', status: 'active' },
    ];

    const result = FinancialEngine.getCashFlow([], recurrings, {
      start: '2026-07-01',
      end: '2026-07-31',
    });

    // Biweekly $3000 = 26/12 * 3000 = $6500/month
    expect(result.monthlyIncome).toBe(6500);
  });

  it('should sum multiple recurring income streams', () => {
    const recurrings = [
      { amount: 3000, frequency: 'biweekly', type: 'income', status: 'active' },
      { amount: 1000, frequency: 'monthly', type: 'income', status: 'active' },
    ];

    const result = FinancialEngine.getCashFlow([], recurrings, {
      start: '2026-07-01',
      end: '2026-07-31',
    });

    // Biweekly $3000 = $6500 + Monthly $1000 = $7500
    expect(result.monthlyIncome).toBe(7500);
  });

  it('should exclude paused recurrings', () => {
    const recurrings = [
      { amount: 3000, frequency: 'biweekly', type: 'income', status: 'active' },
      { amount: 1000, frequency: 'monthly', type: 'income', status: 'paused' },
    ];

    const result = FinancialEngine.getCashFlow([], recurrings, {
      start: '2026-07-01',
      end: '2026-07-31',
    });

    // Only active: biweekly $3000 = $6500
    expect(result.monthlyIncome).toBe(6500);
  });
});

// ---------------------------------------------------------------------------
// Scenario E: Archived Accounts Must Not Affect Net Worth
// ---------------------------------------------------------------------------
describe('Scenario E: Archived Accounts', () => {
  it('should exclude archived accounts from net worth', () => {
    const accounts = [
      makeAccount({ id: 'acc-1', name: 'Active Checking', type: 'checking', balance: 5000, is_active: true }),
      makeAccount({ id: 'acc-2', name: 'Archived Savings', type: 'savings', balance: 50000, is_active: false }),
      makeAccount({ id: 'acc-3', name: 'Old Credit Card', type: 'credit', balance: -2000, is_active: false }),
    ];

    const result = FinancialEngine.getNetWorth(accounts);

    // Only active accounts: $5000
    expect(result.netWorth).toBe(5000);
    expect(result.totalAssets).toBe(5000);
    expect(result.totalLiabilities).toBe(0);
  });

  it('should exclude hidden accounts from net worth', () => {
    const accounts = [
      makeAccount({ id: 'acc-1', name: 'Visible Checking', type: 'checking', balance: 5000, include_in_net_worth: true }),
      makeAccount({ id: 'acc-2', name: 'Hidden Savings', type: 'savings', balance: 50000, include_in_net_worth: false }),
    ];

    const result = FinancialEngine.getNetWorth(accounts);
    expect(result.netWorth).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// Scenario F: Budget Utilization
// ---------------------------------------------------------------------------
describe('Scenario F: Budget Utilization', () => {
  it('should calculate budget utilization correctly', () => {
    const budgets: Budget[] = [
      {
        id: 'bud-1',
        user_id: 'user-1',
        category_id: 'cat-groceries',
        year: 2026,
        month: 7,
        amount: 800,
        rollover: false,
        created_at: '2026-07-01',
      } as Budget,
      {
        id: 'bud-2',
        user_id: 'user-1',
        category_id: 'cat-housing',
        year: 2026,
        month: 7,
        amount: 1500,
        rollover: false,
        created_at: '2026-07-01',
      } as Budget,
    ];

    const transactions: Transaction[] = [
      {
        id: 'txn-1',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-groceries',
        amount: -600,
        date: '2026-07-05',
        merchant: null,
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-05',
      },
      {
        id: 'txn-2',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-housing',
        amount: -1500,
        date: '2026-07-01',
        merchant: null,
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-01',
      },
    ];

    const categories: Category[] = [
      {
        id: 'cat-groceries',
        user_id: 'user-1',
        name: 'Groceries',
        type: 'expense',
        icon: 'shopping-cart',
        color: '#f97316',
        is_system: false,
        is_archived: false,
        sort_order: 0,
        created_at: '2024-01-01',
      },
      {
        id: 'cat-housing',
        user_id: 'user-1',
        name: 'Housing',
        type: 'expense',
        icon: 'home',
        color: '#ef4444',
        is_system: false,
        is_archived: false,
        sort_order: 1,
        created_at: '2024-01-01',
      },
    ];

    const result = FinancialEngine.getBudgetHealth(budgets, transactions, categories, 6000);

    // Groceries: $600 / $800 = 75%
    const groceries = result.categories.find((c) => c.categoryId === 'cat-groceries');
    expect(groceries).toBeDefined();
    expect(groceries!.spent).toBe(600);
    expect(groceries!.budgeted).toBe(800);
    expect(groceries!.percentUsed).toBe(75);
    expect(groceries!.status).toBe('under');

    // Housing: $1500 / $1500 = 100%
    const housing = result.categories.find((c) => c.categoryId === 'cat-housing');
    expect(housing).toBeDefined();
    expect(housing!.spent).toBe(1500);
    expect(housing!.budgeted).toBe(1500);
    expect(housing!.percentUsed).toBe(100);
    expect(housing!.status).toBe('at_limit');

    // Overall
    expect(result.totalBudgeted).toBe(2300);
    expect(result.totalSpent).toBe(2100);
  });

  it('should flag over-budget categories correctly', () => {
    const budgets: Budget[] = [
      {
        id: 'bud-1',
        user_id: 'user-1',
        category_id: 'cat-dining',
        year: 2026,
        month: 7,
        amount: 200,
        rollover: false,
        created_at: '2026-07-01',
      } as Budget,
    ];

    const transactions: Transaction[] = [
      {
        id: 'txn-1',
        user_id: 'user-1',
        account_id: 'acc-1',
        category_id: 'cat-dining',
        amount: -300,
        date: '2026-07-05',
        merchant: null,
        note: null,
        is_archived: false,
        recurring_id: null,
        created_at: '2026-07-05',
      },
    ];

    const categories: Category[] = [
      {
        id: 'cat-dining',
        user_id: 'user-1',
        name: 'Dining',
        type: 'expense',
        icon: 'utensils',
        color: '#eab308',
        is_system: false,
        is_archived: false,
        sort_order: 0,
        created_at: '2024-01-01',
      },
    ];

    const result = FinancialEngine.getBudgetHealth(budgets, transactions, categories, 6000);

    const dining = result.categories.find((c) => c.categoryId === 'cat-dining');
    expect(dining).toBeDefined();
    expect(dining!.spent).toBe(300);
    expect(dining!.budgeted).toBe(200);
    expect(dining!.percentUsed).toBe(150);
    expect(dining!.status).toBe('over');
  });
});
