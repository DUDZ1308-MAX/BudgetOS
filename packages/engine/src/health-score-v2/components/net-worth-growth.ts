import type { SubscoreResult } from '../types';
import { computeGrade, computeTrend } from '../utils';

export function computeNetWorthGrowthScore(
  currentNetWorth: number,
  netWorthThreeMonthsAgo: number,
  netWorthHistory: number[],
): SubscoreResult {
  let rawScore: number;
  let growthPct = 0;

  if (netWorthThreeMonthsAgo > 0 && currentNetWorth > 0) {
    growthPct = ((currentNetWorth - netWorthThreeMonthsAgo) / netWorthThreeMonthsAgo) * 100;
  } else if (currentNetWorth > 0 && netWorthThreeMonthsAgo <= 0) {
    growthPct = 50;
  }

  if (growthPct >= 10) {
    rawScore = 100;
  } else if (growthPct >= 5) {
    rawScore = 85;
  } else if (growthPct >= 2) {
    rawScore = 70;
  } else if (growthPct >= 0) {
    rawScore = 55;
  } else if (growthPct >= -5) {
    rawScore = 35;
  } else {
    rawScore = 15;
  }

  const trend = computeTrend(netWorthHistory);
  const explanation = growthPct > 0
    ? `Your net worth grew ${growthPct.toFixed(1)}% over the past 3 months.`
    : growthPct === 0
      ? `Your net worth stayed flat over the past 3 months.`
      : `Your net worth declined ${Math.abs(growthPct).toFixed(1)}% over the past 3 months.`;

  return {
    score: Math.round(rawScore),
    grade: computeGrade(rawScore),
    trend,
    explanation,
    details: `Net worth growth: ${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%`,
  };
}
