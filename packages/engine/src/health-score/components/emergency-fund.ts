import { computeEmergencyFundMonths, linearScore } from '../../shared/math';
import { FHS_WEIGHTS, FINANCIAL_THRESHOLDS } from '@budgetos/shared';
import type { FHSComponentScore } from '../types';

export function computeEmergencyFundScore(
  balance: number,
  monthlyExpenses: number,
): FHSComponentScore {
  const months = computeEmergencyFundMonths(balance, monthlyExpenses);
  const earnedPoints = linearScore(months, FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_2, FHS_WEIGHTS.EMERGENCY_FUND_MAX);

  return {
    maxPoints: FHS_WEIGHTS.EMERGENCY_FUND_MAX,
    earnedPoints,
    percentage: (earnedPoints / FHS_WEIGHTS.EMERGENCY_FUND_MAX) * 100,
    details: `Emergency fund covers ${months.toFixed(1)} months of expenses. Target: ${FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_2} months.`,
  };
}
