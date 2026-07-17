import type { AiContext, FinancialForecast, ForecastPoint } from '@/ai/types';
import type { MortgageResult } from '@/engine/MortgageEngine';

let forecastCounter = 0;
function nextId(): string {
  forecastCounter++;
  return `fc-${forecastCounter}`;
}

export function generateForecasts(context: AiContext, months: number = 6): FinancialForecast[] {
  const forecasts: FinancialForecast[] = [];

  const spendingForecast = generateSpendingForecast(context, months);
  if (spendingForecast) forecasts.push(spendingForecast);

  const cashflowForecast = generateCashFlowForecast(context, months);
  if (cashflowForecast) forecasts.push(cashflowForecast);

  const savingsForecast = generateSavingsForecast(context, months);
  if (savingsForecast) forecasts.push(savingsForecast);

  const mortgageForecast = generateMortgageForecast(context, months);
  if (mortgageForecast) forecasts.push(mortgageForecast);

  return forecasts;
}

function generateSpendingForecast(context: AiContext, months: number): FinancialForecast | null {
  const { cashFlowSummary } = context;
  if (cashFlowSummary.totalExpenses <= 0) return null;

  const monthlySpending = cashFlowSummary.totalExpenses;
  const points: ForecastPoint[] = [];
  const now = new Date();

  for (let i = 1; i <= months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    points.push({ month: label, value: Math.round(monthlySpending * 100) / 100 });
  }

  const projected = points[points.length - 1]?.value ?? monthlySpending;
  const trend: 'up' | 'down' | 'stable' = projected > monthlySpending ? 'up' : projected < monthlySpending ? 'down' : 'stable';

  return {
    type: 'spending',
    title: 'Projected Monthly Spending',
    current: monthlySpending,
    projected,
    trend,
    confidence: 65,
    months: points,
    description: `Based on current spending patterns, monthly expenses are projected at $${projected.toFixed(2)}.`,
  };
}

function generateCashFlowForecast(context: AiContext, months: number): FinancialForecast | null {
  const { cashFlowSummary, budgetSummary } = context;
  const monthlyIncome = cashFlowSummary.totalIncome;
  const monthlyExpenses = cashFlowSummary.totalExpenses;
  const netMonthly = monthlyIncome - monthlyExpenses;

  const points: ForecastPoint[] = [];
  const now = new Date();
  let balance = budgetSummary.accounts.netWorth;

  for (let i = 1; i <= months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    balance += netMonthly;
    points.push({ month: label, value: Math.round(balance * 100) / 100 });
  }

  const projected = points[points.length - 1]?.value ?? balance;
  const current = budgetSummary.accounts.netWorth;
  const trend: 'up' | 'down' | 'stable' = projected > current ? 'up' : projected < current ? 'down' : 'stable';

  return {
    type: 'cashflow',
    title: 'Cash Flow Projection',
    current,
    projected,
    trend,
    confidence: 60,
    months: points,
    description: `Projected net worth of $${projected.toFixed(2)} in ${months} months${netMonthly >= 0 ? '' : ' — negative cash flow is depleting balance.'}`,
  };
}

function generateSavingsForecast(context: AiContext, months: number): FinancialForecast | null {
  const activeGoals = context.savings.goals.filter((g) => g.progress.status !== 'completed');
  if (activeGoals.length === 0) return null;

  const oldestGoal = activeGoals.sort(
    (a, b) => new Date(a.progress.estimatedCompletionDate).getTime() - new Date(b.progress.estimatedCompletionDate).getTime(),
  )[0];

  if (!oldestGoal) return null;

  const remaining = oldestGoal.target - oldestGoal.current;
  const monthlyContribution = Math.max(1, context.budgetSummary.savingsCapacity.surplus * 0.3);
  const estMonths = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : months;

  const points: ForecastPoint[] = [];
  const now = new Date();
  let currentAmount = oldestGoal.current;

  for (let i = 1; i <= Math.min(estMonths, months); i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    currentAmount = Math.min(currentAmount + monthlyContribution, oldestGoal.target);
    points.push({ month: label, value: Math.round(currentAmount * 100) / 100 });
  }

  return {
    type: 'savings',
    title: `"${oldestGoal.name}" Goal Progress`,
    current: oldestGoal.current,
    projected: oldestGoal.target,
    trend: 'up',
    confidence: 70,
    months: points,
    description: `At $${monthlyContribution.toFixed(0)}/month, you'll reach your $${oldestGoal.target.toFixed(0)} goal in ${estMonths} months.`,
  };
}

function generateMortgageForecast(context: AiContext, months: number): FinancialForecast | null {
  if (!context.mortgage.details || !context.mortgage.dashboard) return null;

  const schedule = context.mortgage.details.schedule;
  if (!schedule || schedule.length === 0) return null;

  const points: ForecastPoint[] = [];
  const now = new Date();
  const startDate = new Date();

  for (let i = 0; i < months; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });

    const scheduleRow = schedule[i];
    const balance = scheduleRow ? scheduleRow.remainingBalance : 0;
    const projectedMonths = schedule.length - i;
    points.push({ month: label, value: Math.round(balance * 100) / 100 });
  }

  const currentBalance = schedule[0]?.remainingBalance ?? 0;
  const projected = points[points.length - 1]?.value ?? currentBalance;

  return {
    type: 'mortgage',
    title: 'Mortgage Balance',
    current: currentBalance,
    projected,
    trend: 'down',
    confidence: 95,
    months: points,
    description: `Mortgage balance decreasing per amortization schedule. ${context.mortgage.details.payoffMonths} months remaining.`,
  };
}

export function calculateSavingsCompletionDate(
  currentAmount: number,
  targetAmount: number,
  monthlyContribution: number,
): { months: number; date: string } {
  if (targetAmount <= 0 || monthlyContribution <= 0) {
    return { months: Infinity, date: '' };
  }

  const remaining = Math.max(0, targetAmount - currentAmount);
  const months = Math.ceil(remaining / monthlyContribution);
  const completionDate = new Date();
  completionDate.setMonth(completionDate.getMonth() + months);

  return {
    months,
    date: completionDate.toISOString().slice(0, 10),
  };
}

export function calculateMortgageImpact(
  principal: number,
  annualRate: number,
  monthlyPayment: number,
  extraPayment: number,
): { monthsSaved: number; interestSaved: number; newPayoffMonths: number } {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate <= 0 || principal <= 0) {
    return { monthsSaved: 0, interestSaved: 0, newPayoffMonths: 0 };
  }

  function calculatePayoffMonths(payment: number): { months: number; totalInterest: number } {
    let balance = principal;
    let months = 0;
    let totalInterest = 0;

    while (balance > 0 && months < 600) {
      const interest = balance * monthlyRate;
      totalInterest += interest;
      let principalPaid = payment - interest;
      if (principalPaid > balance) principalPaid = balance;
      balance -= principalPaid;
      months++;
    }

    return { months, totalInterest };
  }

  const standard = calculatePayoffMonths(monthlyPayment);
  const withExtra = calculatePayoffMonths(monthlyPayment + extraPayment);

  return {
    monthsSaved: standard.months - withExtra.months,
    interestSaved: standard.totalInterest - withExtra.totalInterest,
    newPayoffMonths: withExtra.months,
  };
}
