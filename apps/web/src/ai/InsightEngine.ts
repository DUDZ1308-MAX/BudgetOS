import type { Insight } from '@/engine/types';
import type { AiContext, FinancialForecast } from '@/ai/types';
import { computeInsights } from '@/engine/insights/InsightEngine';
import { computeCashFlowSummary } from '@/engine/CashFlowEngine';

let insightCounter = 0;
function nextId(prefix: string): string {
  insightCounter++;
  return `${prefix}-${insightCounter}`;
}

export interface EnhancedInsight extends Insight {
  forecast?: FinancialForecast;
  actionable: boolean;
  suggestion?: string;
}

export function generateEnhancedInsights(context: AiContext): EnhancedInsight[] {
  const results: EnhancedInsight[] = [];

  const baseInsights = computeInsights({
    budgetSummary: context.budgetSummary,
    cashFlowSummary: context.cashFlowSummary,
    dateRange: { start: '', end: '' },
  });

  for (const insight of baseInsights) {
    const enhanced = insight as EnhancedInsight;
    enhanced.actionable = insight.severity === 'high';
    enhanced.suggestion = getSuggestion(insight);
    results.push(enhanced);
  }

  const budgetStatus = context.budgetSummary.budgetStatus;

  if (budgetStatus.totalRemaining > 0 && context.budgetSummary.income.total > 0) {
    const savingsPotential = Math.min(budgetStatus.totalRemaining * 0.5, context.budgetSummary.income.total * 0.1);
    if (savingsPotential > 50) {
      results.push({
        id: nextId('savings-potential'),
        type: 'info',
        title: 'Savings opportunity',
        message: `You could save an extra $${savingsPotential.toFixed(2)} this month by allocating half of your remaining budget.`,
        severity: 'low',
        category: 'savings',
        actionable: true,
        suggestion: `Consider moving $${savingsPotential.toFixed(2)} into savings.`,
      });
    }
  }

  const incomeVsExpense = context.cashFlowSummary.incomeVsExpenseRatio;
  if (incomeVsExpense > 0 && incomeVsExpense < 1.1) {
    results.push({
      id: nextId('income-warning'),
      type: 'warning',
      title: 'Expenses nearly match income',
      message: `Your expenses are ${(1 / incomeVsExpense * 100).toFixed(0)}% of your income. Try to keep this below 80%.`,
      severity: 'high',
      category: 'cashflow',
      actionable: true,
      suggestion: 'Review discretionary spending categories for potential cuts.',
    });
  }

  const healthyCategories = budgetStatus.categories.filter((c) => c.status === 'under');
  if (healthyCategories.length > 0) {
    results.push({
      id: nextId('under-budget'),
      type: 'success',
      title: `${healthyCategories.length} categories under budget`,
      message: `${healthyCategories.map((c) => c.categoryName).join(', ')} are under budget. Well managed!`,
      severity: 'low',
      category: 'budget',
      actionable: false,
    });
  }

  const { insights: base } = context;
  if (base.length === 0) {
    results.push({
      id: nextId('all-good'),
      type: 'success',
      title: 'Finances looking good',
      message: 'No significant issues detected. Keep up the good financial habits!',
      severity: 'low',
      category: 'budget',
      actionable: false,
    });
  }

  return results;
}

function getSuggestion(insight: Insight): string | undefined {
  switch (insight.category) {
    case 'budget':
      return 'Review budget allocations and consider reducing spending in this category.';
    case 'cashflow':
      return 'Track daily spending and look for recurring charges to reduce.';
    case 'savings':
      return 'Set up an automatic transfer to your savings account.';
    case 'spending':
      return 'Review transaction history for patterns and consider setting spending limits.';
  }
}

export function computeCashFlowForecast(context: AiContext, months: number = 3): FinancialForecast[] {
  const forecasts: FinancialForecast[] = [];
  const { cashFlowSummary, budgetSummary } = context;

  const monthlySpending = cashFlowSummary.totalExpenses;
  const monthlyIncome = cashFlowSummary.totalIncome;

  const spendingForecastMonths: { month: string; value: number }[] = [];
  const cashflowMonths: { month: string; value: number }[] = [];

  const now = new Date();
  let projectedBalance = budgetSummary.accounts.netWorth;

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    spendingForecastMonths.push({ month: label, value: Math.round(monthlySpending * 100) / 100 });

    projectedBalance += monthlyIncome - monthlySpending;
    cashflowMonths.push({ month: label, value: Math.round(projectedBalance * 100) / 100 });
  }

  if (monthlySpending > 0) {
    const lastValue = spendingForecastMonths[spendingForecastMonths.length - 1]?.value ?? 0;
    forecasts.push({
      type: 'spending',
      title: 'Spending Forecast',
      current: monthlySpending,
      projected: lastValue,
      trend: 'stable',
      confidence: 65,
      months: spendingForecastMonths,
      description: `Projected monthly spending of $${lastValue.toFixed(2)} based on current patterns.`,
    });
  }

  if (cashflowMonths.length > 0) {
    const first = cashflowMonths[0]?.value ?? 0;
    const last = cashflowMonths[cashflowMonths.length - 1]?.value ?? 0;
    const trend = last > first ? 'up' : last < first ? 'down' : 'stable';
    forecasts.push({
      type: 'cashflow',
      title: 'Cash Flow Forecast',
      current: budgetSummary.accounts.netWorth,
      projected: last,
      trend,
      confidence: 60,
      months: cashflowMonths,
      description: `Projected net worth of $${last.toFixed(2)} in ${months} months.`,
    });
  }

  return forecasts;
}
