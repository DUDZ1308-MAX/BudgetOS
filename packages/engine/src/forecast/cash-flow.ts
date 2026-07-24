import type {
  CashFlowForecastPoint,
  CashFlowForecastResult,
  RecurringFrequency,
} from '@budgetos/shared';
import { addMonths } from '../shared/date';
import { toMonthlyEquivalent } from '../shared/frequency';

export interface CashFlowForecastInput {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDebtPayments: number;
  monthlyMortgagePayment: number;
  monthlySavingsContributions: number;
  recurrings: Array<{ amount: number; frequency: RecurringFrequency; type: string }>;
}

const FORECAST_PERIODS: Array<{ label: string; months: number }> = [
  { label: '30d', months: 1 },
  { label: '90d', months: 3 },
  { label: '6mo', months: 6 },
  { label: '1yr', months: 12 },
  { label: '2yr', months: 24 },
  { label: '5yr', months: 60 },
  { label: '10yr', months: 120 },
];

export function computeCashFlowForecast(
  input: CashFlowForecastInput,
  periods: Array<{ label: string; months: number }> = FORECAST_PERIODS,
): CashFlowForecastResult {
  const allPoints: CashFlowForecastPoint[] = [];
  let runningBalance = input.currentBalance;
  const startDate = new Date().toISOString().slice(0, 10);

  let projectedMin = runningBalance;
  let projectedMax = runningBalance;

  for (const period of periods) {
    let periodIncome = 0;
    let periodExpenses = 0;
    let periodDebt = 0;
    let periodMortgage = 0;
    let periodSavings = 0;

    for (let m = 0; m < period.months; m++) {
      const monthIncome = input.monthlyIncome;
      const monthExpenses = input.monthlyExpenses;
      const monthDebt = input.monthlyDebtPayments;
      const monthMortgage = input.monthlyMortgagePayment;
      const monthSavings = input.monthlySavingsContributions;

      const recurringExtra = computeRecurringMonthly(input.recurrings);
      const totalMonthIncome = monthIncome + recurringExtra.income;
      const totalMonthExpenses = monthExpenses + recurringExtra.expenses;

      const netChange = totalMonthIncome - totalMonthExpenses - monthDebt - monthMortgage - monthSavings;

      periodIncome += totalMonthIncome;
      periodExpenses += totalMonthExpenses;
      periodDebt += monthDebt;
      periodMortgage += monthMortgage;
      periodSavings += monthSavings;

      runningBalance += netChange;
      if (runningBalance < projectedMin) projectedMin = runningBalance;
      if (runningBalance > projectedMax) projectedMax = runningBalance;
    }

    allPoints.push({
      date: addMonths(startDate, period.months - 1),
      balance: Math.round(runningBalance * 100) / 100,
      netChange: Math.round((periodIncome - periodExpenses - periodDebt - periodMortgage - periodSavings) * 100) / 100,
      income: Math.round(periodIncome * 100) / 100,
      expenses: Math.round(periodExpenses * 100) / 100,
      debtPayments: Math.round(periodDebt * 100) / 100,
      mortgagePayment: Math.round(periodMortgage * 100) / 100,
      savingsContribution: Math.round(periodSavings * 100) / 100,
    });
  }

  return {
    periods: allPoints,
    projectedMinimumBalance: Math.round(projectedMin * 100) / 100,
    projectedMaximumBalance: Math.round(projectedMax * 100) / 100,
    startingBalance: Math.round(input.currentBalance * 100) / 100,
    endingBalance: Math.round(runningBalance * 100) / 100,
  };
}

function computeRecurringMonthly(recurrings: Array<{ amount: number; frequency: RecurringFrequency; type: string }>): { income: number; expenses: number } {
  let income = 0;
  let expenses = 0;
  for (const r of recurrings) {
    const monthly = toMonthlyEquivalent(r.amount, r.frequency);
    if (r.type === 'income') income += monthly;
    else expenses += monthly;
  }
  return { income, expenses };
}
