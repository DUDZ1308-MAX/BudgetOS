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
    account_id: 'acc-1', user_id: 'user-1', merchant: 'Test', category_id: null,
    note: null, is_recurring: false, is_pending: false, recurring_id: null,
    currency: 'USD', tags: [], is_archived: false, description: null,
    notes: null, created_at: overrides.date, updated_at: overrides.date, ...overrides,
  };
}

function makeCategory(overrides: Partial<Category> & { id: string; name: string; type: Category['type'] }): Category {
  return {
    user_id: 'user-1', color: null, icon: null, sort_order: 0,
    is_system: false, is_archived: false, created_at: '2024-01-01', ...overrides,
  };
}

function makeBudget(overrides: Partial<Budget> & { id: string; category_id: string }): Budget {
  return {
    user_id: 'user-1', amount: 1000, year: 2024, month: 6,
    rollover: false, month_key: '2024-06', rollover_enabled: false,
    created_at: '2024-01-01', updated_at: '2024-06-01', ...overrides,
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
    it('returns KpiMetric array', () => {
      const txns: Transaction[] = [];
      const recurrings: Array<{ amount: number; frequency: string; type: string; status: string }> = [];
      const accounts = [makeAccount({ id: 'acc-1', name: 'Checking', type: 'checking', balance: 5000 })];
      const range = computeTimeRange('30d');
      const result = computeMonthlyKpis(txns, recurrings, accounts, range);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(4);
      expect(result.some((k) => k.label === 'Income')).toBe(true);
    });
  });

  describe('computeCashFlowChart', () => {
    it('returns chart config', () => {
      const txns: Transaction[] = [
        makeTx({ id: 'tx-1', amount: 1000, date: '2024-06-15' }),
        makeTx({ id: 'tx-2', amount: -500, date: '2024-06-16' }),
      ];
      const range = computeTimeRange('30d');
      const result = computeCashFlowChart(txns, range);
      expect(result.title).toBe('Cash Flow Trend');
      expect(result.type).toBe('area');
    });
  });

  describe('computeCategoryPieChart', () => {
    it('returns pie chart', () => {
      const txns: Transaction[] = [
        makeTx({ id: 'tx-1', amount: -200, date: '2024-06-15', category_id: 'cat-1' }),
        makeTx({ id: 'tx-2', amount: -300, date: '2024-06-16', category_id: 'cat-2' }),
      ];
      const categories = [makeCategory({ id: 'cat-1', name: 'Food', type: 'expense' }), makeCategory({ id: 'cat-2', name: 'Transport', type: 'expense' })];
      const result = computeCategoryPieChart(txns, categories);
      expect(result.type).toBe('pie');
    });
  });

  describe('computeBudgetBarChart', () => {
    it('returns budget vs actual chart', () => {
      const result = computeBudgetBarChart([], [], [], 5000);
      expect(result.type).toBe('bar');
    });
  });

  describe('computeSavingsBarChart', () => {
    it('returns savings chart', () => {
      const result = computeSavingsBarChart([]);
      expect(result.type).toBe('bar');
    });
  });

  describe('computeMortgageChart', () => {
    it('returns mortgage chart', () => {
      const mortgage: Mortgage = {
        id: 'm-1', user_id: 'user-1', name: 'Home', principal: 300000,
        annual_rate: 6.5, term_years: 30, start_date: '2024-01-01',
        extra_payment: 0, is_active: true, down_payment: 60000,
        payment_frequency: 'monthly', compound_semi_annual: true,
        amortization_years: 30, purchase_price: 360000,
        extra_payments: [], created_at: '2024-01-01', updated_at: '2024-01-01',
      };
      const result = computeMortgageChart(mortgage);
      expect(result.title).toBe('Mortgage Balance Projection');
    });
  });

  describe('computeNetWorthChart', () => {
    it('returns net worth chart', () => {
      const accounts = [makeAccount({ id: 'acc-1', name: 'Checking', type: 'checking', balance: 5000 })];
      const result = computeNetWorthChart([], accounts);
      expect(result.type).toBe('line');
    });
  });

  describe('computeIncomeTrendChart', () => {
    it('returns income trend chart', () => {
      const txns: Transaction[] = [makeTx({ id: 'tx-1', amount: 1000, date: '2024-06-15' })];
      const result = computeIncomeTrendChart(txns);
      expect(result.type).toBe('area');
    });
  });

  describe('computeExpenseTrendChart', () => {
    it('returns expense trend chart', () => {
      const txns: Transaction[] = [makeTx({ id: 'tx-1', amount: -200, date: '2024-06-15' })];
      const result = computeExpenseTrendChart(txns);
      expect(result.type).toBe('area');
    });
  });

  describe('computeRecurringSummary', () => {
    it('returns recurring summary', () => {
      const recurrings: Array<{ amount: number; type: string; frequency: string; status: string; name: string }> = [
        { amount: 200, type: 'expense', frequency: 'monthly', status: 'active', name: 'Netflix' },
      ];
      const result = computeRecurringSummary(recurrings);
      expect(result.type).toBe('pie');
    });
  });

  describe('computeForecastSummary', () => {
    it('returns forecast chart', () => {
      const result = computeForecastSummary(50000, 15000, 10000, 6000, 4000);
      expect(result.type).toBe('line');
    });
  });
});
