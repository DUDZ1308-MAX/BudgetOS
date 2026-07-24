import { computeSavingsRate } from '../../shared/math';
import { FINANCIAL_THRESHOLDS } from '@budgetos/shared';
import type { SubscoreResult } from '../types';
import { computeGrade, computeTrend } from '../utils';

export function computeSavingsScore(
  savings: number,
  income: number,
  savingsHistory: number[],
): SubscoreResult {
  const rate = computeSavingsRate(savings, income);
  const target = FINANCIAL_THRESHOLDS.SAVINGS_RATE_TARGET;
  let rawScore: number;
  if (rate >= target) {
    rawScore = 100;
  } else if (rate >= target * 0.75) {
    rawScore = 80;
  } else if (rate >= target * 0.50) {
    rawScore = 60;
  } else if (rate >= target * 0.25) {
    rawScore = 40;
  } else if (rate > 0) {
    rawScore = 20;
  } else {
    rawScore = 0;
  }

  const trend = computeTrend(savingsHistory);
  const explanation = rate >= target
    ? `Your savings rate is ${(rate * 100).toFixed(0)}%, meeting the ${(target * 100).toFixed(0)}% target.`
    : `Your savings rate is ${(rate * 100).toFixed(0)}%. Aim for ${(target * 100).toFixed(0)}% or higher.`;

  return {
    score: Math.round(rawScore),
    grade: computeGrade(rawScore),
    trend,
    explanation,
    details: `Savings rate: ${(rate * 100).toFixed(1)}%`,
  };
}
