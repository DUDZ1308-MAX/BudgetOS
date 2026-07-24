import { computeWeightedAdherence } from '../../budget/percentage';
import type { SubscoreResult, FHSCategoryBudget, FHSCategoryActual } from '../types';
import { computeGrade } from '../utils';

export function computeBudgetAdherenceScore(
  budgets: FHSCategoryBudget[],
  actualSpending: FHSCategoryActual[],
): SubscoreResult {
  const actualMap = new Map(actualSpending.map((a) => [a.categoryId, a.spent]));
  const categories = budgets.map((b) => ({
    categoryId: b.categoryId,
    budgeted: b.budgeted,
    spent: actualMap.get(b.categoryId) ?? 0,
    rolloverApplied: 0,
    available: Math.max(0, b.budgeted - (actualMap.get(b.categoryId) ?? 0)),
    percentUsed: b.budgeted > 0 ? ((actualMap.get(b.categoryId) ?? 0) / b.budgeted) * 100 : 0,
    status: 'unknown',
  }));
  const adherence = computeWeightedAdherence(categories) / 100;
  let rawScore: number;
  if (adherence >= 0.95) {
    rawScore = 100;
  } else if (adherence >= 0.85) {
    rawScore = 80;
  } else if (adherence >= 0.70) {
    rawScore = 60;
  } else if (adherence >= 0.50) {
    rawScore = 40;
  } else {
    rawScore = 20;
  }

  const explanation = adherence >= 0.95
    ? `You stayed within budget for ${(adherence * 100).toFixed(0)}% of categories. Great discipline!`
    : `Budget adherence is ${(adherence * 100).toFixed(0)}%. Try to stay within budget for all categories.`;

  return {
    score: Math.round(rawScore),
    grade: computeGrade(rawScore),
    trend: 'stable',
    explanation,
    details: `Budget adherence: ${(adherence * 100).toFixed(0)}%`,
  };
}
