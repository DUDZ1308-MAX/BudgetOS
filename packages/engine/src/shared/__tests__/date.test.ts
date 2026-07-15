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

  it('handles multi-year spans (3 years)', () => {
    expect(monthsBetween('2021-01-01', '2024-01-01')).toBe(36);
  });

  it('handles 10-year span', () => {
    expect(monthsBetween('2014-06-15', '2024-06-15')).toBe(120);
  });

  it('handles reverse order (negative result)', () => {
    expect(monthsBetween('2024-06-01', '2024-01-01')).toBe(-5);
  });

  it('handles same year different months', () => {
    expect(monthsBetween('2024-03-01', '2024-09-01')).toBe(6);
  });

  it('handles full year (12 months)', () => {
    expect(monthsBetween('2024-01-01', '2025-01-01')).toBe(12);
  });

  it('handles 30-year mortgage span', () => {
    expect(monthsBetween('2024-01-01', '2054-01-01')).toBe(360);
  });

  it('handles partial months', () => {
    expect(monthsBetween('2024-01-15', '2024-02-20')).toBe(1);
  });

  it('handles leap year dates', () => {
    expect(monthsBetween('2024-02-29', '2024-03-29')).toBe(1);
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

  it('handles negative months (subtracting)', () => {
    expect(addMonths('2024-06-01', -1)).toBe('2024-05-01');
  });

  it('handles adding 12 months (1 year)', () => {
    expect(addMonths('2024-01-15', 12)).toBe('2025-01-15');
  });

  it('handles adding 24 months (2 years)', () => {
    expect(addMonths('2024-01-15', 24)).toBe('2026-01-15');
  });

  it('handles leap year Feb 29 to non-leap year', () => {
    expect(addMonths('2024-02-29', 12)).toBe('2025-02-28');
  });

  it('handles Jan 31 to February', () => {
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
  });

  it('handles Jan 31 to March', () => {
    expect(addMonths('2024-01-31', 2)).toBe('2024-03-31');
  });

  it('handles 30-year mortgage addition', () => {
    const result = addMonths('2024-01-01', 360);
    expect(result).toBe('2054-01-01');
  });

  it('handles subtraction across year boundary', () => {
    expect(addMonths('2025-01-01', -1)).toBe('2024-12-01');
  });

  it('handles large negative months', () => {
    expect(addMonths('2024-06-01', -24)).toBe('2022-06-01');
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

  it('handles 15-year term', () => {
    expect(amortizationPeriodCount('2024-01-01', 15)).toBe(180);
  });

  it('handles 10-year term', () => {
    expect(amortizationPeriodCount('2024-01-01', 10)).toBe(120);
  });

  it('handles 5-year term', () => {
    expect(amortizationPeriodCount('2024-01-01', 5)).toBe(60);
  });

  it('handles 1-year term', () => {
    expect(amortizationPeriodCount('2024-01-01', 1)).toBe(12);
  });

  it('handles 50-year term (maximum)', () => {
    expect(amortizationPeriodCount('2024-01-01', 50)).toBe(600);
  });

  it('ignores start date parameter', () => {
    expect(amortizationPeriodCount('2000-01-01', 30)).toBe(360);
    expect(amortizationPeriodCount('2024-06-15', 30)).toBe(360);
  });
});
