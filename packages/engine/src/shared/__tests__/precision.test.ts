import { describe, it, expect } from 'vitest';
import { toCents, toDollars, formatCents, formatPercent, clamp, roundTo } from '../precision';

describe('precision utilities', () => {
  it('converts dollars to cents', () => {
    expect(toCents(10)).toBe(1000);
    expect(toCents(10.99)).toBe(1099);
    expect(toCents(0)).toBe(0);
    expect(toCents(-5.5)).toBe(-550);
  });

  it('converts cents to dollars', () => {
    expect(toDollars(1000)).toBe(10);
    expect(toDollars(1099)).toBe(10.99);
    expect(toDollars(0)).toBe(0);
    expect(toDollars(-550)).toBe(-5.5);
  });

  it('formats cents as USD string', () => {
    const result = formatCents(1099);
    expect(result).toContain('10.99');
    expect(result).toContain('$');
  });

  it('formats percentage', () => {
    expect(formatPercent(0.05)).toBe('5.0%');
    expect(formatPercent(0.125)).toBe('12.5%');
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('clamps values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('rounds to decimal places', () => {
    expect(roundTo(1.2345, 2)).toBe(1.23);
    expect(roundTo(1.2355, 2)).toBe(1.24);
    expect(roundTo(1.2345, 0)).toBe(1);
    expect(roundTo(1.2345, 3)).toBe(1.235);
  });
});
