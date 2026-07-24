import { FINANCIAL_THRESHOLDS } from '@budgetos/shared';
import type { SubscoreResult } from '../types';
import { computeGrade, computeTrend } from '../utils';

export function computeEmergencyFundScore(
  emergencyFundBalance: number,
  monthlyExpenses: number,
  emergencyFundHistory: number[],
): SubscoreResult {
  const months = monthlyExpenses > 0 ? emergencyFundBalance / monthlyExpenses : 0;
  const tier1 = FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_1;
  const tier2 = FINANCIAL_THRESHOLDS.EMERGENCY_FUND_MONTHS_TIER_2;
  let rawScore: number;
  if (months >= tier2) {
    rawScore = 100;
  } else if (months >= tier1) {
    rawScore = 60 + ((months - tier1) / (tier2 - tier1)) * 40;
  } else if (months > 0) {
    rawScore = (months / tier1) * 60;
  } else {
    rawScore = 0;
  }

  const trend = computeTrend(emergencyFundHistory);
  const explanation = months >= tier2
    ? `Your emergency fund covers ${months.toFixed(1)} months of expenses. Excellent!`
    : months >= tier1
      ? `Your emergency fund covers ${months.toFixed(1)} months. Aim for ${tier2} months.`
      : `Your emergency fund covers ${months.toFixed(1)} months. Aim for at least ${tier1} months.`;

  return {
    score: Math.round(rawScore),
    grade: computeGrade(rawScore),
    trend,
    explanation,
    details: `Emergency fund: ${months.toFixed(1)} months of expenses`,
  };
}
