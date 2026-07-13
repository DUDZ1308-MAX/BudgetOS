import { describe, it, expect } from 'vitest';
import { calculateNextRun, getUpcoming, isDue, daysUntilNextRun, isRecurringDueToday } from '../recurring';
import type { ScheduleInput } from '../recurring';

const baseInput: ScheduleInput = {
  startDate: '2024-01-01',
  endDate: null,
  frequency: 'monthly',
  intervalCount: 1,
  dayOfWeek: null,
  dayOfMonth: null,
  monthOfYear: null,
  lastRun: null,
};

describe('calculateNextRun', () => {
  describe('daily', () => {
    it('returns start date when no lastRun', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'daily' });
      expect(result).toBe('2024-01-01');
    });
    it('returns next day after last run', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'daily', lastRun: '2024-01-01' });
      expect(result).toBe('2024-01-02');
    });
    it('respects intervalCount', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'daily', intervalCount: 3, lastRun: '2024-01-01' });
      expect(result).toBe('2024-01-04');
    });
  });

  describe('weekly', () => {
    it('returns 7 days after start', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'weekly', lastRun: '2024-01-01' });
      expect(result).toBe('2024-01-08');
    });
    it('respects intervalCount', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'weekly', intervalCount: 2, lastRun: '2024-01-01' });
      expect(result).toBe('2024-01-15');
    });
  });

  describe('biweekly', () => {
    it('returns 14 days after last run', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'biweekly', lastRun: '2024-01-01' });
      expect(result).toBe('2024-01-15');
    });
  });

  describe('monthly', () => {
    it('returns same day next month', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'monthly', lastRun: '2024-01-15' });
      expect(result).toBe('2024-02-15');
    });
    it('handles month-end correctly (Jan 31 -> Feb 28)', () => {
      const result = calculateNextRun({
        ...baseInput, frequency: 'monthly', dayOfMonth: 31, lastRun: '2024-01-31',
      });
      expect(result).toBe('2024-02-29');
    });
    it('handles month-end in non-leap year', () => {
      const result = calculateNextRun({
        ...baseInput, frequency: 'monthly', dayOfMonth: 31, lastRun: '2023-01-31',
      });
      expect(result).toBe('2023-02-28');
    });
    it('handles Dec to Jan transition', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'monthly', lastRun: '2024-12-01' });
      expect(result).toBe('2025-01-01');
    });
  });

  describe('quarterly', () => {
    it('returns 3 months after last run', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'quarterly', lastRun: '2024-01-15' });
      expect(result).toBe('2024-04-15');
    });
  });

  describe('semi_annual', () => {
    it('returns 6 months after last run', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'semi_annual', lastRun: '2024-01-15' });
      expect(result).toBe('2024-07-15');
    });
  });

  describe('yearly', () => {
    it('returns 1 year after last run', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'yearly', lastRun: '2024-01-15' });
      expect(result).toBe('2025-01-15');
    });
    it('uses dayOfMonth and monthOfYear when provided', () => {
      const result = calculateNextRun({
        ...baseInput, frequency: 'yearly', dayOfMonth: 25, monthOfYear: 12, lastRun: '2024-01-15',
      });
      expect(result).toBe('2025-12-25');
    });
  });

  describe('one_time', () => {
    it('always returns start date', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'one_time', lastRun: '2024-06-01' });
      expect(result).toBe('2024-01-01');
    });
  });

  describe('endDate clamping', () => {
    it('returns end date if next run exceeds it', () => {
      const result = calculateNextRun({
        ...baseInput, frequency: 'monthly', lastRun: '2024-11-01', endDate: '2024-12-15',
      });
      expect(result).toBe('2024-12-01');
    });
  });

  describe('leap year', () => {
    it('clamps Feb 29 to Feb 28 in non-leap year', () => {
      const result = calculateNextRun({ ...baseInput, frequency: 'yearly', dayOfMonth: 29, monthOfYear: 2, lastRun: '2024-02-29' });
      expect(result).toBe('2025-02-28');
    });
  });
});

describe('getUpcoming', () => {
  it('returns the next N occurrences', () => {
    const results = getUpcoming({ ...baseInput, frequency: 'daily' }, 5);
    expect(results).toHaveLength(5);
    expect(results[0]).toBe('2024-01-01');
    expect(results[1]).toBe('2024-01-02');
    expect(results[4]).toBe('2024-01-05');
  });
  it('stops at endDate', () => {
    const results = getUpcoming({ ...baseInput, frequency: 'daily', endDate: '2024-01-03' }, 10);
    expect(results).toHaveLength(3);
    expect(results).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
  });
});

describe('isDue', () => {
  it('returns true when nextRun is on or before asOf', () => {
    expect(isDue('2024-01-01', '2024-01-01')).toBe(true);
    expect(isDue('2024-01-01', '2024-01-02')).toBe(true);
  });
  it('returns false when nextRun is after asOf', () => {
    expect(isDue('2024-01-15', '2024-01-01')).toBe(false);
  });
});

describe('daysUntilNextRun', () => {
  it('returns 0 for past dates', () => {
    expect(daysUntilNextRun('2020-01-01')).toBe(0);
  });
});

describe('isRecurringDueToday', () => {
  it('returns true for today', () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    expect(isRecurringDueToday(`${y}-${m}-${d}`)).toBe(true);
  });
  it('returns false for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    expect(isRecurringDueToday(`${y}-${m}-${d}`)).toBe(false);
  });
});
