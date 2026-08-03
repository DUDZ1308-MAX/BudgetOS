import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseScenario, runCoachScenario } from '../scenarios';
import { makeSnapshot } from './fixtures';

vi.mock('@/services/FinancialEngine', () => ({
  FinancialEngine: {
    getMortgageForecast: vi.fn(),
    getSavingsForecast: vi.fn(),
    runScenario: vi.fn(),
  },
}));

import { FinancialEngine } from '@/services/FinancialEngine';
const mocked = vi.mocked(FinancialEngine);

describe('scenario parsing', () => {
  it('parses an extra mortgage payment', () => {
    expect(parseScenario('What if I pay an extra $200 on my mortgage?')).toEqual({
      type: 'mortgage',
      extraAmount: 200,
    });
  });

  it('parses extra savings', () => {
    expect(parseScenario('What if I save an extra $100 a month?')).toEqual({
      type: 'savings',
      extraAmount: 100,
    });
  });

  it('parses reduced spending', () => {
    expect(parseScenario('What if I reduce my spending by $50?')).toEqual({
      type: 'expense',
      reduceAmount: 50,
      target: undefined,
    });
  });

  it('parses increased income', () => {
    expect(parseScenario('What if I make $300 more a month?')).toEqual({
      type: 'income',
      increaseAmount: 300,
    });
  });

  it('returns null for non-scenario questions', () => {
    expect(parseScenario('How is my budget doing?')).toBeNull();
    expect(parseScenario('')).toBeNull();
  });
});

describe('mortgage scenario (Phase 10)', () => {
  beforeEach(() => {
    mocked.getMortgageForecast.mockReset();
    mocked.getSavingsForecast.mockReset();
    mocked.runScenario.mockReset();
  });

  it('runs a mortgage scenario and reports months + interest saved', () => {
    const snapshot = makeSnapshot({
      rawMortgages: [
        {
          id: 'm1',
          name: 'Home',
          principal: 200000,
          annualRate: 5,
          termYears: 25,
          amortizationYears: 25,
          startDate: '2020-01-01',
          paymentFrequency: 'monthly',
          extraPayments: [],
        },
      ],
    });

    mocked.getMortgageForecast
      .mockReturnValueOnce({
        id: 'm1', name: 'Home', monthlyPayment: 1169, originalPrincipal: 200000,
        currentBalance: 150000, annualRate: 5, points: [], baselineInterest: 100000,
        projectedInterest: 80000, interestSaved: 20000, payoffDate: '2038-06-01',
        payoffMonths: 214, yearsRemaining: 17.8,
      })
      .mockReturnValueOnce({
        id: 'm1', name: 'Home', monthlyPayment: 1169, originalPrincipal: 200000,
        currentBalance: 150000, annualRate: 5, points: [], baselineInterest: 100000,
        projectedInterest: 75000, interestSaved: 25000, payoffDate: '2037-02-01',
        payoffMonths: 194, yearsRemaining: 16.2,
      });

    const result = runCoachScenario(snapshot, { type: 'mortgage', extraAmount: 200 });

    expect(result).not.toBeNull();
    expect(result?.mortgage).toBeDefined();
    expect(result?.mortgage?.monthsSaved).toBe(20);
    expect(result?.mortgage?.interestSavedDelta).toBe(5000);
    expect(result?.mortgage?.baseline.payoffMonths).toBe(214);
    expect(result?.mortgage?.scenario.payoffMonths).toBe(194);
    expect(mocked.getMortgageForecast).toHaveBeenCalledTimes(2);
  });

  it('falls back to the comparison engine when there is no mortgage', () => {
    const snapshot = makeSnapshot();
    mocked.runScenario.mockReturnValue({
      baseline: { label: 'Baseline', projections: [], finalNetWorth: 100, finalDebt: 50, finalSavings: 50 },
      scenario: { label: 'Scenario', projections: [], finalNetWorth: 120, finalDebt: 40, finalSavings: 60 },
      delta: { netWorth: 20, debt: -10, savings: 10, cashFlowPerMonth: 15 },
      recommendation: 'Add the extra payment.',
    });

    const result = runCoachScenario(snapshot, { type: 'mortgage', extraAmount: 200 });

    expect(result?.comparison).toBeDefined();
    expect(result?.comparison?.delta.netWorth).toBe(20);
    expect(mocked.runScenario).toHaveBeenCalledTimes(1);
  });
});

describe('savings scenario (Phase 10)', () => {
  beforeEach(() => {
    mocked.getMortgageForecast.mockReset();
    mocked.getSavingsForecast.mockReset();
    mocked.runScenario.mockReset();
  });

  it('uses the raw monthly contribution and reports months saved', () => {
    const snapshot = makeSnapshot({
      rawSavings: [
        { id: 'g1', name: 'Emergency Fund', currentAmount: 3000, targetAmount: 10000, monthlyContribution: 200, targetDate: '2027-06-01' },
      ],
    });

    mocked.getSavingsForecast
      .mockReturnValueOnce({
        goals: [
          { goalId: 'g1', goalName: 'Emergency Fund', currentAmount: 3000, targetAmount: 10000, monthlyContribution: 200, targetDate: '2027-06-01', projectedCompletionDate: '2029-11-01', onTrack: false, projectedBalance: 9500, milestones: [] },
        ],
        totalCurrentSaved: 3000, totalTargetSaved: 10000, totalProjectedSaved: 9500,
        overallCompletionPercent: 30, projectedCompletionDate: '2029-11-01',
      })
      .mockReturnValueOnce({
        goals: [
          { goalId: 'g1', goalName: 'Emergency Fund', currentAmount: 3000, targetAmount: 10000, monthlyContribution: 300, targetDate: '2027-06-01', projectedCompletionDate: '2028-08-01', onTrack: true, projectedBalance: 10100, milestones: [] },
        ],
        totalCurrentSaved: 3000, totalTargetSaved: 10000, totalProjectedSaved: 10100,
        overallCompletionPercent: 30, projectedCompletionDate: '2028-08-01',
      });

    const result = runCoachScenario(snapshot, { type: 'savings', extraAmount: 100 });

    expect(result).not.toBeNull();
    expect(result?.savings).toBeDefined();
    expect(result?.savings?.baseline.projectedBalance).toBe(9500);
    expect(result?.savings?.scenario.projectedBalance).toBe(10100);
    expect(result?.savings?.monthsSaved).not.toBeNull();
    expect(mocked.getSavingsForecast).toHaveBeenCalledTimes(2);
  });

  it('never mutates the input snapshot', () => {
    const rawSavings = [
      { id: 'g1', name: 'EF', currentAmount: 1000, targetAmount: 5000, monthlyContribution: 100, targetDate: null },
    ];
    const snapshot = makeSnapshot({ rawSavings });
    const original = JSON.stringify(snapshot);

    mocked.getSavingsForecast.mockReturnValue({
      goals: [
        { goalId: 'g1', goalName: 'EF', currentAmount: 1000, targetAmount: 5000, monthlyContribution: 100, targetDate: null, projectedCompletionDate: null, onTrack: true, projectedBalance: 5000, milestones: [] },
      ],
      totalCurrentSaved: 1000, totalTargetSaved: 5000, totalProjectedSaved: 5000,
      overallCompletionPercent: 20, projectedCompletionDate: null,
    });

    runCoachScenario(snapshot, { type: 'savings', extraAmount: 50 });
    expect(JSON.stringify(snapshot)).toBe(original);
    expect(rawSavings[0]!.monthlyContribution).toBe(100);
  });
});

describe('comparison scenario (income / expense)', () => {
  beforeEach(() => {
    mocked.runScenario.mockReset();
    mocked.getMortgageForecast.mockReset();
    mocked.getSavingsForecast.mockReset();
  });

  it('runs an income increase through the comparison engine', () => {
    const snapshot = makeSnapshot({
      dashboard: {
        ...snapshotDashboard(),
        cashFlow: { monthlyIncome: 5000, monthlyExpenses: 3500, cashFlow: 1500, income: 5000, expenses: 3500 },
        savingsRate: 30,
      },
    });

    mocked.runScenario.mockReturnValue({
      baseline: { label: 'Baseline', projections: [], finalNetWorth: 100, finalDebt: 50, finalSavings: 50 },
      scenario: { label: 'Scenario', projections: [], finalNetWorth: 150, finalDebt: 40, finalSavings: 80 },
      delta: { netWorth: 50, debt: -10, savings: 30, cashFlowPerMonth: 300 },
      recommendation: 'Keep the raise.',
    });

    const result = runCoachScenario(snapshot, { type: 'income', increaseAmount: 300 });

    expect(result?.comparison).toBeDefined();
    expect(result?.comparison?.delta.cashFlowPerMonth).toBe(300);
    expect(mocked.runScenario).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      5000,
      3500,
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ incomeMultiplier: expect.any(Number) }),
    );
  });
});

function snapshotDashboard() {
  const s = makeSnapshot();
  return s.dashboard;
}
