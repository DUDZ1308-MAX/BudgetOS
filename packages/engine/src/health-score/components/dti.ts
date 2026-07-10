import { computeDTI, inverseLinearScore } from '../../shared/math';
import { FHS_WEIGHTS, FINANCIAL_THRESHOLDS } from '@budgetos/shared';
import type { FHSComponentScore } from '../types';

export function computeDTIScore(
  debtPayments: number,
  income: number,
): FHSComponentScore {
  const dti = computeDTI(debtPayments, income);
  const earnedPoints = inverseLinearScore(
    dti,
    FINANCIAL_THRESHOLDS.DTI_MAX_RATIO,
    FINANCIAL_THRESHOLDS.DTI_CRITICAL_RATIO,
    FHS_WEIGHTS.DTI_MAX,
  );

  return {
    maxPoints: FHS_WEIGHTS.DTI_MAX,
    earnedPoints,
    percentage: (earnedPoints / FHS_WEIGHTS.DTI_MAX) * 100,
    details: `Debt-to-income ratio is ${(dti * 100).toFixed(1)}%. Target: under ${(FINANCIAL_THRESHOLDS.DTI_MAX_RATIO * 100)}%.`,
  };
}
