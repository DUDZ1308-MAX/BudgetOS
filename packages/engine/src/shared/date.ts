/**
 * Date utilities for financial calculations.
 * All dates are ISO strings (YYYY-MM-DD) — no Date object manipulation.
 */

/** Total months between two ISO dates. start is first, end is last. */
export function monthsBetween(startDate: string, endDate: string): number {
  const [startYear, startMonth] = startDate.split('-').map(Number);
  const [endYear, endMonth] = endDate.split('-').map(Number);
  if (!startYear || !startMonth || !endYear || !endMonth) {
    return 0;
  }
  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

/** Add months to an ISO date, returning the new ISO date */
export function addMonths(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    return dateStr;
  }
  const totalMonths = (year * 12 + (month - 1)) + months;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  const lastDay = new Date(newYear, newMonth, 0).getDate();
  const clampedDay = Math.min(day, lastDay);
  const mm = String(newMonth).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return `${newYear}-${mm}-${dd}`;
}

/** ISO date string for the current period key (YYYY-MM) */
export function currentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Compute number of amortization periods between two dates */
export function amortizationPeriodCount(
  startDate: string,
  termYears: number,
): number {
  return termYears * 12;
}
