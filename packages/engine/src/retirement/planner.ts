import { computeFutureValue } from '../shared/math';
import { RETIREMENT } from '@budgetos/shared';
import type { RetirementPlanInput, RetirementPlanResult } from '@budgetos/shared';

/**
 * Calculates a retirement plan projection.
 *
 * Single source of truth for retirement math. Years until retirement is the
 * difference between the target retirement age and the current age; the
 * projected nest egg is the future value of the monthly contribution stream
 * grown at the inflation-adjusted real return rate.
 */
export function calculateRetirementPlan(input: RetirementPlanInput): RetirementPlanResult {
  const {
    currentAge,
    retirementAge,
    currentYear,
    monthlyContribution,
    annualReturnRate,
    inflationRate,
  } = input;

  const yearsUntilRetirement = retirementAge - currentAge;
  const estimatedRetirementYear = currentYear + yearsUntilRetirement;
  const isAtRetirementAge = yearsUntilRetirement <= 0;
  const passedRetirementAge = yearsUntilRetirement < 0;

  let projectedNestEgg = 0;
  if (yearsUntilRetirement > 0 && monthlyContribution > 0) {
    const realAnnualReturn = (1 + annualReturnRate) / (1 + inflationRate) - 1;
    const monthlyRate = realAnnualReturn / 12;
    projectedNestEgg = computeFutureValue(monthlyContribution, monthlyRate, yearsUntilRetirement * 12);
  }

  const annualContribution = monthlyContribution * 12;
  const monthlyIncome = projectedNestEgg * RETIREMENT.SAFE_WITHDRAWAL_RATE / 12;
  const incomeTarget = annualContribution * RETIREMENT.INCOME_TARGET_MULTIPLIER;
  const score = incomeTarget > 0 ? Math.min(100, Math.round((monthlyIncome / incomeTarget) * 100)) : 0;

  return {
    currentAge,
    retirementAge,
    yearsUntilRetirement,
    estimatedRetirementYear,
    projectedNestEgg,
    monthlyIncome: Math.round(monthlyIncome),
    incomeTarget: Math.round(incomeTarget),
    readinessScore: Math.max(0, score),
    isAtRetirementAge,
    passedRetirementAge,
  };
}
