import { FHS_WEIGHTS } from '@budgetos/shared';
import type { FHSCategoryBudget, FHSCategoryActual, FHSComponentScore } from '../types';

export function computeBudgetAdherenceScore(
  budgets: FHSCategoryBudget[],
  actuals: FHSCategoryActual[],
): FHSComponentScore {
  let weightedSum = 0;
  let totalBudgeted = 0;

  for (const budget of budgets) {
    const actual = actuals.find((a) => a.categoryId === budget.categoryId);
    const spent = actual ? Math.abs(actual.spent) : 0;
    const adherence = budget.budgeted > 0 ? Math.min(1, (budget.budgeted - Math.max(0, spent - budget.budgeted)) / budget.budgeted) : 1;

    weightedSum += adherence * budget.budgeted;
    totalBudgeted += budget.budgeted;
  }

  const overallAdherence = totalBudgeted > 0 ? weightedSum / totalBudgeted : 1;
  const earnedPoints = overallAdherence * FHS_WEIGHTS.BUDGET_ADHERENCE_MAX;

  return {
    maxPoints: FHS_WEIGHTS.BUDGET_ADHERENCE_MAX,
    earnedPoints,
    percentage: (earnedPoints / FHS_WEIGHTS.BUDGET_ADHERENCE_MAX) * 100,
    details: `Budget adherence is ${(overallAdherence * 100).toFixed(0)}%. Staying within budget improves this score.`,
  };
}
