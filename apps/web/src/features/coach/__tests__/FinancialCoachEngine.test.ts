import { describe, it, expect } from 'vitest';
import { FinancialCoachEngine, fmt, pct } from '../FinancialCoachEngine';
import { FinancialEngine } from '@/services/FinancialEngine';
import type { Account, Category, Transaction, SavingsGoal, Mortgage, Budget } from '@budgetos/database';

const today = new Date();
const y = today.getFullYear();
const m = String(today.getMonth() + 1).padStart(2, '0');
const d = String(today.getDate()).padStart(2, '0');
const todayStr = `${y}-${m}-${d}`;

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

function makeSavingsGoal(overrides: Partial<SavingsGoal> & { id: string; name: string }): SavingsGoal {
  return {
    user_id: 'user-1', target_amount: 10000, current_amount: 5000,
    target_date: null, monthly_contribution: 500, category_id: null,
    is_completed: false, sort_order: 0, priority: 1, status: 'active',
    created_at: '2024-01-01', ...overrides,
  };
}

function makeMortgage(overrides: Partial<Mortgage> & { id: string; name: string }): Mortgage {
  return {
    user_id: 'user-1', principal: 300000, annual_rate: 6.5, term_years: 30,
    start_date: '2024-01-01', extra_payment: 0, is_active: true,
    down_payment: 60000, payment_frequency: 'monthly', compound_semi_annual: true,
    amortization_years: 30, purchase_price: 360000, extra_payments: [],
    created_at: '2024-01-01', updated_at: '2024-01-01', ...overrides,
  };
}

const defaultData = () => ({
  accounts: [makeAccount({ id: 'acc-1', name: 'Checking', type: 'checking', balance: 10000 })],
  transactions: [
    makeTx({ id: 'tx-1', amount: 6000, date: todayStr }),
    makeTx({ id: 'tx-2', amount: -4000, date: todayStr, category_id: 'cat-1' }),
  ],
  categories: [makeCategory({ id: 'cat-1', name: 'Food', type: 'expense' })],
  budgets: [makeBudget({ id: 'budget-1', category_id: 'cat-1', amount: 500 })],
  savingsGoals: [makeSavingsGoal({ id: 'goal-1', name: 'Emergency Fund' })],
  mortgages: [] as Mortgage[],
  recurrings: [
    { amount: 150, frequency: 'monthly' as const, type: 'expense' as const, status: 'active' as const, name: 'Netflix' },
    { amount: 3000, frequency: 'biweekly' as const, type: 'income' as const, status: 'active' as const, name: 'Salary' },
  ],
});

describe('fmt', () => {
  it('formats currency values', () => {
    expect(fmt(1000)).toMatch(/\$1[,.]000/);
    expect(fmt(0)).toMatch(/\$0/);
    expect(fmt(-500)).toMatch(/-/);
  });
});

describe('pct', () => {
  it('formats percentage values', () => {
    expect(pct(25.5)).toBe('25.5%');
    expect(pct(0)).toBe('0.0%');
    expect(pct(100)).toBe('100.0%');
  });
});

describe('FinancialCoachEngine', () => {
  describe('FinancialEngine smoke test', () => {
    it('getCashFlow returns valid numbers', () => {
      const range = { start: '2024-01-01', end: '2030-12-31' };
      const d = defaultData();
      const result = FinancialEngine.getCashFlow(d.transactions, d.recurrings, range);
      expect(typeof result.monthlyIncome).toBe('number');
      expect(isNaN(result.monthlyIncome)).toBe(false);
      expect(result.monthlyIncome).toBeGreaterThan(0);
    });

    it('getNetWorth returns valid numbers', () => {
      const result = FinancialEngine.getNetWorth([makeAccount({ id: 'acc-1', name: 'Checking', type: 'checking', balance: 10000 })]);
      expect(typeof result.netWorth).toBe('number');
      expect(isNaN(result.netWorth)).toBe(false);
      expect(result.netWorth).toBe(10000);
    });

    it('getBudgetHealth returns valid results', () => {
      const d = defaultData();
      const result = FinancialEngine.getBudgetHealth(d.budgets, d.transactions, d.categories, 5000);
      expect(result).toBeDefined();
      expect(typeof result.totalBudgeted).toBe('number');
    });
  });

  describe('answer', () => {
    it('returns spending summary for spending-summary question', () => {
      const answer = FinancialCoachEngine.answer(defaultData(), 'spending-summary');
      expect(answer.questionId).toBe('spending-summary');
      expect(answer.summary).toBeTruthy();
      expect(answer.metrics.length).toBeGreaterThan(0);
      expect(answer.calculations.length).toBeGreaterThan(0);
      expect(answer.confidence).toBeGreaterThan(0);
    });

    it('returns budget health answer', () => {
      const answer = FinancialCoachEngine.answer(defaultData(), 'budget-health');
      expect(answer.questionId).toBe('budget-health');
      expect(answer.summary).toBeTruthy();
    });

    it('returns savings progress answer', () => {
      const answer = FinancialCoachEngine.answer(defaultData(), 'savings-progress');
      expect(answer.questionId).toBe('savings-progress');
      expect(answer.summary).toBeTruthy();
    });

    it('returns mortgage status answer with no mortgage', () => {
      const answer = FinancialCoachEngine.answer(defaultData(), 'mortgage-status');
      expect(answer.questionId).toBe('mortgage-status');
      expect(answer.summary).toMatch(/No active mortgage/);
    });

    it('returns mortgage status answer with active mortgage', () => {
      const data = { ...defaultData(), mortgages: [makeMortgage({ id: 'm-1', name: 'Home' })] };
      const answer = FinancialCoachEngine.answer(data, 'mortgage-status');
      expect(answer.questionId).toBe('mortgage-status');
      expect(answer.summary).toMatch(/Mortgage/);
    });

    it('returns cash flow answer', () => {
      const answer = FinancialCoachEngine.answer(defaultData(), 'cash-flow');
      expect(answer.questionId).toBe('cash-flow');
      expect(answer.summary).toMatch(/cash flow/i);
    });

    it('returns net worth answer', () => {
      const answer = FinancialCoachEngine.answer(defaultData(), 'net-worth');
      expect(answer.questionId).toBe('net-worth');
      expect(answer.summary).toMatch(/Net worth/i);
    });

    it('returns safe-to-spend answer', () => {
      const answer = FinancialCoachEngine.answer(defaultData(), 'safe-to-spend');
      expect(answer.questionId).toBe('safe-to-spend');
      expect(answer.summary).toMatch(/safe to spend/i);
    });

    it('returns forecast answer', () => {
      const answer = FinancialCoachEngine.answer(defaultData(), 'forecast');
      expect(answer.questionId).toBe('forecast');
      expect(answer.summary).toBeTruthy();
    });

    it('returns recurring answer', () => {
      const answer = FinancialCoachEngine.answer(defaultData(), 'recurring-overview');
      expect(answer.questionId).toBe('recurring-overview');
      expect(answer.summary).toMatch(/recurring/i);
    });

    it('returns top categories answer', () => {
      const answer = FinancialCoachEngine.answer(defaultData(), 'top-categories');
      expect(answer.questionId).toBe('top-categories');
      expect(answer.summary).toMatch(/Top category/i);
    });
  });

  describe('generateRecommendations', () => {
    it('returns recommendations array', () => {
      const recs = FinancialCoachEngine.generateRecommendations(defaultData());
      expect(Array.isArray(recs)).toBe(true);
    });

    it('includes savings rate recommendation when savings rate is low', () => {
      const lowSavingsData = {
        ...defaultData(),
        recurrings: [] as Array<{ amount: number; frequency: string; type: string; status: string; name: string }>,
        transactions: [
          makeTx({ id: 'tx-1', amount: 5000, date: todayStr }),
          makeTx({ id: 'tx-2', amount: -4900, date: todayStr }),
        ],
      };
      const recs = FinancialCoachEngine.generateRecommendations(lowSavingsData);
      const savingsRec = recs.find((r) => r.id === 'rec-savings-rate');
      expect(savingsRec).toBeDefined();
      expect(savingsRec?.category).toBe('savings');
    });

    it('includes budget recommendations when over budget', () => {
      const data = {
        ...defaultData(),
        budgets: [makeBudget({ id: 'budget-1', category_id: 'cat-1', amount: 100 })],
        transactions: [
          makeTx({ id: 'tx-1', amount: 5000, date: todayStr }),
          makeTx({ id: 'tx-2', amount: -500, date: todayStr, category_id: 'cat-1' }),
        ],
      };
      const recs = FinancialCoachEngine.generateRecommendations(data);
      const budgetRec = recs.find((r) => r.id?.startsWith('rec-budget-'));
      expect(budgetRec).toBeDefined();
      expect(budgetRec?.category).toBe('budget');
    });

    it('returns empty recommendations for no-data edge case', () => {
      const emptyData = { accounts: [], transactions: [], categories: [], budgets: [], savingsGoals: [], mortgages: [], recurrings: [] };
      const recs = FinancialCoachEngine.generateRecommendations(emptyData);
      expect(Array.isArray(recs)).toBe(true);
    });
  });

  describe('generateSummary', () => {
    it('returns summary with numeric fields', () => {
      const summary = FinancialCoachEngine.generateSummary(defaultData());
      expect(typeof summary.totalIncome).toBe('number');
      expect(isNaN(summary.totalIncome)).toBe(false);
      expect(typeof summary.totalExpenses).toBe('number');
      expect(typeof summary.netWorth).toBe('number');
      expect(typeof summary.savingsRate).toBe('number');
      expect(summary.budgetHealth).toMatch(/good|fair|poor/);
      expect(typeof summary.recommendationCount).toBe('number');
      expect(summary.lastUpdated).toBeTruthy();
    });
  });
});
