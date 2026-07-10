import { describe, it, expect } from 'vitest';
import { monthsBetween, addMonths, currentMonthKey, amortizationPeriodCount } from '../date';

describe('monthsBetween', () => {
  it('calculates months correctly', () => {
    expect(monthsBetween('2024-01-01', '2024-06-01')).toBe(5);
  });

  it('returns 0 for same month', () => {
    expect(monthsBetween('2024-01-15', '2024-01-20')).toBe(0);
  });

  it('handles year boundary', () => {
    expect(monthsBetween('2023-12-01', '2024-01-01')).toBe(1);
  });

  it('returns 0 for invalid dates', () => {
    expect(monthsBetween('bad', '2024-06-01')).toBe(0);
  });
});

describe('addMonths', () => {
  it('adds months correctly', () => {
    expect(addMonths('2024-01-01', 1)).toBe('2024-02-01');
  });

  it('handles year rollover', () => {
    expect(addMonths('2024-12-01', 1)).toBe('2025-01-01');
  });

  it('clamps day for short months', () => {
    const result = addMonths('2024-01-31', 1);
    expect(result).toBe('2024-02-29');
  });

  it('adds 0 months returns same date', () => {
    expect(addMonths('2024-06-15', 0)).toBe('2024-06-15');
  });

  it('returns original for invalid input', () => {
    expect(addMonths('bad', 1)).toBe('bad');
  });
});

describe('currentMonthKey', () => {
  it('returns YYYY-MM format', () => {
    const key = currentMonthKey();
    expect(key).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe('amortizationPeriodCount', () => {
  it('returns term * 12', () => {
    expect(amortizationPeriodCount('2024-01-01', 30)).toBe(360);
  });
});
