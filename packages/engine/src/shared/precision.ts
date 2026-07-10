/**
 * Currency precision utilities.
 * All internal calculations use integer cents to avoid floating-point drift.
 */

/** Convert dollars to cents (multiply by 100, round) */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert cents to dollars */
export function toDollars(cents: number): number {
  return cents / 100;
}

/** Format cents as a USD string */
export function formatCents(cents: number): string {
  const dollars = toDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/** Format a percentage string */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to a given number of decimal places */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
