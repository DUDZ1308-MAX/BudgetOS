import { computeSavingsRate, linearScore } from '../../shared/math';
import { FHS_WEIGHTS, FINANCIAL_THRESHOLDS } from '@budgetos/shared';
import type { FHSComponentScore } from '../types';

export function computeSavingsRateScore(
  savings: number,
  income: number,
): FHSComponentScore {
  const rate = computeSavingsRate(savings, income);
  const earnedPoints = linearScore(rate, FINANCIAL_THRESHOLDS.SAVINGS_RATE_TARGET, FHS_WEIGHTS.SAVINGS_RATE_MAX);

  return {
    maxPoints: FHS_WEIGHTS.SAVINGS_RATE_MAX,
    earnedPoints,
    percentage: (earnedPoints / FHS_WEIGHTS.SAVINGS_RATE_MAX) * 100,
    details: `Savings rate is ${(rate * 100).toFixed(1)}%. Target: ${(FINANCIAL_THRESHOLDS.SAVINGS_RATE_TARGET * 100)}%.`,
  };
}
