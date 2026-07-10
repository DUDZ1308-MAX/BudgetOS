import type { FinancialHealthResult, HealthFactorScore, IntelligenceInput, HealthFactor, Suggestion } from './types';

const FACTOR_CONFIG: { factor: HealthFactor; label: string; weight: number; maxScore: number }[] = [
  { factor: 'budget_adherence', label: 'Budget Adherence', weight: 20, maxScore: 100 },
  { factor: 'savings_rate', label: 'Savings Rate', weight: 20, maxScore: 100 },
  { factor: 'emergency_fund', label: 'Emergency Fund', weight: 15, maxScore: 100 },
  { factor: 'debt_to_income', label: 'Debt-to-Income', weight: 15, maxScore: 100 },
  { factor: 'mortgage_progress', label: 'Mortgage Progress', weight: 10, maxScore: 100 },
  { factor: 'spending_consistency', label: 'Spending Consistency', weight: 10, maxScore: 100 },
  { factor: 'cash_flow_stability', label: 'Cash Flow Stability', weight: 10, maxScore: 100 },
];

export function computeFinancialHealth(input: IntelligenceInput): FinancialHealthResult {
  const factors: HealthFactorScore[] = FACTOR_CONFIG.map((cfg) => {
    const score = computeFactor(cfg.factor, input);
    return {
      factor: cfg.factor,
      label: cfg.label,
      score,
      maxScore: cfg.maxScore,
      weight: cfg.weight,
      description: getFactorDescription(cfg.factor, score, input),
    };
  });

  const overallScore = Math.round(
    factors.reduce((sum, f) => sum + (f.score * f.weight) / f.maxScore, 0),
  );

  const suggestions = generateSuggestions(factors, input);
  const trend = computeTrend(input);

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    factors,
    breakdown: getOverallBreakdown(overallScore),
    improvementSuggestions: suggestions,
    trend,
  };
}

function computeFactor(factor: HealthFactor, input: IntelligenceInput): number {
  switch (factor) {
    case 'budget_adherence': return computeBudgetAdherence(input);
    case 'savings_rate': return computeSavingsRateScore(input);
    case 'emergency_fund': return computeEmergencyFundScore(input);
    case 'debt_to_income': return computeDebtToIncomeScore(input);
    case 'mortgage_progress': return computeMortgageProgressScore(input);
    case 'spending_consistency': return computeSpendingConsistency(input);
    case 'cash_flow_stability': return computeCashFlowStability(input);
  }
}

function computeBudgetAdherence(input: IntelligenceInput): number {
  const { budgetStatus } = input.budgetSummary;
  if (!budgetStatus.categories.length) return 50;
  const overCount = budgetStatus.overBudget.length;
  const totalCount = budgetStatus.categories.length;
  const ratio = totalCount > 0 ? overCount / totalCount : 0;
  return Math.round(Math.max(0, 100 - ratio * 100));
}

function computeSavingsRateScore(input: IntelligenceInput): number {
  const rate = input.budgetSummary.savingsCapacity.savingsRate;
  if (rate >= 20) return 100;
  if (rate >= 15) return 80;
  if (rate >= 10) return 60;
  if (rate >= 5) return 40;
  if (rate > 0) return 20;
  return 0;
}

function computeEmergencyFundScore(input: IntelligenceInput): number {
  const monthlyExpenses = input.budgetSummary.expenses.total;
  const totalAssets = input.budgetSummary.accounts.totalAssets;
  if (monthlyExpenses <= 0) return 50;
  const monthsCovered = totalAssets / monthlyExpenses;
  if (monthsCovered >= 6) return 100;
  if (monthsCovered >= 3) return 70;
  if (monthsCovered >= 1) return 40;
  return Math.max(0, Math.round(monthsCovered * 40));
}

function computeDebtToIncomeScore(input: IntelligenceInput): number {
  const totalLiabilities = Math.abs(input.budgetSummary.accounts.totalLiabilities);
  const annualIncome = input.budgetSummary.income.total * 12;
  if (annualIncome <= 0) return 50;
  const ratio = totalLiabilities / annualIncome;
  if (ratio <= 0) return 100;
  if (ratio <= 0.36) return 80;
  if (ratio <= 0.43) return 50;
  if (ratio <= 0.5) return 30;
  return Math.max(0, Math.round(100 - ratio * 100));
}

function computeMortgageProgressScore(input: IntelligenceInput): number {
  if (!input.mortgageData) return 50;
  return Math.round(Math.min(100, input.mortgageData.progressPct));
}

function computeSpendingConsistency(input: IntelligenceInput): number {
  const cats = input.budgetSummary.expenses.byCategory;
  if (cats.length < 2) return 70;
  const amounts = cats.map((c) => c.amount);
  const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const variance = amounts.reduce((s, a) => s + (a - avg) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const cv = avg > 0 ? stdDev / avg : 0;
  if (cv < 0.5) return 90;
  if (cv < 1) return 70;
  if (cv < 1.5) return 50;
  return 30;
}

function computeCashFlowStability(input: IntelligenceInput): number {
  const { cashFlow } = input.budgetSummary;
  const trend = input.cashFlowSummary.sevenDayTrend;
  if (cashFlow.netIncome > 0 && trend >= 0) return 90;
  if (cashFlow.netIncome > 0) return 70;
  if (cashFlow.netIncome <= 0 && cashFlow.netIncome > -500) return 40;
  return Math.max(0, 30 + Math.round(cashFlow.netIncome / 100));
}

function getFactorDescription(factor: HealthFactor, score: number, input: IntelligenceInput): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs attention';
  if (score >= 20) return 'Concerning';
  return 'Critical';
}

function getOverallBreakdown(score: number): string {
  if (score >= 80) return 'Your financial health is excellent. Keep up the good habits!';
  if (score >= 60) return 'Your financial health is solid with room for improvement.';
  if (score >= 40) return 'Some areas need attention. Focus on the low-scoring factors.';
  if (score >= 20) return 'Several areas require immediate attention.';
  return 'Your financial health needs significant improvement. Review the suggestions below.';
}

function generateSuggestions(factors: HealthFactorScore[], input: IntelligenceInput): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const sorted = [...factors].sort((a, b) => a.score - b.score);

  for (const f of sorted.slice(0, 3)) {
    if (f.score >= 60) continue;
    suggestions.push(...getSuggestionsForFactor(f.factor, input));
  }

  return suggestions;
}

function getSuggestionsForFactor(factor: HealthFactor, input: IntelligenceInput): Suggestion[] {
  switch (factor) {
    case 'budget_adherence':
      return input.budgetSummary.budgetStatus.overBudget.map((b) => ({
        id: `budget_${b.categoryId}`,
        category: 'budget',
        message: `Reduce spending in ${b.categoryName} by $${Math.round(b.spent - b.budgeted)}`,
        impact: 'high' as const,
        actionLabel: 'View Budget',
      }));
    case 'savings_rate': {
      const surplus = input.budgetSummary.savingsCapacity.surplus;
      return [{
        id: 'savings_rate',
        category: 'savings',
        message: surplus > 0
          ? `Increase savings by $${Math.round(surplus * 0.5)}/mo to reach 20% rate`
          : 'Look for ways to reduce expenses to free up savings',
        impact: 'high' as const,
      }];
    }
    case 'emergency_fund': {
      const needed = Math.round(input.budgetSummary.expenses.total * 6);
      return [{
        id: 'emergency_fund',
        category: 'savings',
        message: `Build emergency fund: aim for $${needed} (6 months of expenses)`,
        impact: 'medium' as const,
      }];
    }
    case 'debt_to_income':
      return [{
        id: 'debt_income',
        category: 'mortgage',
        message: 'Focus on reducing debt to improve your debt-to-income ratio',
        impact: 'medium' as const,
      }];
    case 'cash_flow_stability':
      return input.cashFlowSummary.netFlow < 0 ? [{
        id: 'cashflow',
        category: 'budget',
        message: 'Your expenses exceed income. Review and reduce discretionary spending.',
        impact: 'high' as const,
      }] : [];
    default:
      return [];
  }
}

function computeTrend(input: IntelligenceInput): number[] {
  const trend: number[] = [];
  const current = computeBudgetAdherence(input);
  trend.push(current);
  if (input.previousMonthBudget) {
    const prev = computeBudgetAdherence({
      ...input,
      budgetSummary: input.previousMonthBudget,
    });
    trend.unshift(prev);
  }
  while (trend.length < 2) trend.unshift(current);
  return trend;
}
