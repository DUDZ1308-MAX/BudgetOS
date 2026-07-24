import { FINANCIAL_THRESHOLDS } from '@budgetos/shared';
import type { SubscoreResult } from '../types';
import { computeGrade, computeTrend } from '../utils';

export function computeDebtScore(
  totalDebtPayments: number,
  totalIncome: number,
  creditCardBalances: number,
  _mortgageBalance: number,
  totalAssets: number,
  debtHistory: number[],
): SubscoreResult {
  const dti = totalIncome > 0 ? totalDebtPayments / totalIncome : 1;
  const maxDti = FINANCIAL_THRESHOLDS.DTI_MAX_RATIO;
  const criticalDti = FINANCIAL_THRESHOLDS.DTI_CRITICAL_RATIO;
  let rawScore: number;
  if (dti <= maxDti) {
    rawScore = 100;
  } else if (dti <= (maxDti + criticalDti) / 2) {
    rawScore = 75;
  } else if (dti <= criticalDti) {
    rawScore = 50;
  } else if (dti <= 0.65) {
    rawScore = 25;
  } else {
    rawScore = 10;
  }

  if (creditCardBalances > 0 && totalAssets > 0) {
    const creditUtil = creditCardBalances / totalAssets;
    if (creditUtil > 0.5) rawScore = Math.max(0, rawScore - 20);
    else if (creditUtil > 0.3) rawScore = Math.max(0, rawScore - 10);
  }

  const trend = computeTrend(debtHistory);
  const explanation = dti <= maxDti
    ? `Your debt-to-income ratio is ${(dti * 100).toFixed(0)}%, which is healthy.`
    : `Your debt-to-income ratio is ${(dti * 100).toFixed(0)}%. Aim for ${(maxDti * 100).toFixed(0)}% or less.`;

  return {
    score: Math.round(rawScore),
    grade: computeGrade(rawScore),
    trend,
    explanation,
    details: `DTI: ${(dti * 100).toFixed(1)}%`,
  };
}
