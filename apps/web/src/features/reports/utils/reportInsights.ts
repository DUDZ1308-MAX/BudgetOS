import type { ReportInsight } from '../reportTypes';

export function generateCashFlowInsights(monthlyIncome: number, monthlyExpenses: number, cashFlow: number): ReportInsight[] {
  const insights: ReportInsight[] = [];
  if (cashFlow > 0) {
    insights.push({ type: 'positive', title: 'Positive Cash Flow', message: `You have a surplus of $${cashFlow.toLocaleString()} this period. Consider investing or adding to savings.` });
  } else if (cashFlow < 0) {
    insights.push({ type: 'warning', title: 'Cash Flow Deficit', message: `Spending exceeds income by $${Math.abs(cashFlow).toLocaleString()}. Review discretionary expenses.`, metric: cashFlow.toFixed(0) });
  }
  if (monthlyExpenses > monthlyIncome * 0.9) {
    insights.push({ type: 'warning', title: 'High Expense Ratio', message: `Expenses consume ${((monthlyExpenses / monthlyIncome) * 100).toFixed(0)}% of income. Aim for under 80%.` });
  }
  return insights;
}

export function generateSpendingInsights(categoryData: Array<{ name: string; value: number; share: number }>, totalExpenses: number): ReportInsight[] {
  const insights: ReportInsight[] = [];
  if (categoryData.length > 0) {
    const top = categoryData[0]!;
    insights.push({ type: 'neutral', title: 'Highest Spending Category', message: `${top.name} accounts for ${top.share}% of spending at $${top.value.toLocaleString()}.`, metric: top.name });
    if (categoryData.length > 1) {
      const second = categoryData[1]!;
      insights.push({ type: 'neutral', title: 'Second Highest', message: `${second.name} at $${second.value.toLocaleString()} (${second.share}% of spending).` });
    }
  }
  if (totalExpenses > 0 && categoryData.length > 0) {
    const top3total = categoryData.slice(0, 3).reduce((s, c) => s + c.value, 0);
    const pct = ((top3total / totalExpenses) * 100).toFixed(0);
    insights.push({ type: 'neutral', title: 'Top 3 Categories', message: `Your top 3 spending categories account for ${pct}% of total expenses.` });
  }
  return insights;
}

export function generateBudgetInsights(onTrack: number, over: number, totalCategories: number, adherencePct: number): ReportInsight[] {
  const insights: ReportInsight[] = [];
  if (totalCategories === 0) return insights;
  if (over === 0) {
    insights.push({ type: 'positive', title: 'All Budgets On Track', message: `All ${totalCategories} budget categories are within budget. Great discipline!` });
  } else {
    insights.push({ type: 'warning', title: `${over} Category${over > 1 ? 'ies' : 'y'} Over Budget`, message: `${over} of ${totalCategories} budget categories exceed their limits. Review and adjust.` });
  }
  if (adherencePct >= 90) {
    insights.push({ type: 'positive', title: 'Strong Budget Adherence', message: `Your budget adherence is ${adherencePct.toFixed(0)}%. Excellent control.` });
  } else if (adherencePct < 70) {
    insights.push({ type: 'warning', title: 'Budget Needs Attention', message: `Budget adherence is ${adherencePct.toFixed(0)}%. Consider setting more realistic limits.` });
  }
  return insights;
}

export function generateSavingsInsights(totalSaved: number, totalTarget: number, completedGoals: number, activeGoals: number): ReportInsight[] {
  const insights: ReportInsight[] = [];
  if (totalTarget > 0) {
    const pct = ((totalSaved / totalTarget) * 100).toFixed(0);
    insights.push({ type: 'neutral', title: 'Savings Progress', message: `You've saved ${pct}% toward your goal${activeGoals > 1 ? 's' : ''} ($${totalSaved.toLocaleString()} of $${totalTarget.toLocaleString()}).` });
  }
  if (completedGoals > 0) {
    insights.push({ type: 'positive', title: `${completedGoals} Goal${completedGoals > 1 ? 's' : ''} Completed`, message: `Congratulations! ${completedGoals} savings goal${completedGoals > 1 ? 's have' : ' has'} been fully funded.` });
  }
  return insights;
}

export function generateNetWorthInsights(netWorth: number): ReportInsight[] {
  const insights: ReportInsight[] = [];
  if (netWorth > 0) {
    insights.push({ type: 'positive', title: 'Positive Net Worth', message: `Your net worth is $${netWorth.toLocaleString()}. You have more assets than liabilities.` });
  } else if (netWorth < 0) {
    insights.push({ type: 'warning', title: 'Negative Net Worth', message: `Your net worth is -$${Math.abs(netWorth).toLocaleString()}. Focus on debt reduction.`, metric: netWorth.toFixed(0) });
  }
  return insights;
}

export function generateMortgageInsights(progressPct: number, interestSaved: number, remainingBalance: number): ReportInsight[] {
  const insights: ReportInsight[] = [];
  if (interestSaved > 0) {
    insights.push({ type: 'positive', title: 'Interest Saved', message: `Extra payments have saved $${interestSaved.toLocaleString()} in interest so far.` });
  }
  if (progressPct > 50) {
    insights.push({ type: 'positive', title: 'More Than Halfway', message: `You've paid ${progressPct.toFixed(0)}% of your mortgage. Payoff is in sight!` });
  }
  return insights;
}

export function generateRecurringInsights(activeCount: number, monthlyTotal: number): ReportInsight[] {
  const insights: ReportInsight[] = [];
  if (activeCount > 0) {
    insights.push({ type: 'neutral', title: 'Monthly Recurring Obligations', message: `${activeCount} active recurring transactions totaling $${monthlyTotal.toLocaleString()}/month.` });
  }
  return insights;
}
