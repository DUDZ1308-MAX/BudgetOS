import type { RecurringFrequency } from '@budgetos/shared';

const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = 365;
const WEEKS_PER_YEAR = 52;
const BIWEEKS_PER_YEAR = 26;
const SEMIMONTHLY_PER_MONTH = 2;
const MONTHS_PER_QUARTER = 3;
const MONTHS_PER_SEMIANNUAL = 6;

export const FREQUENCY_MULTIPLIERS: Record<RecurringFrequency, number> = {
  one_time: 0,
  daily: DAYS_PER_YEAR / MONTHS_PER_YEAR,
  weekly: WEEKS_PER_YEAR / MONTHS_PER_YEAR,
  biweekly: BIWEEKS_PER_YEAR / MONTHS_PER_YEAR,
  semimonthly: SEMIMONTHLY_PER_MONTH,
  monthly: 1,
  quarterly: 1 / MONTHS_PER_QUARTER,
  semi_annual: 1 / MONTHS_PER_SEMIANNUAL,
  yearly: 1 / MONTHS_PER_YEAR,
};

export function toMonthlyEquivalent(amount: number, frequency: RecurringFrequency): number {
  const multiplier = FREQUENCY_MULTIPLIERS[frequency]!;
  const result = amount * multiplier;
  return Object.is(result, -0) ? 0 : result;
}
