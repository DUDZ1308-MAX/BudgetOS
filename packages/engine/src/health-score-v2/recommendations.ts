import type { RecommendationRequest, RecommendationResult } from './types';

export function generateRecommendations(request: RecommendationRequest): RecommendationResult[] {
  const recommendations: RecommendationResult[] = [];
  let idCounter = 0;

  function nextId(): string {
    return `rec-${++idCounter}`;
  }

  // Spending recommendations
  if (request.monthlyExpenses / request.monthlyIncome > 0.70) {
    recommendations.push({
      id: nextId(),
      priority: 'high',
      category: 'spending',
      title: 'Reduce discretionary spending',
      description: `Your expenses are ${(request.monthlyExpenses / request.monthlyIncome * 100).toFixed(0)}% of income. Target 50% or less.`,
      expectedImpact: 'Improves cash flow and savings rate',
      estimatedSavings: Math.round(request.monthlyExpenses * 0.1),
      estimatedTimeline: '1-3 months',
      reasoning: 'High expense-to-income ratio limits savings and increases financial risk.',
    });
  }

  // Savings recommendations
  if (request.savingsRate < 0.20) {
    const targetSavings = Math.round(request.monthlyIncome * 0.20);
    const currentSavings = Math.round(request.monthlyIncome * request.savingsRate);
    recommendations.push({
      id: nextId(),
      priority: 'high',
      category: 'savings',
      title: 'Increase savings rate',
      description: `Your savings rate is ${(request.savingsRate * 100).toFixed(0)}%. Aim for 20% of income.`,
      expectedImpact: `Builds wealth and financial security`,
      estimatedSavings: targetSavings - currentSavings,
      estimatedTimeline: '3-6 months',
      reasoning: 'A higher savings rate accelerates net worth growth and provides a buffer for emergencies.',
    });
  }

  // Emergency fund recommendations
  if (request.emergencyFundMonths < 3) {
    const targetAmount = Math.round(request.monthlyExpenses * 3);
    recommendations.push({
      id: nextId(),
      priority: 'critical',
      category: 'emergency_fund',
      title: 'Build emergency fund',
      description: `Your emergency fund covers ${request.emergencyFundMonths.toFixed(1)} months. Aim for 3-6 months of expenses.`,
      expectedImpact: 'Financial security and peace of mind',
      estimatedSavings: 0,
      estimatedTimeline: `${Math.ceil((targetAmount) / Math.max(1, Math.round(request.monthlyIncome * 0.1)))} months`,
      reasoning: 'An emergency fund prevents going into debt when unexpected expenses arise.',
    });
  }

  // Debt recommendations
  if (request.debtToIncomeRatio > 0.36) {
    recommendations.push({
      id: nextId(),
      priority: 'high',
      category: 'debt',
      title: 'Reduce debt-to-income ratio',
      description: `Your DTI is ${(request.debtToIncomeRatio * 100).toFixed(0)}%. Aim for 36% or less.`,
      expectedImpact: 'Improves credit score and financial flexibility',
      estimatedSavings: Math.round(request.monthlyExpenses * 0.05),
      estimatedTimeline: '6-12 months',
      reasoning: 'High DTI limits borrowing ability and increases financial stress.',
    });
  }

  if (request.hasHighInterestDebt) {
    recommendations.push({
      id: nextId(),
      priority: 'critical',
      category: 'debt',
      title: 'Pay down high-interest debt',
      description: 'Focus on paying off credit card and other high-interest debt first.',
      expectedImpact: 'Significant interest savings',
      estimatedSavings: Math.round(request.monthlyExpenses * 0.15),
      estimatedTimeline: '6-12 months',
      reasoning: 'High-interest debt erodes wealth faster than investments can grow it.',
    });
  }

  // Mortgage recommendations
  if (request.mortgageBalance > 0) {
    recommendations.push({
      id: nextId(),
      priority: 'medium',
      category: 'mortgage',
      title: 'Consider extra mortgage payments',
      description: `Extra payments of $100/mo could save significant interest.`,
      expectedImpact: `Reduces total interest and accelerates payoff`,
      estimatedSavings: Math.round(request.mortgageBalance * request.mortgageRate * 0.01),
      estimatedTimeline: `${Math.ceil(request.mortgageBalance / (request.mortgageBalance * 0.01))} months`,
      reasoning: 'Extra mortgage payments reduce total interest paid and build equity faster.',
    });
  }

  // Budget recommendations
  if (request.budgetAdherence < 0.80) {
    recommendations.push({
      id: nextId(),
      priority: 'medium',
      category: 'budget',
      title: 'Improve budget adherence',
      description: `You stay within budget in ${(request.budgetAdherence * 100).toFixed(0)}% of categories. Aim for 95%+.`,
      expectedImpact: 'Better financial control and reduced overspending',
      estimatedSavings: Math.round(request.monthlyExpenses * 0.05),
      estimatedTimeline: '1-2 months',
      reasoning: 'Consistent budget adherence is the foundation of financial health.',
    });
  }

  // Retirement recommendations
  if (request.hasEmployerMatch && request.retirementContributions < request.monthlyIncome * 0.05) {
    recommendations.push({
      id: nextId(),
      priority: 'high',
      category: 'retirement',
      title: 'Maximize employer 401(k) match',
      description: 'Increase retirement contributions to capture the full employer match.',
      expectedImpact: 'Immediate 100% return on matched contributions',
      estimatedSavings: Math.round(request.monthlyIncome * 0.03),
      estimatedTimeline: '1 month',
      reasoning: 'Employer match is free money — always contribute enough to get the full match.',
    });
  }

  // Credit card utilization
  if (request.creditCardUtilization > 0.3) {
    recommendations.push({
      id: nextId(),
      priority: 'medium',
      category: 'debt',
      title: 'Lower credit card utilization',
      description: `Your credit utilization is ${(request.creditCardUtilization * 100).toFixed(0)}%. Keep it under 30%.`,
      expectedImpact: 'Improves credit score by 20-50 points',
      estimatedSavings: 0,
      estimatedTimeline: '3-6 months',
      reasoning: 'High credit utilization negatively impacts credit scores.',
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
  });
}
