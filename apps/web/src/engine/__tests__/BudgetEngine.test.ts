import { describe, it, expect } from 'vitest';
import { computeBudgetSummary } from '../BudgetEngine';
import { computeCashFlowSummary } from '../CashFlowEngine';
import type { BudgetEngineInput, CashFlowEngineInput } from '../types';

function makeInput(overrides?: Partial<BudgetEngineInput>): BudgetEngineInput {
  return {
    transactions: [],
    accounts: [],
    categories: [],
    budgets: [],
    dateRange: { start: '2025-01-01', end: '2025-01-31' },
    ...overrides,
  };
}

function makeCashFlowInput(overrides?: Partial<CashFlowEngineInput>): CashFlowEngineInput {
  return {
    transactions: [],
    accounts: [],
    ...overrides,
  };
}

describe('computeBudgetSummary — income', () => {
  it('correct income calculation', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 5000, date: '2025-01-05', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'c1', amount: 2000, date: '2025-01-15', merchant: null, note: null, is_archived: false },
          { id: '3', account_id: 'a1', category_id: 'c2', amount: -100, date: '2025-01-10', merchant: null, note: null, is_archived: false },
        ],
      }),
    );
    expect(result.income.total).toBe(7000);
    expect(result.income.averageDaily).toBeCloseTo(7000 / 31, 2);
  });

  it('handles income-only scenario correctly', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 10000, date: '2025-01-01', merchant: null, note: null, is_archived: false },
        ],
      }),
    );
    expect(result.income.total).toBe(10000);
    expect(result.expenses.total).toBe(0);
    expect(result.cashFlow.netIncome).toBe(10000);
    expect(result.savingsCapacity.surplus).toBe(2000);
    expect(result.savingsCapacity.savingsRate).toBe(20);
  });

  it('calculates zero income when no transactions', () => {
    const result = computeBudgetSummary(makeInput());
    expect(result.income.total).toBe(0);
    expect(result.income.averageDaily).toBe(0);
  });
});

describe('computeBudgetSummary — expenses', () => {
  it('correct expense calculation', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 5000, date: '2025-01-05', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'c2', amount: -200, date: '2025-01-10', merchant: null, note: null, is_archived: false },
          { id: '3', account_id: 'a1', category_id: 'c3', amount: -300, date: '2025-01-15', merchant: null, note: null, is_archived: false },
        ],
      }),
    );
    expect(result.expenses.total).toBe(500);
    expect(result.expenses.byCategory).toHaveLength(2);
  });

  it('computes expense breakdown by category with correct percentages', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'cat-a', amount: -100, date: '2025-01-05', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'cat-b', amount: -300, date: '2025-01-10', merchant: null, note: null, is_archived: false },
        ],
      }),
    );
    const catA = result.expenses.byCategory.find((c) => c.categoryId === 'cat-a');
    const catB = result.expenses.byCategory.find((c) => c.categoryId === 'cat-b');
    expect(catA).toBeDefined();
    expect(catB).toBeDefined();
    expect(catA!.percentage).toBeCloseTo(25, 0);
    expect(catB!.percentage).toBeCloseTo(75, 0);
  });

  it('ignores archived transactions', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 5000, date: '2025-01-05', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'c2', amount: -1000, date: '2025-01-10', merchant: null, note: null, is_archived: true },
        ],
      }),
    );
    expect(result.income.total).toBe(5000);
    expect(result.expenses.total).toBe(0);
  });

  it('filters transactions outside date range', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 5000, date: '2024-12-31', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'c2', amount: -200, date: '2025-01-15', merchant: null, note: null, is_archived: false },
        ],
      }),
    );
    expect(result.income.total).toBe(0);
    expect(result.expenses.total).toBe(200);
  });
});

describe('computeBudgetSummary — net cash flow', () => {
  it('correct net cash flow', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 5000, date: '2025-01-05', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'c2', amount: -2000, date: '2025-01-10', merchant: null, note: null, is_archived: false },
          { id: '3', account_id: 'a1', category_id: 'c2', amount: -500, date: '2025-01-15', merchant: null, note: null, is_archived: false },
        ],
      }),
    );
    expect(result.cashFlow.netIncome).toBe(2500);
  });

  it('cash flow is negative when expenses exceed income', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 3000, date: '2025-01-05', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'c2', amount: -5000, date: '2025-01-10', merchant: null, note: null, is_archived: false },
        ],
      }),
    );
    expect(result.cashFlow.netIncome).toBe(-2000);
    expect(result.savingsCapacity.recommendedAmount).toBe(0);
  });
});

describe('computeBudgetSummary — budget analysis', () => {
  it('correct budget overrun detection', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'cat-food', amount: -600, date: '2025-01-10', merchant: null, note: null, is_archived: false },
        ],
        categories: [
          { id: 'cat-food', name: 'Food', type: 'expense', is_archived: false },
        ],
        budgets: [
          { category_id: 'cat-food', year: 2025, month: 1, amount: 500, rollover: false },
        ],
      }),
    );
    expect(result.budgetStatus.categories).toHaveLength(1);
    expect(result.budgetStatus.categories[0]!.status).toBe('over');
    expect(result.budgetStatus.overBudget).toHaveLength(1);
    expect(result.budgetStatus.underBudget).toHaveLength(0);
    expect(result.budgetStatus.categories[0]!.percentUsed).toBeGreaterThan(100);
    expect(result.budgetStatus.totalBudgeted).toBe(500);
    expect(result.budgetStatus.totalSpent).toBe(600);
    expect(result.budgetStatus.totalRemaining).toBe(-100);
  });

  it('detects under-budget categories', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'cat-food', amount: -100, date: '2025-01-10', merchant: null, note: null, is_archived: false },
        ],
        categories: [
          { id: 'cat-food', name: 'Food', type: 'expense', is_archived: false },
        ],
        budgets: [
          { category_id: 'cat-food', year: 2025, month: 1, amount: 500, rollover: false },
        ],
      }),
    );
    expect(result.budgetStatus.categories[0]!.status).toBe('under');
    expect(result.budgetStatus.underBudget).toHaveLength(1);
    expect(result.budgetStatus.totalRemaining).toBe(400);
  });

  it('ignores categories with no budget set', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'cat-food', amount: -100, date: '2025-01-10', merchant: null, note: null, is_archived: false },
        ],
        categories: [
          { id: 'cat-food', name: 'Food', type: 'expense', is_archived: false },
        ],
        budgets: [],
      }),
    );
    expect(result.budgetStatus.categories).toHaveLength(0);
    expect(result.budgetStatus.totalBudgeted).toBe(0);
  });

  it('safeToSpendToday is correct with budget remaining', () => {
    const result = computeBudgetSummary(
      makeInput({
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'cat-food', amount: -100, date: '2025-01-10', merchant: null, note: null, is_archived: false },
        ],
        categories: [
          { id: 'cat-food', name: 'Food', type: 'expense', is_archived: false },
        ],
        budgets: [
          { category_id: 'cat-food', year: 2025, month: 1, amount: 500, rollover: false },
        ],
      }),
    );
    expect(result.cashFlow.safeToSpendToday).toBeCloseTo(400 / 31, 4);
  });

  it('safeToSpendToday is zero when no budgets set', () => {
    const result = computeBudgetSummary(makeInput());
    expect(result.cashFlow.safeToSpendToday).toBe(0);
  });
});

describe('computeBudgetSummary — savings rate', () => {
  it('correct savings rate calculation', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 5000, date: '2025-01-05', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'c2', amount: -2000, date: '2025-01-10', merchant: null, note: null, is_archived: false },
        ],
      }),
    );
    expect(result.savingsCapacity.surplus).toBe(1000);
    expect(result.savingsCapacity.recommendedAmount).toBe(1000);
    expect(result.savingsCapacity.savingsRate).toBe(20);
  });
});

describe('computeBudgetSummary — account metrics', () => {
  it('computes netWorth from assets and liabilities', () => {
    const result = computeBudgetSummary(
      makeInput({
        accounts: [
          { id: 'a1', name: 'Checking', type: 'checking', balance: 5000, is_active: true },
          { id: 'a2', name: 'Credit Card', type: 'credit', balance: -1500, is_active: true },
        ],
      }),
    );
    expect(result.accounts.totalAssets).toBe(5000);
    expect(result.accounts.totalLiabilities).toBe(-1500);
    expect(result.accounts.netWorth).toBe(3500);
    expect(result.accounts.remainingCash).toBe(3500);
    expect(result.accounts.accountCount).toBe(2);
  });

  it('skips inactive accounts', () => {
    const result = computeBudgetSummary(
      makeInput({
        accounts: [
          { id: 'a1', name: 'Checking', type: 'checking', balance: 5000, is_active: true },
          { id: 'a2', name: 'Closed Card', type: 'credit', balance: -1000, is_active: false },
        ],
      }),
    );
    expect(result.accounts.totalAssets).toBe(5000);
    expect(result.accounts.totalLiabilities).toBe(0);
    expect(result.accounts.accountCount).toBe(1);
  });

  it('computes remainingCash correctly with liabilities', () => {
    const result = computeBudgetSummary(
      makeInput({
        accounts: [
          { id: 'a1', name: 'Loan', type: 'loan', balance: -10000, is_active: true },
          { id: 'a2', name: 'Checking', type: 'checking', balance: 8000, is_active: true },
        ],
      }),
    );
    expect(result.accounts.netWorth).toBe(-2000);
    expect(result.accounts.remainingCash).toBe(-2000);
  });
});

describe('computeBudgetSummary — alerts', () => {
  it('generates overspend alerts', () => {
    const result = computeBudgetSummary(
      makeInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'cat-food', amount: -600, date: '2025-01-10', merchant: null, note: null, is_archived: false },
        ],
        categories: [
          { id: 'cat-food', name: 'Food', type: 'expense', is_archived: false },
        ],
        budgets: [
          { category_id: 'cat-food', year: 2025, month: 1, amount: 500, rollover: false },
        ],
      }),
    );
    const overspendAlerts = result.alerts.filter((a) => a.type === 'overspend');
    expect(overspendAlerts.length).toBeGreaterThanOrEqual(1);
    expect(overspendAlerts[0]!.severity).toBe('high');
  });

  it('generates low balance alerts when balance is negative', () => {
    const result = computeBudgetSummary(
      makeInput({
        accounts: [
          { id: 'a1', name: 'Checking', type: 'checking', balance: -500, is_active: true },
        ],
      }),
    );
    const lowBalanceAlerts = result.alerts.filter((a) => a.type === 'low_balance');
    expect(lowBalanceAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it('returns zero alerts for empty input', () => {
    const result = computeBudgetSummary(makeInput());
    expect(result.alerts).toHaveLength(0);
  });
});

describe('computeBudgetSummary — empty input', () => {
  it('returns zero values for all metrics', () => {
    const result = computeBudgetSummary(makeInput());
    expect(result.income.total).toBe(0);
    expect(result.expenses.total).toBe(0);
    expect(result.cashFlow.netIncome).toBe(0);
    expect(result.cashFlow.safeToSpendToday).toBe(0);
    expect(result.budgetStatus.categories).toHaveLength(0);
    expect(result.accounts.netWorth).toBe(0);
    expect(result.accounts.accountCount).toBe(0);
    expect(result.savingsCapacity.savingsRate).toBe(0);
    expect(result.alerts).toHaveLength(0);
  });
});

describe('computeBudgetSummary — date range edge cases', () => {
  it('works with single-day range', () => {
    const result = computeBudgetSummary(
      makeInput({
        dateRange: { start: '2025-06-15', end: '2025-06-15' },
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 1000, date: '2025-06-15', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'c2', amount: -400, date: '2025-06-15', merchant: null, note: null, is_archived: false },
        ],
      }),
    );
    expect(result.income.total).toBe(1000);
    expect(result.expenses.total).toBe(400);
    expect(result.cashFlow.netIncome).toBe(600);
    expect(result.income.averageDaily).toBe(1000);
  });
});

describe('computeCashFlowSummary', () => {
  it('returns empty daily balances for no transactions', () => {
    const result = computeCashFlowSummary(makeCashFlowInput());
    expect(result.dailyBalances).toHaveLength(0);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netFlow).toBe(0);
  });

  it('computes daily balances and running balance correctly', () => {
    const result = computeCashFlowSummary(
      makeCashFlowInput({
        accounts: [
          { id: 'a1', name: 'Checking', type: 'checking', balance: 1000, is_active: true },
        ],
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 500, date: '2025-01-01', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'c2', amount: -200, date: '2025-01-02', merchant: null, note: null, is_archived: false },
          { id: '3', account_id: 'a1', category_id: 'c1', amount: 300, date: '2025-01-03', merchant: null, note: null, is_archived: false },
        ],
      }),
    );
    expect(result.dailyBalances).toHaveLength(3);
    expect(result.dailyBalances[0]!.income).toBe(500);
    expect(result.dailyBalances[0]!.expenses).toBe(0);
    expect(result.dailyBalances[0]!.runningBalance).toBe(1500);
    expect(result.dailyBalances[1]!.expenses).toBe(200);
    expect(result.dailyBalances[1]!.runningBalance).toBe(1300);
    expect(result.dailyBalances[2]!.runningBalance).toBe(1600);
    expect(result.totalIncome).toBe(800);
    expect(result.totalExpenses).toBe(200);
    expect(result.netFlow).toBe(600);
  });

  it('computes 7-day and 30-day trends', () => {
    const txns = Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      account_id: 'a1',
      category_id: 'c1',
      amount: i < 5 ? 100 : -50,
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      merchant: null,
      note: null,
      is_archived: false,
    }));

    const result = computeCashFlowSummary(
      makeCashFlowInput({
        accounts: [{ id: 'a1', name: 'Checking', type: 'checking', balance: 500, is_active: true }],
        transactions: txns,
      }),
    );
    expect(result.dailyBalances.length).toBeGreaterThanOrEqual(7);
    expect(typeof result.sevenDayTrend).toBe('number');
    expect(typeof result.thirtyDayTrend).toBe('number');
  });

  it('income vs expense ratio is calculated correctly', () => {
    const result = computeCashFlowSummary(
      makeCashFlowInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 1000, date: '2025-01-01', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'c2', amount: -250, date: '2025-01-02', merchant: null, note: null, is_archived: false },
        ],
      }),
    );
    expect(result.incomeVsExpenseRatio).toBe(4);
  });

  it('ignores archived transactions', () => {
    const result = computeCashFlowSummary(
      makeCashFlowInput({
        transactions: [
          { id: '1', account_id: 'a1', category_id: 'c1', amount: 1000, date: '2025-01-01', merchant: null, note: null, is_archived: false },
          { id: '2', account_id: 'a1', category_id: 'c2', amount: -500, date: '2025-01-02', merchant: null, note: null, is_archived: true },
        ],
      }),
    );
    expect(result.totalIncome).toBe(1000);
    expect(result.totalExpenses).toBe(0);
  });
});
