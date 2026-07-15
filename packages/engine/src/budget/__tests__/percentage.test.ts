import { describe, it, expect } from 'vitest';
import { computeCategoryStatus, computeWeightedAdherence } from '../percentage';

describe('computeCategoryStatus', () => {
  it('returns "under" for low usage (< 80%)', () => {
    expect(computeCategoryStatus(50)).toBe('under');
  });

  it('returns "on_track" at 80%', () => {
    expect(computeCategoryStatus(80)).toBe('on_track');
  });

  it('returns "at_limit" at 100%', () => {
    expect(computeCategoryStatus(100)).toBe('at_limit');
  });

  it('returns "over" at 120%', () => {
    expect(computeCategoryStatus(120)).toBe('over');
  });

  it('returns "over" above 120%', () => {
    expect(computeCategoryStatus(150)).toBe('over');
  });

  it('returns "under" for 0%', () => {
    expect(computeCategoryStatus(0)).toBe('under');
  });

  it('returns "under" for negative (should not happen but handles gracefully)', () => {
    expect(computeCategoryStatus(-10)).toBe('under');
  });

  it('returns "on_track" just below 100% (99.99%)', () => {
    expect(computeCategoryStatus(99.99)).toBe('on_track');
  });

  it('returns "at_limit" exactly at 100%', () => {
    expect(computeCategoryStatus(100)).toBe('at_limit');
  });

  it('returns "over" exactly at 120%', () => {
    expect(computeCategoryStatus(120)).toBe('over');
  });

  it('returns "on_track" for 90%', () => {
    expect(computeCategoryStatus(90)).toBe('on_track');
  });

  it('returns "over" for 200% (double budget)', () => {
    expect(computeCategoryStatus(200)).toBe('over');
  });
});

describe('computeWeightedAdherence', () => {
  it('returns 100 when no categories', () => {
    expect(computeWeightedAdherence([])).toBe(100);
  });

  it('returns 100 when all categories are under budget', () => {
    const categories = [
      { categoryId: 'cat-1', budgeted: 1000_00, spent: 500_00, rolloverApplied: 0, available: 500_00, percentUsed: 50, status: 'under' },
      { categoryId: 'cat-2', budgeted: 500_00, spent: 200_00, rolloverApplied: 0, available: 300_00, percentUsed: 40, status: 'under' },
    ];
    const result = computeWeightedAdherence(categories);
    expect(result).toBe(100);
  });

  it('returns less than 100 when categories are overspent', () => {
    const categories = [
      { categoryId: 'cat-1', budgeted: 1000_00, spent: 1200_00, rolloverApplied: 0, available: -200_00, percentUsed: 120, status: 'over' },
    ];
    const result = computeWeightedAdherence(categories);
    expect(result).toBeLessThan(100);
  });

  it('weights larger budgets more heavily', () => {
    const categories1 = [
      { categoryId: 'cat-1', budgeted: 1000_00, spent: 1200_00, rolloverApplied: 0, available: -200_00, percentUsed: 120, status: 'over' },
      { categoryId: 'cat-2', budgeted: 100_00, spent: 50_00, rolloverApplied: 0, available: 50_00, percentUsed: 50, status: 'under' },
    ];
    const categories2 = [
      { categoryId: 'cat-1', budgeted: 100_00, spent: 120_00, rolloverApplied: 0, available: -20_00, percentUsed: 120, status: 'over' },
      { categoryId: 'cat-2', budgeted: 1000_00, spent: 500_00, rolloverApplied: 0, available: 500_00, percentUsed: 50, status: 'under' },
    ];
    const result1 = computeWeightedAdherence(categories1);
    const result2 = computeWeightedAdherence(categories2);
    expect(result1).toBeLessThan(result2);
  });

  it('returns 0 when all budget is overspent', () => {
    const categories = [
      { categoryId: 'cat-1', budgeted: 1000_00, spent: 2000_00, rolloverApplied: 0, available: -1000_00, percentUsed: 200, status: 'over' },
    ];
    const result = computeWeightedAdherence(categories);
    expect(result).toBe(0);
  });

  it('handles categories with zero budget', () => {
    const categories = [
      { categoryId: 'cat-1', budgeted: 0, spent: 0, rolloverApplied: 0, available: 0, percentUsed: 0, status: 'under' },
      { categoryId: 'cat-2', budgeted: 1000_00, spent: 500_00, rolloverApplied: 0, available: 500_00, percentUsed: 50, status: 'under' },
    ];
    const result = computeWeightedAdherence(categories);
    expect(result).toBe(100);
  });

  it('handles single category at exactly 100%', () => {
    const categories = [
      { categoryId: 'cat-1', budgeted: 1000_00, spent: 1000_00, rolloverApplied: 0, available: 0, percentUsed: 100, status: 'at_limit' },
    ];
    const result = computeWeightedAdherence(categories);
    expect(result).toBe(100);
  });

  it('handles mixed statuses', () => {
    const categories = [
      { categoryId: 'cat-1', budgeted: 1000_00, spent: 800_00, rolloverApplied: 0, available: 200_00, percentUsed: 80, status: 'on_track' },
      { categoryId: 'cat-2', budgeted: 500_00, spent: 600_00, rolloverApplied: 0, available: -100_00, percentUsed: 120, status: 'over' },
      { categoryId: 'cat-3', budgeted: 200_00, spent: 100_00, rolloverApplied: 0, available: 100_00, percentUsed: 50, status: 'under' },
    ];
    const result = computeWeightedAdherence(categories);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });
});
