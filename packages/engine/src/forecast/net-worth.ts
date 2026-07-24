import type {
  NetWorthForecastPoint,
  NetWorthForecastResult,
  ForecastMilestone,
} from '@budgetos/shared';
import { addMonths } from '../shared/date';

export interface NetWorthForecastInput {
  currentNetWorth: number;
  currentAssets: number;
  currentLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  expectedReturnRate: number;
  debtPaymentMonthly: number;
  monthlySavingsAmount: number;
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

export function computeNetWorthForecast(
  input: NetWorthForecastInput,
  periods: Array<{ label: string; months: number }> = FORECAST_PERIODS,
): NetWorthForecastResult {
  const points: NetWorthForecastPoint[] = [];
  const startDate = new Date().toISOString().slice(0, 10);

  let netWorth = input.currentNetWorth;
  let assets = input.currentAssets;
  let liabilities = input.currentLiabilities;

  const totalMonths = periods.reduce((sum, p) => sum + p.months, 0);
  let cumulativeMonths = 0;

  const monthlyReturn = input.expectedReturnRate / 12;
  const monthlySavings = input.monthlySavingsAmount;

  for (const period of periods) {
    let periodGrowth = 0;

    for (let m = 0; m < period.months; m++) {
      cumulativeMonths++;
      const cashFlow = input.monthlyIncome - input.monthlyExpenses;
      const debtPaymentActual = Math.min(input.debtPaymentMonthly, liabilities);
      const investmentGrowth = assets * monthlyReturn;

      assets += monthlySavings + investmentGrowth;
      liabilities = Math.max(0, liabilities - debtPaymentActual);
      netWorth = assets - liabilities;

      const monthlyGrowth = cashFlow - debtPaymentActual + investmentGrowth + monthlySavings;
      periodGrowth += monthlyGrowth;
    }

    const annualizedRate = cumulativeMonths >= 12
      ? ((netWorth / input.currentNetWorth) - 1) / (cumulativeMonths / 12) * 100
      : 0;

    points.push({
      date: addMonths(startDate, cumulativeMonths - 1),
      netWorth: Math.round(netWorth * 100) / 100,
      assets: Math.round(assets * 100) / 100,
      liabilities: Math.round(liabilities * 100) / 100,
      monthlyGrowth: Math.round((periodGrowth / period.months) * 100) / 100,
      annualizedGrowthRate: Math.round(annualizedRate * 100) / 100,
    });
  }

  const totalGrowth = netWorth - input.currentNetWorth;
  const totalGrowthPercent = input.currentNetWorth !== 0
    ? ((netWorth / input.currentNetWorth) - 1) * 100
    : 0;
  const monthlyAverageGrowth = totalMonths > 0 ? totalGrowth / totalMonths : 0;
  const annualizedGrowthRate = totalMonths >= 12
    ? ((netWorth / input.currentNetWorth) - 1) / (totalMonths / 12) * 100
    : 0;

  const milestones: ForecastMilestone[] = [];

  // Debt-free milestone
  const monthsToDebtFree = input.debtPaymentMonthly > 0
    ? Math.ceil(input.currentLiabilities / input.debtPaymentMonthly)
    : null;
  if (monthsToDebtFree !== null && monthsToDebtFree < totalMonths) {
    milestones.push({
      date: addMonths(startDate, monthsToDebtFree),
      type: 'debt_free',
      label: 'Debt-Free',
      value: 0,
      projectedDate: addMonths(startDate, monthsToDebtFree),
    });
  }

  return {
    points,
    totalGrowth: Math.round(totalGrowth * 100) / 100,
    totalGrowthPercent: Math.round(totalGrowthPercent * 100) / 100,
    monthlyAverageGrowth: Math.round(monthlyAverageGrowth * 100) / 100,
    annualizedGrowthRate: Math.round(annualizedGrowthRate * 100) / 100,
    milestones,
  };
}
