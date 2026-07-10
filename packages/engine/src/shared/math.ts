/**
 * Pure financial math functions.
 * All monetary values are in cents (integer) to avoid floating point errors.
 * All rates are expressed as decimals (e.g., 0.065 for 6.5%).
 */

/** Standard monthly payment (PMT) formula */
export function computeMonthlyPayment(
  principal: number,
  monthlyRate: number,
  totalPayments: number,
): number {
  if (monthlyRate === 0) {
    return Math.round(principal / totalPayments);
  }
  const factor = Math.pow(1 + monthlyRate, totalPayments);
  return Math.round((principal * monthlyRate * factor) / (factor - 1));
}

/** Future value of a series of equal payments */
export function computeFutureValue(
  payment: number,
  rate: number,
  periods: number,
): number {
  if (rate === 0) {
    return payment * periods;
  }
  return Math.round(payment * ((Math.pow(1 + rate, periods) - 1) / rate));
}

/** Interest portion of a payment for a given balance */
export function computeInterestPortion(
  balance: number,
  monthlyRate: number,
): number {
  return Math.round(balance * monthlyRate);
}

/** Principal portion of a payment */
export function computePrincipalPortion(
  payment: number,
  interestPortion: number,
): number {
  return payment - interestPortion;
}

/** Savings rate as a decimal */
export function computeSavingsRate(
  savings: number,
  income: number,
): number {
  if (income <= 0) return 0;
  return savings / income;
}

/** Debt-to-income ratio as a decimal */
export function computeDTI(
  debtPayments: number,
  income: number,
): number {
  if (income <= 0) return 1;
  return debtPayments / income;
}

/** Months of emergency fund coverage */
export function computeEmergencyFundMonths(
  balance: number,
  monthlyExpenses: number,
): number {
  if (monthlyExpenses <= 0) return 0;
  return balance / monthlyExpenses;
}

/** Linear interpolation clamped to [0, max] */
export function linearScore(
  ratio: number,
  target: number,
  maxScore: number,
): number {
  if (ratio >= target) return maxScore;
  const score = (ratio / target) * maxScore;
  return Math.max(0, Math.round(score * 100) / 100);
}

/** Inverse linear score: higher ratio = lower score */
export function inverseLinearScore(
  ratio: number,
  goodThreshold: number,
  badThreshold: number,
  maxScore: number,
): number {
  if (ratio <= goodThreshold) return maxScore;
  if (ratio >= badThreshold) return 0;
  const score = maxScore * (1 - (ratio - goodThreshold) / (badThreshold - goodThreshold));
  return Math.max(0, Math.round(score * 100) / 100);
}

/** Net worth trend: positive > 0, flat 0 to -5%, negative < -5% */
export function computeNetWorthTrend(
  current: number,
  past: number,
): 'positive' | 'flat' | 'negative' {
  if (past === 0) return 'flat';
  const change = (current - past) / Math.abs(past);
  if (change > 0) return 'positive';
  if (change >= -0.05) return 'flat';
  return 'negative';
}
