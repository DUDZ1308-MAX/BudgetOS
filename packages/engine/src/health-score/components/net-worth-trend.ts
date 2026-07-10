import { computeNetWorthTrend } from '../../shared/math';
import { FHS_WEIGHTS } from '@budgetos/shared';
import type { FHSComponentScore } from '../types';

export function computeNetWorthTrendScore(
  currentNetWorth: number,
  netWorthThreeMonthsAgo: number,
): FHSComponentScore {
  const trend = computeNetWorthTrend(currentNetWorth, netWorthThreeMonthsAgo);

  let earnedPoints: number;
  switch (trend) {
    case 'positive':
      earnedPoints = FHS_WEIGHTS.NET_WORTH_TREND_MAX;
      break;
    case 'flat':
      earnedPoints = FHS_WEIGHTS.NET_WORTH_TREND_MAX / 2;
      break;
    case 'negative':
      earnedPoints = 0;
      break;
  }

  return {
    maxPoints: FHS_WEIGHTS.NET_WORTH_TREND_MAX,
    earnedPoints,
    percentage: (earnedPoints / FHS_WEIGHTS.NET_WORTH_TREND_MAX) * 100,
    details: trend === 'positive'
      ? 'Your net worth is trending upward.'
      : trend === 'flat'
        ? 'Your net worth is stable.'
        : 'Your net worth has declined. Review large expenses.',
  };
}
