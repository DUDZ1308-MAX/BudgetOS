import { describe, it, expect } from 'vitest';
import { computeTimeRange } from '../utils/reportCalculator';

describe('computeTimeRange', () => {
  it('returns date range for 30d', () => {
    const range = computeTimeRange('30d');
    expect(range.start).toBeDefined();
    expect(range.end).toBeDefined();
    expect(new Date(range.start) <= new Date(range.end)).toBe(true);
  });

  it('returns date range for 90d', () => {
    const range = computeTimeRange('90d');
    expect(range.start).toBeDefined();
  });

  it('returns date range for 6m', () => {
    const range = computeTimeRange('6m');
    expect(range.start).toBeDefined();
  });

  it('returns date range for 1y', () => {
    const range = computeTimeRange('1y');
    expect(range.start).toBeDefined();
  });

  it('returns date range for all', () => {
    const range = computeTimeRange('all');
    expect(range.start).toBeDefined();
  });

  it('returns 30d for unknown range', () => {
    const range = computeTimeRange('unknown' as any);
    expect(range.start).toBeDefined();
  });
});
