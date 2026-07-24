import type { HealthScoreResult, TrendAnalysisResult, InsightResult } from './types';

export function generateInsights(
  _healthScore: HealthScoreResult,
  trends: TrendAnalysisResult,
  monthlyIncome: number,
  monthlyExpenses: number,
  prevMonthExpenses: number,
  savingsRate: number,
  mortgageProgressPct: number,
  _budgetAdherence: number,
  consecutiveOnBudget: number,
): InsightResult[] {
  const insights: InsightResult[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // Spending insight
  if (prevMonthExpenses > 0 && monthlyExpenses > 0) {
    const change = ((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses) * 100;
    if (Math.abs(change) >= 5) {
      insights.push({
        id: `insight-spending-${today}`,
        category: 'spending',
        title: change < 0 ? 'Spending decreased' : 'Spending increased',
        message: change < 0
          ? `You spent ${Math.abs(change).toFixed(0)}% less this month compared to last month.`
          : `Your spending increased ${change.toFixed(0)}% compared to last month.`,
        type: change < 0 ? 'positive' : 'warning',
        date: today,
      });
    }
  }

  // Savings rate insight
  if (savingsRate >= 0.20) {
    insights.push({
      id: `insight-savings-rate-${today}`,
      category: 'savings',
      title: 'Savings rate on track',
      message: `Your savings rate of ${(savingsRate * 100).toFixed(0)}% meets the recommended 20% target.`,
      type: 'positive',
      date: today,
    });
  } else if (savingsRate > 0) {
    const gap = (0.20 - savingsRate) * monthlyIncome;
    insights.push({
      id: `insight-savings-gap-${today}`,
      category: 'savings',
      title: 'Savings rate gap',
      message: `You are saving $${Math.round(gap).toLocaleString()}/mo less than the 20% target.`,
      type: 'warning',
      date: today,
    });
  }

  // Mortgage insight
  if (mortgageProgressPct > 0) {
    if (mortgageProgressPct > 50) {
      insights.push({
        id: `insight-mortgage-${today}`,
        category: 'mortgage',
        title: 'Mortgage progress',
        message: `You are ${mortgageProgressPct.toFixed(0)}% through your mortgage. Keep going!`,
        type: 'positive',
        date: today,
      });
    } else {
      insights.push({
        id: `insight-mortgage-${today}`,
        category: 'mortgage',
        title: 'Mortgage progress',
        message: `You are ${mortgageProgressPct.toFixed(0)}% through your mortgage repayment.`,
        type: 'neutral',
        date: today,
      });
    }
  }

  // Budget streak insight
  if (consecutiveOnBudget >= 3) {
    insights.push({
      id: `insight-budget-streak-${today}`,
      category: 'budget',
      title: 'Budget streak',
      message: `You stayed within budget for ${consecutiveOnBudget} consecutive months. Excellent discipline!`,
      type: 'positive',
      date: today,
    });
  }

  // Net worth trend insight
  if (trends.netWorth.direction === 'improving') {
    insights.push({
      id: `insight-net-worth-${today}`,
      category: 'net_worth',
      title: 'Net worth growing',
      message: `Your net worth is trending upward (${trends.netWorth.changePercent >= 0 ? '+' : ''}${trends.netWorth.changePercent.toFixed(1)}%).`,
      type: 'positive',
      date: today,
    });
  } else if (trends.netWorth.direction === 'declining') {
    insights.push({
      id: `insight-net-worth-${today}`,
      category: 'net_worth',
      title: 'Net worth declining',
      message: `Your net worth has declined ${Math.abs(trends.netWorth.changePercent).toFixed(1)}%. Review large expenses.`,
      type: 'warning',
      date: today,
    });
  }

  // Cash flow insight
  if (monthlyIncome > monthlyExpenses) {
    const projectedAnnualSavings = (monthlyIncome - monthlyExpenses) * 12;
    if (projectedAnnualSavings > 0) {
      insights.push({
        id: `insight-projection-${today}`,
        category: 'cash_flow',
        title: 'Positive cash flow',
        message: `You are projected to save $${projectedAnnualSavings.toLocaleString()} this year at your current rate.`,
        type: 'positive',
        date: today,
      });
    }
  } else {
    insights.push({
      id: `insight-negative-cf-${today}`,
      category: 'cash_flow',
      title: 'Negative cash flow',
      message: 'Your expenses exceed your income. Review and reduce discretionary spending.',
      type: 'warning',
      date: today,
    });
  }

  return insights;
}
