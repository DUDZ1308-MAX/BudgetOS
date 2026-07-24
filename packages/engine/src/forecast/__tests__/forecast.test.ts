import { describe, it, expect } from 'vitest';
import { computeCashFlowForecast } from '../cash-flow';
import { computeNetWorthForecast } from '../net-worth';
import { computeDebtForecast } from '../debt';
import { computeSavingsForecast } from '../savings';
import { computeMortgageForecast } from '../mortgage';
import { computeScenarioComparison } from '../scenarios';
import type { CashFlowForecastInput } from '../cash-flow';
import type { DebtForecastInput } from '@budgetos/shared';

describe('CashFlowForecast', () => {
  it('projects cash balance over 30 days with positive cash flow', () => {
    const input: CashFlowForecastInput = {
      currentBalance: 5000,
      monthlyIncome: 6000,
      monthlyExpenses: 4000,
      monthlyDebtPayments: 500,
      monthlyMortgagePayment: 1500,
      monthlySavingsContributions: 500,
      recurrings: [],
    };

    const result = computeCashFlowForecast(input, [{ label: '30d', months: 1 }]);

    expect(result.periods).toHaveLength(1);
    expect(result.startingBalance).toBe(5000);
    expect(result.endingBalance).toBeLessThan(5000);
  });

  it('projects negative ending balance with deficit cash flow', () => {
    const input: CashFlowForecastInput = {
      currentBalance: 1000,
      monthlyIncome: 3000,
      monthlyExpenses: 3500,
      monthlyDebtPayments: 200,
      monthlyMortgagePayment: 1000,
      monthlySavingsContributions: 0,
      recurrings: [],
    };

    const result = computeCashFlowForecast(input, [{ label: '30d', months: 1 }]);

    expect(result.endingBalance).toBeLessThan(0);
    expect(result.projectedMinimumBalance).toBeLessThan(0);
  });

  it('handles zero balance input', () => {
    const input: CashFlowForecastInput = {
      currentBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyDebtPayments: 0,
      monthlyMortgagePayment: 0,
      monthlySavingsContributions: 0,
      recurrings: [],
    };

    const result = computeCashFlowForecast(input, [{ label: '30d', months: 1 }]);

    expect(result.endingBalance).toBe(0);
  });

  it('projects multiple periods correctly', () => {
    const input: CashFlowForecastInput = {
      currentBalance: 10000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      monthlyDebtPayments: 0,
      monthlyMortgagePayment: 0,
      monthlySavingsContributions: 0,
      recurrings: [],
    };

    const result = computeCashFlowForecast(input, [
      { label: '30d', months: 1 },
      { label: '90d', months: 3 },
    ]);

    expect(result.periods).toHaveLength(2);
    expect(result.periods[1]!.balance).toBeGreaterThan(result.periods[0]!.balance);
  });

  it('includes recurring transactions in projection', () => {
    const input: CashFlowForecastInput = {
      currentBalance: 5000,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyDebtPayments: 0,
      monthlyMortgagePayment: 0,
      monthlySavingsContributions: 0,
      recurrings: [
        { amount: 500, frequency: 'biweekly' as const, type: 'income' },
        { amount: 200, frequency: 'monthly' as const, type: 'expense' },
      ],
    };

    const result = computeCashFlowForecast(input, [{ label: '30d', months: 1 }]);

    expect(result.endingBalance).toBeGreaterThan(5000);
  });
});

describe('NetWorthForecast', () => {
  it('projects net worth growth over 12 months with positive savings', () => {
    const result = computeNetWorthForecast({
      currentNetWorth: 50000,
      currentAssets: 80000,
      currentLiabilities: 30000,
      monthlyIncome: 6000,
      monthlyExpenses: 4000,
      savingsRate: 0.2,
      expectedReturnRate: 0.07,
      debtPaymentMonthly: 500,
      monthlySavingsAmount: 1200,
    }, [{ label: '1yr', months: 12 }]);

    expect(result.points).toHaveLength(1);
    expect(result.points[0]!.netWorth).toBeGreaterThan(50000);
    expect(result.totalGrowth).toBeGreaterThan(0);
  });

  it('projects net worth decline with negative cash flow', () => {
    const result = computeNetWorthForecast({
      currentNetWorth: 50000,
      currentAssets: 80000,
      currentLiabilities: 30000,
      monthlyIncome: 4000,
      monthlyExpenses: 6000,
      savingsRate: 0,
      expectedReturnRate: 0,
      debtPaymentMonthly: 500,
      monthlySavingsAmount: -2000,
    }, [{ label: '1yr', months: 12 }]);

    expect(result.points[0]!.netWorth).toBeLessThan(50000);
  });

  it('generates debt-free milestone when liabilities can be paid off', () => {
    const result = computeNetWorthForecast({
      currentNetWorth: 10000,
      currentAssets: 50000,
      currentLiabilities: 40000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      savingsRate: 0.2,
      expectedReturnRate: 0,
      debtPaymentMonthly: 5000,
      monthlySavingsAmount: 1000,
    }, [{ label: '1yr', months: 12 }]);

    expect(result.milestones.length).toBeGreaterThanOrEqual(1);
    expect(result.milestones[0]!.type).toBe('debt_free');
  });

  it('handles zero net worth', () => {
    const result = computeNetWorthForecast({
      currentNetWorth: 0,
      currentAssets: 0,
      currentLiabilities: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      savingsRate: 0,
      expectedReturnRate: 0,
      debtPaymentMonthly: 0,
      monthlySavingsAmount: 0,
    }, [{ label: '30d', months: 1 }]);

    expect(result.points[0]!.netWorth).toBe(0);
  });
});

describe('DebtForecast', () => {
  const sampleDebts: DebtForecastInput[] = [
    { id: '1', name: 'Credit Card', type: 'credit_card', balance: 5000, apr: 19.99, minimumPayment: 150, actualPayment: 300 },
    { id: '2', name: 'Car Loan', type: 'loan', balance: 15000, apr: 6.5, minimumPayment: 400, actualPayment: 400 },
  ];

  it('computes minimum vs accelerated payoff scenarios', () => {
    const result = computeDebtForecast(sampleDebts, 60);

    expect(result.scenarios.minimum.points.length).toBeGreaterThan(0);
    expect(result.scenarios.accelerated.points.length).toBeGreaterThan(0);
  });

  it('accelerated scenario pays off faster than minimum', () => {
    const result = computeDebtForecast(sampleDebts, 120);

    expect(result.scenarios.accelerated.monthsToPayoff).toBeLessThanOrEqual(result.scenarios.minimum.monthsToPayoff);
  });

  it('accelerated scenario saves interest', () => {
    const result = computeDebtForecast(sampleDebts, 120);

    expect(result.interestSaved).toBeGreaterThanOrEqual(0);
  });

  it('handles single debt', () => {
    const result = computeDebtForecast([
      { id: '1', name: 'Single Loan', type: 'loan', balance: 10000, apr: 8, minimumPayment: 200, actualPayment: 200 },
    ], 60);

    expect(result.scenarios.minimum.points.length).toBeGreaterThan(0);
    expect(result.debtFreeDate).not.toBeNull();
  });

  it('handles zero balance debts', () => {
    const result = computeDebtForecast([
      { id: '1', name: 'Paid Off', type: 'credit_card', balance: 0, apr: 0, minimumPayment: 0, actualPayment: 0 },
    ], 60);

    expect(result.debtFreeDate).not.toBeNull();
    expect(result.scenarios.minimum.totalInterest).toBe(0);
  });

  it('handles empty debts array', () => {
    const result = computeDebtForecast([], 60);

    expect(result.debtFreeDate).not.toBeNull();
  });

  it('high APR debt has more total interest', () => {
    const lowApr: DebtForecastInput[] = [
      { id: '1', name: 'Low APR', type: 'loan', balance: 10000, apr: 3, minimumPayment: 200, actualPayment: 200 },
    ];
    const highApr: DebtForecastInput[] = [
      { id: '1', name: 'High APR', type: 'credit_card', balance: 10000, apr: 24, minimumPayment: 200, actualPayment: 200 },
    ];

    const lowResult = computeDebtForecast(lowApr, 60);
    const highResult = computeDebtForecast(highApr, 60);

    expect(highResult.scenarios.minimum.totalInterest).toBeGreaterThan(lowResult.scenarios.minimum.totalInterest);
  });
});

describe('SavingsForecast', () => {
  it('projects single goal completion', () => {
    const result = computeSavingsForecast({
      goals: [
        { id: '1', name: 'Emergency Fund', currentAmount: 5000, targetAmount: 10000, monthlyContribution: 500, targetDate: null },
      ],
      expectedReturnRate: 0.05,
    }, 24);

    expect(result.goals).toHaveLength(1);
    expect(result.goals[0]!.projectedBalance).toBeGreaterThanOrEqual(10000);
  });

  it('generates milestones at 25/50/75/100%', () => {
    const result = computeSavingsForecast({
      goals: [
        { id: '1', name: 'Goal', currentAmount: 0, targetAmount: 12000, monthlyContribution: 1000, targetDate: null },
      ],
      expectedReturnRate: 0,
    }, 24);

    expect(result.goals[0]!.milestones.length).toBeGreaterThanOrEqual(4);
  });

  it('handles multiple goals simultaneously', () => {
    const result = computeSavingsForecast({
      goals: [
        { id: '1', name: 'Goal 1', currentAmount: 1000, targetAmount: 5000, monthlyContribution: 200, targetDate: null },
        { id: '2', name: 'Goal 2', currentAmount: 500, targetAmount: 10000, monthlyContribution: 500, targetDate: null },
      ],
      expectedReturnRate: 0,
    }, 36);

    expect(result.goals).toHaveLength(2);
    expect(result.totalCurrentSaved).toBe(1500);
  });

  it('handles already-completed goals', () => {
    const result = computeSavingsForecast({
      goals: [
        { id: '1', name: 'Done', currentAmount: 5000, targetAmount: 5000, monthlyContribution: 0, targetDate: null },
      ],
      expectedReturnRate: 0,
    }, 12);

    expect(result.goals[0]!.projectedBalance).toBeGreaterThanOrEqual(5000);
  });

  it('handles goals with target date constraint', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    const dateStr = futureDate.toISOString().slice(0, 10);

    const result = computeSavingsForecast({
      goals: [
        { id: '1', name: 'Timed Goal', currentAmount: 1000, targetAmount: 5000, monthlyContribution: 500, targetDate: dateStr },
      ],
      expectedReturnRate: 0,
    }, 12);

    expect(result.goals[0]!.targetDate).toBe(dateStr);
  });

  it('handles zero target amount goals', () => {
    const result = computeSavingsForecast({
      goals: [
        { id: '1', name: 'No Target', currentAmount: 1000, targetAmount: 0, monthlyContribution: 100, targetDate: null },
      ],
      expectedReturnRate: 0,
    }, 12);

    expect(result.goals[0]!.projectedBalance).toBeGreaterThanOrEqual(1000);
  });
});

describe('MortgageForecast', () => {
  it('projects amortization schedule beyond elapsed months', () => {
    const result = computeMortgageForecast({
      id: '1',
      name: 'Test Mortgage',
      principal: 300000,
      annualRate: 5.5,
      termYears: 30,
      startDate: '2024-01-01',
      monthsElapsed: 12,
    });

    expect(result).not.toBeNull();
    expect(result!.points.length).toBeGreaterThan(0);
    expect(result!.payoffMonths).toBeGreaterThan(12);
    expect(result!.monthlyPayment).toBeGreaterThan(0);
  });

  it('includes extra payment impact on interest saved', () => {
    const noExtra = computeMortgageForecast({
      id: '1', name: 'Test', principal: 300000, annualRate: 5.5, termYears: 30,
      startDate: '2024-01-01',
      extraPayments: [],
    });

    const withExtra = computeMortgageForecast({
      id: '1', name: 'Test', principal: 300000, annualRate: 5.5, termYears: 30,
      startDate: '2024-01-01',
      extraPayments: [{ amount: 500, type: 'monthly_fixed' }],
    });

    expect(noExtra).not.toBeNull();
    expect(withExtra).not.toBeNull();
    expect(withExtra!.interestSaved).toBeGreaterThan(0);
    expect(withExtra!.payoffMonths).toBeLessThanOrEqual(noExtra!.payoffMonths);
  });

  it('returns null for invalid input', () => {
    const result = computeMortgageForecast({
      id: '1', name: 'Bad', principal: -1, annualRate: 5, termYears: 30,
      startDate: '2024-01-01',
    });

    expect(result).toBeNull();
  });
});

describe('ScenarioComparison', () => {
  const baseInput = {
    currentNetWorth: 50000,
    currentSavings: 20000,
    currentDebt: 15000,
    monthlyIncome: 6000,
    monthlyExpenses: 4000,
    savingsRate: 0.2,
    emergencyFundBalance: 10000,
    debtPaymentMonthly: 500,
    mortgagePaymentMonthly: 1200,
    expectedReturnRate: 0.07,
  };

  it('compares baseline vs increased income scenario', () => {
    const result = computeScenarioComparison(baseInput, {
      label: '10% Income Increase',
      incomeMultiplier: 1.1,
    });

    expect(result.scenario.finalNetWorth).toBeGreaterThan(result.baseline.finalNetWorth);
    expect(result.delta.netWorth).toBeGreaterThan(0);
    expect(result.recommendation).toContain('improves');
  });

  it('compares baseline vs reduced expenses scenario', () => {
    const result = computeScenarioComparison(baseInput, {
      label: '15% Expense Reduction',
      expenseMultiplier: 0.85,
    });

    expect(result.scenario.finalNetWorth).toBeGreaterThan(result.baseline.finalNetWorth);
  });

  it('compares baseline vs unexpected expense scenario', () => {
    const result = computeScenarioComparison(baseInput, {
      label: 'Unexpected $5k Expense',
      unexpectedExpenseOnce: 5000,
    });

    expect(result.delta.netWorth).toBeLessThan(0);
    expect(result.recommendation).toContain('reduces');
  });

  it('compares baseline vs missed paychecks', () => {
    const result = computeScenarioComparison(baseInput, {
      label: 'Missed 2 Paychecks',
      missedPaycheckMonths: 2,
    });

    expect(result.scenario.finalNetWorth).toBeLessThan(result.baseline.finalNetWorth);
  });

  it('compares baseline vs extra debt payment scenario', () => {
    const result = computeScenarioComparison(baseInput, {
      label: 'Extra $500/mo Debt Payment',
      extraDebtPaymentAmount: 500,
    });

    expect(result.scenario.finalNetWorth).not.toBe(0);
  });

  it('compares baseline vs extra mortgage payment', () => {
    const result = computeScenarioComparison(baseInput, {
      label: 'Extra $200/mo Mortgage',
      extraMortgagePayment: 200,
    });

    expect(result.scenario.finalDebt).toBeLessThanOrEqual(result.baseline.finalDebt);
  });

  it('compares baseline vs savings rate increase', () => {
    const result = computeScenarioComparison(baseInput, {
      label: '30% Savings Rate',
      savingsRateOverride: 0.30,
    });

    expect(result.scenario.finalNetWorth).toBeGreaterThanOrEqual(result.baseline.finalNetWorth);
  });

  it('provides minimal impact recommendation for small change', () => {
    const result = computeScenarioComparison(baseInput, {
      label: 'Minimal Change',
      incomeMultiplier: 1.001,
    });

    expect(result.delta.netWorth).not.toBe(0);
  });

  it('handles combined scenario adjustments', () => {
    const result = computeScenarioComparison(baseInput, {
      label: 'Combined: Raise + Cut Expenses',
      incomeMultiplier: 1.2,
      expenseMultiplier: 0.8,
      extraDebtPaymentAmount: 300,
      savingsRateOverride: 0.25,
    });

    expect(result.delta.netWorth).toBeGreaterThan(0);
  });
});

describe('Forecast Edge Cases', () => {
  it('handles leap year dates gracefully', () => {
    const input: CashFlowForecastInput = {
      currentBalance: 1000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      monthlyDebtPayments: 0,
      monthlyMortgagePayment: 0,
      monthlySavingsContributions: 0,
      recurrings: [],
    };

    // This should not throw
    expect(() => computeCashFlowForecast(input, [{ label: '6mo', months: 6 }])).not.toThrow();
  });

  it('handles large datasets without performance issues', () => {
    const debts: DebtForecastInput[] = Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`,
      name: `Debt ${i}`,
      type: (i % 2 === 0 ? 'credit_card' : 'loan') as 'credit_card' | 'loan',
      balance: Math.random() * 50000,
      apr: 5 + Math.random() * 25,
      minimumPayment: 50 + Math.random() * 500,
      actualPayment: 100 + Math.random() * 1000,
    }));

    const result = computeDebtForecast(debts, 360);

    expect(result.scenarios.minimum.points.length).toBeGreaterThan(0);
    expect(result.scenarios.accelerated.points.length).toBeGreaterThan(0);
  });

  it('handles very high interest rates', () => {
    const result = computeDebtForecast([
      { id: '1', name: 'Predatory', type: 'credit_card', balance: 10000, apr: 36, minimumPayment: 300, actualPayment: 300 },
    ], 120);

    expect(result.scenarios.minimum.totalInterest).toBeGreaterThan(0);
  });

  it('handles zero interest debts', () => {
    const result = computeDebtForecast([
      { id: '1', name: '0% APR', type: 'loan', balance: 10000, apr: 0, minimumPayment: 200, actualPayment: 200 },
    ], 60);

    expect(result.scenarios.minimum.totalInterest).toBe(0);
  });

  it('month-end date handling does not break projections', () => {
    expect(() => computeNetWorthForecast({
      currentNetWorth: 10000,
      currentAssets: 15000,
      currentLiabilities: 5000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      savingsRate: 0.2,
      expectedReturnRate: 0.07,
      debtPaymentMonthly: 500,
      monthlySavingsAmount: 1000,
    }, [
      { label: '30d', months: 1 },
      { label: '90d', months: 3 },
      { label: '6mo', months: 6 },
      { label: '1yr', months: 12 },
    ])).not.toThrow();
  });
});
