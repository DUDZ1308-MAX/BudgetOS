import { describe, it, expect } from 'vitest';
import { daysInMonth, daysBetween, parseDate, formatDateISO, sameMonth, isInRange, monthDiff, daysRemainingInMonth } from '../dates';

describe('daysInMonth', () => {
  it('returns 31 for January', () => {
    expect(daysInMonth(2024, 1)).toBe(31);
  });
  it('returns 29 for February in leap year', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });
  it('returns 28 for February in non-leap year', () => {
    expect(daysInMonth(2023, 2)).toBe(28);
  });
  it('returns 30 for April', () => {
    expect(daysInMonth(2024, 4)).toBe(30);
  });
});

describe('daysBetween', () => {
  it('returns 1 for same day', () => {
    expect(daysBetween('2024-01-01', '2024-01-01')).toBe(1);
  });
  it('returns 31 for Jan 1 to Jan 31', () => {
    expect(daysBetween('2024-01-01', '2024-01-31')).toBe(31);
  });
  it('handles year boundary', () => {
    expect(daysBetween('2023-12-31', '2024-01-01')).toBe(2);
  });
});

describe('parseDate', () => {
  it('parses YYYY-MM-DD correctly', () => {
    const d = parseDate('2024-03-15');
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
  });
});

describe('formatDateISO', () => {
  it('formats date to ISO string', () => {
    expect(formatDateISO(new Date(2024, 0, 1))).toBe('2024-01-01');
  });
  it('pads single-digit month and day', () => {
    expect(formatDateISO(new Date(2024, 11, 5))).toBe('2024-12-05');
  });
});

describe('sameMonth', () => {
  it('returns true for same month and year', () => {
    expect(sameMonth('2024-03-15', 2024, 3)).toBe(true);
  });
  it('returns false for different month', () => {
    expect(sameMonth('2024-03-15', 2024, 4)).toBe(false);
  });
  it('returns false for different year', () => {
    expect(sameMonth('2024-03-15', 2025, 3)).toBe(false);
  });
});

describe('isInRange', () => {
  it('returns true for date within range', () => {
    expect(isInRange('2024-01-15', '2024-01-01', '2024-01-31')).toBe(true);
  });
  it('returns false for date before range', () => {
    expect(isInRange('2023-12-31', '2024-01-01', '2024-01-31')).toBe(false);
  });
  it('returns false for date after range', () => {
    expect(isInRange('2024-02-01', '2024-01-01', '2024-01-31')).toBe(false);
  });
  it('handles inclusive boundaries', () => {
    expect(isInRange('2024-01-01', '2024-01-01', '2024-01-31')).toBe(true);
    expect(isInRange('2024-01-31', '2024-01-01', '2024-01-31')).toBe(true);
  });
});

describe('monthDiff', () => {
  it('returns 0 for same month', () => {
    expect(monthDiff('2024-01-01', '2024-01-31')).toBe(0);
  });
  it('returns 12 for one year', () => {
    expect(monthDiff('2024-01-01', '2025-01-01')).toBe(12);
  });
  it('returns 3 for quarter', () => {
    expect(monthDiff('2024-01-01', '2024-04-01')).toBe(3);
  });
});
