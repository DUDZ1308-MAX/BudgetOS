import type { SubscoreResult } from '../types';
import { computeGrade, computeTrend } from '../utils';

export function computeSpendingScore(
  monthlyIncome: number,
  monthlyExpenses: number,
  spendingHistory: number[],
): SubscoreResult {
  const ratio = monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 1;
  const idealRatio = 0.50;
  let rawScore: number;
  if (ratio <= idealRatio) {
    rawScore = 100;
  } else if (ratio <= 0.70) {
    rawScore = 80;
  } else if (ratio <= 0.85) {
    rawScore = 60;
  } else if (ratio <= 1.0) {
    rawScore = 40;
  } else {
    rawScore = 20;
  }

  const trend = computeTrend(spendingHistory);

  const explanation = ratio <= 0.50
    ? `Your spending is ${(ratio * 100).toFixed(0)}% of income, which is well managed.`
    : `Your spending is ${(ratio * 100).toFixed(0)}% of income. Consider reducing to 50% or less.`;

  return {
    score: Math.round(rawScore),
    grade: computeGrade(rawScore),
    trend,
    explanation,
    details: `Expense-to-income ratio: ${(ratio * 100).toFixed(0)}%`,
  };
}
