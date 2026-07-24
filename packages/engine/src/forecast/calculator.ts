import type {
  CashFlowForecastResult,
  NetWorthForecastResult,
  DebtForecastResult,
  SavingsForecastResult,
  MortgageForecastResult,
  ScenarioComparisonResult,
  ForecastMilestone,
} from '@budgetos/shared';
import { computeCashFlowForecast } from './cash-flow';
import type { CashFlowForecastInput } from './cash-flow';
import { computeNetWorthForecast } from './net-worth';
import type { NetWorthForecastInput } from './net-worth';
import { computeDebtForecast } from './debt';
import type { DebtForecastInput } from '@budgetos/shared';
import { computeSavingsForecast } from './savings';
import type { SavingsForecastInput } from './savings';
import { computeMortgageForecast } from './mortgage';
import type { MortgageForecastInput } from './mortgage';
import { computeScenarioComparison } from './scenarios';
import type { ScenarioInput } from './scenarios';
import type { ScenarioAdjustment } from '@budgetos/shared';

export interface FullForecastInput {
  cashFlow: CashFlowForecastInput;
  netWorth: NetWorthForecastInput;
  debts: DebtForecastInput[];
  savings: SavingsForecastInput;
  mortgages: MortgageForecastInput[];
  scenarioAdjustments?: ScenarioAdjustment[];
}

export function computeFullForecast(input: FullForecastInput): {
  cashFlow: CashFlowForecastResult;
  netWorth: NetWorthForecastResult;
  debt: DebtForecastResult;
  savings: SavingsForecastResult;
  mortgages: MortgageForecastResult[];
  scenarios: ScenarioComparisonResult[];
  milestones: ForecastMilestone[];
} {
  const cashFlow = computeCashFlowForecast(input.cashFlow);
  const netWorth = computeNetWorthForecast(input.netWorth);
  const debt = computeDebtForecast(input.debts);
  const savings = computeSavingsForecast(input.savings);
  const mortgages = input.mortgages
    .map((m) => computeMortgageForecast(m))
    .filter((m): m is MortgageForecastResult => m !== null);

  const scenarios = (input.scenarioAdjustments ?? []).map((adj) => {
    const scenarioInput: ScenarioInput = {
      currentNetWorth: input.netWorth.currentNetWorth,
      currentSavings: input.netWorth.currentAssets,
      currentDebt: input.netWorth.currentLiabilities,
      monthlyIncome: input.netWorth.monthlyIncome,
      monthlyExpenses: input.netWorth.monthlyExpenses,
      savingsRate: input.netWorth.savingsRate,
      emergencyFundBalance: input.cashFlow.currentBalance,
      debtPaymentMonthly: input.netWorth.debtPaymentMonthly,
      mortgagePaymentMonthly: input.cashFlow.monthlyMortgagePayment,
      expectedReturnRate: input.netWorth.expectedReturnRate,
    };
    return computeScenarioComparison(scenarioInput, adj);
  });

  const milestones: ForecastMilestone[] = [];
  const startDate = new Date().toISOString().slice(0, 10);

  milestones.push(...netWorth.milestones);

  for (const m of mortgages) {
    if (m.payoffDate) {
      milestones.push({
        date: startDate,
        type: 'mortgage_payoff',
        label: `${m.name} Payoff`,
        value: m.originalPrincipal,
        projectedDate: m.payoffDate,
      });
    }
  }

  if (debt.debtFreeDate) {
    milestones.push({
      date: startDate,
      type: 'debt_free',
      label: 'Debt-Free',
      value: debt.inputs.reduce((s, d) => s + d.balance, 0),
      projectedDate: debt.debtFreeDate,
    });
  }

  for (const g of savings.goals) {
    if (g.projectedCompletionDate) {
      milestones.push({
        date: startDate,
        type: 'savings_goal',
        label: `${g.goalName} Complete`,
        value: g.targetAmount,
        projectedDate: g.projectedCompletionDate,
      });
    }
  }

  milestones.sort((a, b) => {
    if (!a.projectedDate) return 1;
    if (!b.projectedDate) return -1;
    return a.projectedDate.localeCompare(b.projectedDate);
  });

  return { cashFlow, netWorth, debt, savings, mortgages, scenarios, milestones };
}
