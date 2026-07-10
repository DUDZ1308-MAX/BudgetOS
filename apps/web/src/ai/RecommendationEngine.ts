import type { AiContext, Recommendation } from '@/ai/types';

let recCounter = 0;
function nextId(): string {
  recCounter++;
  return `rec-${recCounter}`;
}

export function generateRecommendations(context: AiContext): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { budgetSummary, savings, mortgage, cashFlowSummary } = context;

  // 1. Overspending recommendations
  for (const cat of budgetSummary.budgetStatus.overBudget) {
    const overspent = cat.spent - cat.budgeted;
    const reductionTarget = Math.min(overspent, cat.spent * 0.15);

    recommendations.push({
      id: nextId(),
      title: `Reduce ${cat.categoryName} spending by 15%`,
      description: `You're $${overspent.toFixed(2)} over budget in ${cat.categoryName}. A 15% reduction would save about $${reductionTarget.toFixed(2)}.`,
      priority: cat.percentUsed > 120 ? 'critical' : 'high',
      impact: `Save ~$${reductionTarget.toFixed(2)} per month`,
      confidence: 85,
      reasoning: `${cat.categoryName} is ${cat.percentUsed.toFixed(0)}% over budget. Reducing spending is the most direct way to address this.`,
      category: 'budget',
      actionLabel: 'Set spending limit',
    });
  }

  // 2. Savings recommendations
  const activeGoals = savings.goals.filter((g) => g.progress.status !== 'completed');
  if (activeGoals.length > 0 && budgetSummary.savingsCapacity.surplus > 0) {
    const surplus = budgetSummary.savingsCapacity.surplus;
    const increaseAmount = Math.min(50, surplus);

    recommendations.push({
      id: nextId(),
      title: `Increase savings contribution by $${increaseAmount.toFixed(0)}/month`,
      description: `You have $${surplus.toFixed(2)} surplus available. Increasing savings by $${increaseAmount.toFixed(0)} per month accelerates your goals.`,
      priority: savings.dashboard.totalSaved < savings.dashboard.totalTarget * 0.5 ? 'high' : 'medium',
      impact: `Save an extra $${(increaseAmount * 12).toFixed(0)} per year`,
      confidence: 75,
      reasoning: `With $${surplus.toFixed(2)} surplus and ${activeGoals.length} active goal(s), additional savings will help reach targets faster.`,
      category: 'savings',
      actionLabel: 'Increase savings',
    });
  }

  // 3. Mortgage recommendations
  if (mortgage.dashboard && mortgage.details) {
    const extraPayment = mortgage.dashboard.monthlyPayment * 0.1;
    if (extraPayment > 0) {
      recommendations.push({
        id: nextId(),
        title: `Pay an extra $${extraPayment.toFixed(0)}/month on mortgage`,
        description: `Adding $${extraPayment.toFixed(0)} (${(10).toFixed(0)}% of your payment) to your mortgage payment reduces total interest and accelerates payoff.`,
        priority: 'medium',
        impact: `Save thousands in interest over the loan term`,
        confidence: 90,
        reasoning: `Extra principal payments reduce the amortization schedule and total interest paid.`,
        category: 'mortgage',
        actionLabel: 'Set extra payment',
      });
    }
  }

  // 4. Surplus to savings
  if (budgetSummary.savingsCapacity.surplus > 100) {
    const transferAmount = budgetSummary.savingsCapacity.surplus;
    recommendations.push({
      id: nextId(),
      title: `Move $${transferAmount.toFixed(0)} surplus into savings`,
      description: `You have $${transferAmount.toFixed(2)} surplus this month. Moving it to savings improves your financial position.`,
      priority: 'medium',
      impact: `Boost savings by $${transferAmount.toFixed(0)}`,
      confidence: 80,
      reasoning: `Surplus funds sitting in checking earn minimal interest. Moving to savings supports goal achievement.`,
      category: 'savings',
      actionLabel: 'Transfer to savings',
    });
  }

  // 5. Budget allocation adjustment
  const overBudgetPct =
    budgetSummary.budgetStatus.totalBudgeted > 0
      ? (budgetSummary.budgetStatus.totalSpent / budgetSummary.budgetStatus.totalBudgeted) * 100
      : 0;

  if (overBudgetPct > 100) {
    const suggestedBudget = budgetSummary.budgetStatus.totalSpent * 1.1;
    recommendations.push({
      id: nextId(),
      title: 'Adjust category budget allocations',
      description: `Your total spending exceeds total budget by ${(overBudgetPct - 100).toFixed(0)}%. Consider reallocating budgets to match actual spending patterns.`,
      priority: 'high',
      impact: `Align budgets with reality — suggested total: $${suggestedBudget.toFixed(0)}`,
      confidence: 70,
      reasoning: 'Budgets that don\'t match spending patterns lead to chronic overspending alerts. Right-sizing helps you track more effectively.',
      category: 'budget',
      actionLabel: 'Adjust budgets',
    });
  }

  // 6. Cash flow protection
  if (cashFlowSummary.sevenDayTrend < -500) {
    recommendations.push({
      id: nextId(),
      title: 'Review recent spending surge',
      description: `Your balance dropped by $${Math.abs(cashFlowSummary.sevenDayTrend).toFixed(0)} in the past 7 days. Review recent transactions to understand the trend.`,
      priority: 'high',
      impact: `Stop negative balance trend`,
      confidence: 75,
      reasoning: 'A rapid balance decline can indicate unexpected expenses or overspending that needs attention.',
      category: 'cashflow',
      actionLabel: 'Review transactions',
    });
  }

  return recommendations;
}
