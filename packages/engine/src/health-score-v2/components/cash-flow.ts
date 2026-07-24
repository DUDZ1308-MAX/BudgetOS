import type { SubscoreResult } from '../types';
import { computeGrade, computeTrend } from '../utils';

export function computeCashFlowScore(
  cashFlow: number,
  monthlyIncome: number,
  cashFlowHistory: number[],
): SubscoreResult {
  let rawScore: number;
  if (cashFlow > 0 && monthlyIncome > 0) {
    const ratio = cashFlow / monthlyIncome;
    if (ratio >= 0.20) rawScore = 100;
    else if (ratio >= 0.10) rawScore = 80;
    else if (ratio >= 0.05) rawScore = 60;
    else rawScore = 40;
  } else if (cashFlow === 0) {
    rawScore = 30;
  } else {
    rawScore = 10;
  }

  const trend = computeTrend(cashFlowHistory);
  const explanation = cashFlow > 0
    ? `Your cash flow is positive at $${cashFlow.toFixed(0)}/mo (${(cashFlow / monthlyIncome * 100).toFixed(0)}% of income).`
    : cashFlow === 0
      ? `Your cash flow is breaking even.`
      : `Your cash flow is negative at $${Math.abs(cashFlow).toFixed(0)}/mo. Reduce expenses or increase income.`;

  return {
    score: Math.round(rawScore),
    grade: computeGrade(rawScore),
    trend,
    explanation,
    details: `Monthly cash flow: ${cashFlow >= 0 ? '+' : ''}$${cashFlow.toFixed(0)}`,
  };
}
