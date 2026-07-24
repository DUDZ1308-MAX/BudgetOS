import type {
  ScenarioAdjustment,
  BaselineProjectionPoint,
  ScenarioComparisonResult,
} from '@budgetos/shared';
import { addMonths } from '../shared/date';

export interface ScenarioInput {
  currentNetWorth: number;
  currentSavings: number;
  currentDebt: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  emergencyFundBalance: number;
  debtPaymentMonthly: number;
  mortgagePaymentMonthly: number;
  expectedReturnRate: number;
}

const PROJECTION_MONTHS = [1, 3, 6, 12, 24, 60, 120];

function computeProjection(
  input: ScenarioInput,
  adjustments: ScenarioAdjustment,
): BaselineProjectionPoint[] {
  const startDate = new Date().toISOString().slice(0, 10);

  const incomeMultiplier = adjustments.incomeMultiplier ?? 1;
  const expenseMultiplier = adjustments.expenseMultiplier ?? 1;
  const savingsRateOverride = adjustments.savingsRateOverride;
  const extraMortgagePayment = adjustments.extraMortgagePayment ?? 0;
  const extraDebtPayment = adjustments.extraDebtPaymentAmount ?? 0;
  const unexpectedOnce = adjustments.unexpectedExpenseOnce ?? 0;
  const unexpectedMonthly = adjustments.unexpectedExpenseMonthly ?? 0;
  const missedMonths = adjustments.missedPaycheckMonths ?? 0;
  const rateChangeBps = adjustments.interestRateChangeBps ?? 0;

  let netWorth = input.currentNetWorth;
  let savings = input.currentSavings;
  let debt = input.currentDebt;
  let balance = input.emergencyFundBalance;
  const monthlyReturn = (input.expectedReturnRate + rateChangeBps / 10000) / 12;

  const effectiveIncome = input.monthlyIncome * incomeMultiplier;
  const effectiveExpenses = input.monthlyExpenses * expenseMultiplier;
  const savingsRate = savingsRateOverride ?? input.savingsRate;
  const monthlySavingsAmount = effectiveIncome * savingsRate;
  const monthlyDebtPayment = input.debtPaymentMonthly + extraDebtPayment;
  const monthlyMortgagePayment = input.mortgagePaymentMonthly + extraMortgagePayment;

  const points: BaselineProjectionPoint[] = [];

  for (const months of PROJECTION_MONTHS) {
    for (let m = 0; m < months; m++) {
      const isMissedMonth = m < missedMonths;
      const monthIncome = isMissedMonth ? 0 : effectiveIncome;
      const monthExpenses = m === 0 ? effectiveExpenses + unexpectedOnce : effectiveExpenses;
      const monthExpensesWithUnexpected = monthExpenses + unexpectedMonthly;
      const monthCashFlow = monthIncome - monthExpensesWithUnexpected;

      savings += monthlySavingsAmount;
      savings += savings * monthlyReturn;
      debt = Math.max(0, debt - monthlyDebtPayment);
      balance += monthCashFlow - monthlySavingsAmount - monthlyDebtPayment - monthlyMortgagePayment;
    }

    netWorth = savings - debt + balance;
    points.push({
      date: addMonths(startDate, months - 1),
      netWorth: Math.round(netWorth * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      debt: Math.round(debt * 100) / 100,
      cashFlow: Math.round((effectiveIncome - effectiveExpenses) * 100) / 100,
    });
  }

  return points;
}

export function computeScenarioComparison(
  input: ScenarioInput,
  scenarioAdjustment: ScenarioAdjustment,
): ScenarioComparisonResult {
  const baselinePoints = computeProjection(input, { label: 'Baseline' });
  const scenarioPoints = computeProjection(input, scenarioAdjustment);

  const baselineFinal = baselinePoints[baselinePoints.length - 1]!;
  const scenarioFinal = scenarioPoints[scenarioPoints.length - 1]!;

  const deltaNetWorth = scenarioFinal.netWorth - baselineFinal.netWorth;
  const deltaDebt = scenarioFinal.debt - baselineFinal.debt;
  const deltaSavings = scenarioFinal.savings - baselineFinal.savings;
  const deltaCashFlowPerMonth = (scenarioPoints[0]?.cashFlow ?? 0) - (baselinePoints[0]?.cashFlow ?? 0);

  const recommendation = deltaNetWorth > 0
    ? `This scenario improves your net worth by ${formatCurrency(deltaNetWorth)} over ${PROJECTION_MONTHS[PROJECTION_MONTHS.length - 1]} months.`
    : deltaNetWorth < 0
      ? `This scenario reduces your net worth by ${formatCurrency(Math.abs(deltaNetWorth))} over the projection period.`
      : 'This scenario has minimal impact on your net worth.';

  return {
    baseline: {
      label: 'Current Path',
      projections: baselinePoints,
      finalNetWorth: baselineFinal.netWorth,
      finalDebt: baselineFinal.debt,
      finalSavings: baselineFinal.savings,
    },
    scenario: {
      label: scenarioAdjustment.label,
      projections: scenarioPoints,
      finalNetWorth: scenarioFinal.netWorth,
      finalDebt: scenarioFinal.debt,
      finalSavings: scenarioFinal.savings,
    },
    delta: {
      netWorth: Math.round(deltaNetWorth * 100) / 100,
      debt: Math.round(deltaDebt * 100) / 100,
      savings: Math.round(deltaSavings * 100) / 100,
      cashFlowPerMonth: Math.round(deltaCashFlowPerMonth * 100) / 100,
    },
    recommendation,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
