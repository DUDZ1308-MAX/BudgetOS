import type { Insight, InsightEngineInput } from '../types';
import { daysInMonth, parseDate } from '../utils';

let insightCounter = 0;
function nextId(prefix: string): string {
  insightCounter++;
  return `${prefix}-${insightCounter}`;
}

function resetCounter() {
  insightCounter = 0;
}

export function computeInsights(input: InsightEngineInput): Insight[] {
  resetCounter();
  const insights: Insight[] = [];

  const { budgetSummary, cashFlowSummary, dateRange, previousMonthSpending } = input;

  // --- Rule 1: Overspending Detection ---
  for (const cat of budgetSummary.budgetStatus.overBudget) {
    const isCritical = cat.percentUsed > 120;
    insights.push({
      id: nextId('overspend'),
      type: isCritical ? 'critical' : 'warning',
      title: isCritical
        ? `Critical overspend in ${cat.categoryName}`
        : `Overspent in ${cat.categoryName}`,
      message: isCritical
        ? `${cat.categoryName} is at ${cat.percentUsed.toFixed(0)}% of budget ($${cat.spent.toFixed(2)} of $${cat.budgeted.toFixed(2)}). Take immediate action.`
        : `${cat.categoryName} exceeded its $${cat.budgeted.toFixed(2)} budget by $${Math.abs(cat.remaining).toFixed(2)}.`,
      severity: isCritical ? 'high' : 'medium',
      category: 'budget',
    });
  }

  // --- Rule 2: Cash Flow Risk ---
  if (budgetSummary.cashFlow.projectedEndBalance < 0) {
    insights.push({
      id: nextId('cashflow'),
      type: 'critical',
      title: 'Projected month-end balance negative',
      message: `At your current pace, your balance will be -$${Math.abs(budgetSummary.cashFlow.projectedEndBalance).toFixed(2)} by month end. Reduce spending to avoid going negative.`,
      severity: 'high',
      category: 'cashflow',
    });
  }

  if (cashFlowSummary.dailyBalances.length >= 7 && cashFlowSummary.sevenDayTrend < 0) {
    insights.push({
      id: nextId('cashflow-trend'),
      type: 'warning',
      title: 'Declining balance trend',
      message: `Your balance has declined by $${Math.abs(cashFlowSummary.sevenDayTrend).toFixed(2)} over the past 7 days.`,
      severity: 'medium',
      category: 'cashflow',
    });
  }

  // --- Rule 3: Savings Rate ---
  const savingsRate = budgetSummary.savingsCapacity.savingsRate;
  if (budgetSummary.income.total > 0) {
    if (savingsRate < 10) {
      insights.push({
        id: nextId('savings-rate'),
        type: 'warning',
        title: 'Low savings rate',
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 10% of income.`,
        severity: 'medium',
        category: 'savings',
      });
    } else if (savingsRate >= 20) {
      insights.push({
        id: nextId('savings-rate'),
        type: 'success',
        title: 'Strong savings rate',
        message: `You're saving ${savingsRate.toFixed(1)}% of income. Keep it up!`,
        severity: 'low',
        category: 'savings',
      });
    }
  }

  // --- Rule 4: Spending Velocity ---
  const { totalBudgeted, totalSpent } = budgetSummary.budgetStatus;
  if (totalBudgeted > 0) {
    const startDate = parseDate(dateRange.start);
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    const totalDays = daysInMonth(year, month);
    const today = new Date();
    const daysPassed = Math.max(1, today.getDate() - startDate.getDate() + 1);
    const expectedSoFar = (totalBudgeted / totalDays) * daysPassed;

    if (expectedSoFar > 0 && totalSpent > expectedSoFar * 1.3) {
      insights.push({
        id: nextId('velocity'),
        type: 'warning',
        title: 'Spending ahead of pace',
        message: `You've spent $${totalSpent.toFixed(2)} of your $${totalBudgeted.toFixed(2)} budget. That's ${(totalSpent / expectedSoFar * 100).toFixed(0)}% of expected pace.`,
        severity: 'medium',
        category: 'spending',
      });
    }
  }

  // --- Rule 5: Unusual Spending ---
  if (previousMonthSpending) {
    for (const cat of budgetSummary.expenses.byCategory) {
      if (!cat.categoryId) continue;
      const prevAmount = previousMonthSpending[cat.categoryId] ?? 0;
      if (prevAmount > 0 && cat.amount > prevAmount * 1.5) {
        insights.push({
          id: nextId('unusual'),
          type: 'warning',
          title: `Unusual spending in ${cat.categoryName}`,
          message: `${cat.categoryName} spending increased ${((cat.amount / prevAmount - 1) * 100).toFixed(0)}% compared to last month ($${cat.amount.toFixed(2)} vs $${prevAmount.toFixed(2)}).`,
          severity: 'medium',
          category: 'spending',
        });
      }
    }
  }

  return insights;
}
