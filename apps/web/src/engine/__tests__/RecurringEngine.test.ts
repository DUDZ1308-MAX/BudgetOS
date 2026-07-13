import { describe, it, expect } from 'vitest';
import { calculateNextRun, getNextRunAfterRun, isDue, getUpcoming } from '../RecurringEngine';
import type { ScheduleInput } from '../RecurringEngine';

const baseInput: ScheduleInput = {
  startDate: '2026-01-15',
  endDate: null,
  frequency: 'monthly',
  intervalCount: 1,
  dayOfWeek: null,
  dayOfMonth: 15,
  monthOfYear: null,
  lastRun: null,
};

describe('RecurringEngine', () => {
  describe('calculateNextRun', () => {
    it('returns startDate for one_time frequency when no lastRun', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'one_time' });
      expect(result).toBe('2026-01-15');
    });

    it('returns startDate for one_time with explicit day', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'one_time', dayOfMonth: 20 });
      expect(result).toBe('2026-01-15');
    });

    it('calculates daily frequency', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'daily', startDate: '2026-01-01', lastRun: null });
      expect(result).toBe('2026-01-01');
    });

    it('advances daily from lastRun', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'daily', lastRun: '2026-01-01' });
      expect(result).toBe('2026-01-02');
    });

    it('calculates weekly frequency', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'weekly', startDate: '2026-01-05', lastRun: null });
      expect(result).toBe('2026-01-05');
    });

    it('advances weekly from lastRun', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'weekly', lastRun: '2026-01-05' });
      expect(result).toBe('2026-01-12');
    });

    it('calculates biweekly frequency', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'biweekly', lastRun: '2026-01-05' });
      expect(result).toBe('2026-01-19');
    });

    it('calculates monthly frequency with dayOfMonth', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'monthly', dayOfMonth: 15, lastRun: null, startDate: '2026-01-15' });
      expect(result).toBe('2026-01-15');
    });

    it('advances monthly with dayOfMonth', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'monthly', dayOfMonth: 15, lastRun: '2026-01-15' });
      expect(result).toBe('2026-02-15');
    });

    it('handles month-end dates correctly (Jan 31 -> Feb 28)', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'monthly', dayOfMonth: 31, lastRun: '2026-01-31' });
      expect(result).toBe('2026-02-28');
    });

    it('handles month-end dates in non-leap year Feb (Mar 3)', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'monthly', dayOfMonth: 31, lastRun: '2026-02-28' });
      expect(result).toBe('2026-03-31');
    });

    it('calculates quarterly frequency', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'quarterly', lastRun: '2026-01-15' });
      expect(result).toBe('2026-04-15');
    });

    it('calculates semi_annual frequency', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'semi_annual', lastRun: '2026-01-15' });
      expect(result).toBe('2026-07-15');
    });

    it('calculates yearly frequency with dayOfMonth and monthOfYear', () => {
      const result = calculateNextRun({
        ...baseInput,
        frequency: 'yearly',
        dayOfMonth: 1,
        monthOfYear: 1,
        lastRun: '2025-01-01',
      });
      expect(result).toBe('2026-01-01');
    });

    it('respects endDate - returns endDate if nextRun exceeds it', () => {
      const result = calculateNextRun({
        ...baseInput,
        frequency: 'monthly',
        dayOfMonth: 15,
        endDate: '2026-03-01',
        lastRun: '2026-02-15',
      });
      expect(result).toBe('2026-03-01');
    });

    it('handles year-end rollover', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'monthly', dayOfMonth: 15, lastRun: '2026-12-15' });
      expect(result).toBe('2027-01-15');
    });

    it('handles intervalCount > 1', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'monthly', intervalCount: 3, dayOfMonth: 15, lastRun: '2026-01-15' });
      expect(result).toBe('2026-04-15');
    });

    it('handles daily with intervalCount', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'daily', intervalCount: 7, lastRun: '2026-01-01' });
      expect(result).toBe('2026-01-08');
    });
  });

  describe('getNextRunAfterRun', () => {
    it('calculates next run based on explicit run date', () => {
      const result = getNextRunAfterRun({ ...baseInput, frequency: 'weekly' }, '2026-03-01');
      expect(result).toBe('2026-03-08');
    });
  });

  describe('isDue', () => {
    it('returns true when nextRun is before or on asOf', () => {
      expect(isDue('2026-01-01', '2026-01-01')).toBe(true);
      expect(isDue('2026-01-01', '2026-01-02')).toBe(true);
    });

    it('returns false when nextRun is after asOf', () => {
      expect(isDue('2026-01-05', '2026-01-01')).toBe(false);
    });
  });

  describe('getUpcoming', () => {
    it('returns requested number of upcoming dates', () => {
      const results = getUpcoming({
        ...baseInput,
        frequency: 'monthly',
        dayOfMonth: 15,
        startDate: '2026-01-15',
        lastRun: null,
      }, 3);
      expect(results).toHaveLength(3);
      expect(results[0]).toBe('2026-01-15');
      expect(results[1]).toBe('2026-02-15');
      expect(results[2]).toBe('2026-03-15');
    });

    it('respects endDate', () => {
      const results = getUpcoming({
        ...baseInput,
        frequency: 'monthly',
        dayOfMonth: 15,
        startDate: '2026-01-15',
        endDate: '2026-02-28',
        lastRun: null,
      }, 12);
      expect(results).toHaveLength(2);
    });

    it('returns empty array if startDate is after endDate', () => {
      const results = getUpcoming({
        ...baseInput,
        frequency: 'monthly',
        dayOfMonth: 15,
        startDate: '2026-06-15',
        endDate: '2026-01-15',
        lastRun: null,
      }, 3);
      expect(results).toHaveLength(0);
    });
  });
});
