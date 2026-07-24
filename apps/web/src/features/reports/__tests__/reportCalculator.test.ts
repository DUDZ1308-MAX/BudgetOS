import { describe, it, expect } from 'vitest';
import {
  computeTimeRange,
  computeMonthlyKpis,
  computeCashFlowChart,
  computeCategoryPieChart,
  computeBudgetBarChart,
  computeSavingsBarChart,
  computeMortgageChart,
  computeNetWorthChart,
  computeIncomeTrendChart,
  computeExpenseTrendChart,
  computeRecurringSummary,
  computeForecastSummary,
} from '../utils/reportCalculator';
import type { Account, Budget, Category, Transaction, SavingsGoal, Mortgage } from '@budgetos/database';

function makeAccount(overrides: Partial<Account> & { id: string; name: string; type: Account['type'] }): Account {
  return {
    user_id: 'user-1', balance: 0, currency: 'USD', institution: null, is_active: true,
    include_in_net_worth: true, sort_order: 0, created_at: '2024-01-01', ...overrides,
  };
}

function makeTx(overrides: Partial<Transaction> & { id: string; amount: number; date: string }): Transaction {
  return {
    account_id: 'acc-1', user_id: 'user-1', payee: 'Test', category_id: null,
    notes: null, is_recurring: false, is_manual: false, is_active: true,
    currency: 'USD', tags: [], is_confirmed: true, is_pending: false,
    created_at: overrides.date, updated_at: overrides.date, ...overrides,
  };
}

function makeCategory(overrides: Partial<Category> & { id: string; name: string }): Category {
  return {
    user_id: 'user-1', color: '#000', icon: 'tag', sort_order: 0,
    is_active: true, created_at: '2024-01-01', ...overrides,
  };
}

function makeBudget(overrides: Partial<Budget> & { id: string; category_id: string }): Budget {
  return {
    user_id: 'user-1', name: 'Test Budget', amount: 1000, spent: 500,
    period: 'monthly', start_date: '2024-01-01', end_date: null,
    is_active: true, created_at: '2024-01-01', ...overrides,
  };
}

describe('reportCalculator', () => {
  describe('computeTimeRange', () => {
    it('returns date range for 30d', () => {
      const range = computeTimeRange('30d');
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
      expect(new Date(range.start) <= new Date(range.end)).toBe(true);
    });
  });

  describe('computeMonthlyKpis', () => {
    it('returns KpiMetric array with income, expenses, net worth, savings rate', () => {
      const txns: Transaction[] = [];
      const recurrings: Array<{ amount: number; frequency: string; type: string; status: string }> = [];
      const accounts = [makeAccount({ id: 'acc-1', name: 'Checking', type: 'checking', balance: 5000 })];
      const range = computeTimeRange('30d');
      const result = computeMonthlyKpis(txns, recurrings, accounts, range);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(4);
      expect(result.some((k) => k.label === 'Income')).toBe(true);
      expect(result.some((k) => k.label === 'Expenses')).toBe(true);
      expect(result.some((k) => k.label === 'Net Worth')).toBe(true);
      expect(result.some((k) => k.label === 'Savings Rate')).toBe(true);
    });
  });

  describe('computeCashFlowChart', () => {
    it('returns chart config with income and expense areas', () => {
      const txns: Transaction[] = [
        makeTx({ id: 'tx-1', amount: 1000, date: '2024-06-15' }),
        makeTx({ id: 'tx-2', amount: -500, date: '2024-06-16' }),
      ];
      const range = computeTimeRange('30d');
      const result = computeCashFlowChart(txns, range);
      expect(result.title).toBe('Cash Flow Trend');
      expect(result.type).toBe('area');
      expect(result.series).toHaveLength(3);
      expect(result.series.some((s) => s.name === 'Income')).toBe(true);
      expect(result.series.some((s) => s.name === 'Expenses')).toBe(true);
    });
  });

  describe('computeCategoryPieChart', () => {
    it('returns pie chart with category totals', () => {
      const txns: Transaction[] = [
        makeTx({ id: 'tx-1', amount: -200, date: '2024-06-15', category_id: 'cat-1' }),
        makeTx({ id: 'tx-2', amount: -300, date: '2024-06-16', category_id: 'cat-2' }),
      ];
      const categories = [makeCategory({ id: 'cat-1', name: 'Food' }), makeCategory({ id: 'cat-2', name: 'Transport' })];
      const result = computeCategoryPieChart(txns, categories);
      expect(result.type).toBe('pie');
      expect(result.title).toBe('Spending Breakdown');
      expect(result.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('computeBudgetBarChart', () => {
    it('returns budget vs actual bar chart', () => {
      const budgets: Budget[] = [];
      const txns: Transaction[] = [];
      const categories: Category[] = [];
      const result = computeBudgetBarChart(budgets, txns, categories, 5000);
      expect(result.type).toBe('bar');
      expect(result.title).toBe('Budget vs Actual');
    });
  });

  describe('computeSavingsBarChart', () => {
    it('returns savings goal progress with bar chart', () => {
      const result = computeSavingsBarChart([]);
      expect(result.type).toBe('bar');
      expect(result.title).toBe('Savings Goal Progress');
    });
  });

  describe('computeMortgageChart', () => {
    it('returns mortgage projection chart', () => {
      const mortgage: Mortgage = {
        id: 'm-1', user_id: 'user-1', name: 'Home', principal: 300000,
        annual_rate: 6.5, term_years: 30, start_date: '2024-01-01',
        extra_payment: 0, is_active: true,
      };
      const result = computeMortgageChart(mortgage);
      expect(result.title).toBe('Mortgage Balance Projection');
    });
  });

  describe('computeNetWorthChart', () => {
    it('returns net worth line chart', () => {
      const accounts = [
        makeAccount({ id: 'acc-1', name: 'Checking', type: 'checking', balance: 5000 }),
        makeAccount({ id: 'acc-2', name: 'Credit Card', type: 'credit', balance: -1000 }),
      ];
      const result = computeNetWorthChart([], accounts);
      expect(result.type).toBe('line');
      expect(result.title).toBe('Net Worth Timeline');
    });
  });

  describe('computeIncomeTrendChart', () => {
    it('returns income trend area chart', () => {
      const txns: Transaction[] = [
        makeTx({ id: 'tx-1', amount: 1000, date: '2024-06-15' }),
      ];
      const result = computeIncomeTrendChart(txns);
      expect(result.type).toBe('area');
      expect(result.title).toBe('Income Trend');
    });
  });

  describe('computeExpenseTrendChart', () => {
    it('returns expense trend area chart', () => {
      const txns: Transaction[] = [
        makeTx({ id: 'tx-1', amount: -200, date: '2024-06-15' }),
      ];
      const result = computeExpenseTrendChart(txns);
      expect(result.type).toBe('area');
      expect(result.title).toBe('Expense Trend');
    });
  });

  describe('computeRecurringSummary', () => {
    it('returns recurring summary pie chart', () => {
      const recurrings: Array<{ amount: number; type: string; frequency: string; status: string; name: string }> = [
        { amount: 200, type: 'expense', frequency: 'monthly', status: 'active', name: 'Netflix' },
      ];
      const result = computeRecurringSummary(recurrings);
      expect(result.type).toBe('pie');
      expect(result.title).toBe('Recurring Summary');
    });
  });

  describe('computeForecastSummary', () => {
    it('returns forecast projection chart', () => {
      const result = computeForecastSummary(50000, 15000, 10000, 6000, 4000);
      expect(result.type).toBe('line');
      expect(result.title).toBe('Forecast Projection');
      expect(result.series?.some((s) => s.name === 'Net Worth')).toBe(true);
      expect(result.series?.some((s) => s.name === 'Savings')).toBe(true);
    });
  });
});
