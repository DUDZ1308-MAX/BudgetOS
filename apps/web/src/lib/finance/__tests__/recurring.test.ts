import { describe, it, expect } from 'vitest';
import { calculateNextRun, getUpcoming, isDue, daysUntilNextRun, isRecurringDueToday, getOccurrenceId, checkDuplicateOccurrence } from '../recurring';
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

describe('semimonthly', () => {
  it('returns startDate when no lastRun', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', startDate: '2026-01-01', lastRun: null });
    expect(result).toBe('2026-01-01');
  });

  it('advances from 1st to 15th', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 1, lastRun: '2026-01-01' });
    expect(result).toBe('2026-01-15');
  });

  it('advances from 15th to 1st of next month', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 1, lastRun: '2026-01-15' });
    expect(result).toBe('2026-02-01');
  });

  it('handles February with dayOfMonth=1', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 1, lastRun: '2026-02-01' });
    expect(result).toBe('2026-02-15');
  });

  it('handles February 15th to March 1st', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 1, lastRun: '2026-02-15' });
    expect(result).toBe('2026-03-01');
  });

  it('handles Feb 28 with dayOfMonth=15 (second date clamped to month end)', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 15, lastRun: '2026-02-15' });
    // secondDate = min(29, 28) = 28
    expect(result).toBe('2026-02-28');
  });

  it('advances from clamped second date to next month first date', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 15, lastRun: '2026-02-28' });
    expect(result).toBe('2026-03-15');
  });

  it('handles year-end transition from Dec 15 to Jan 1', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 1, lastRun: '2026-12-15' });
    expect(result).toBe('2027-01-01');
  });

  it('handles leap year February second date (Feb 29)', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 15, lastRun: '2024-02-15' });
    // secondDate = min(29, 29) = 29
    expect(result).toBe('2024-02-29');
  });

  it('advances from leap year Feb 29 to March 15', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 15, lastRun: '2024-02-29' });
    expect(result).toBe('2024-03-15');
  });

  it('uses custom dayOfMonth for first date', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 10, lastRun: '2026-01-10' });
    const secondDate = Math.min(10 + 14, 31);
    expect(result).toBe(`2026-01-${secondDate}`);
  });

  it('advances from user start date between occurrences', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 1, lastRun: '2026-01-05' });
    expect(result).toBe('2026-01-15');
  });

  it('respects endDate', () => {
    const result = calculateNextRun({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 1, lastRun: '2026-01-15', endDate: '2026-01-20' });
    expect(result).toBe('2026-01-20');
  });

  it('getUpcoming returns correct semimonthly dates', () => {
    const results = getUpcoming({ ...baseInput, frequency: 'semimonthly', dayOfMonth: 1, startDate: '2026-01-01', lastRun: null }, 4);
    expect(results).toHaveLength(4);
    expect(results[0]).toBe('2026-01-01');
    expect(results[1]).toBe('2026-01-15');
    expect(results[2]).toBe('2026-02-01');
    expect(results[3]).toBe('2026-02-15');
  });
});

describe('skipWeekends and businessDayAdjustment', () => {
  it('skipWeekends advances Saturday to Monday', () => {
    const result = calculateNextRun({
      ...baseInput,
      frequency: 'daily',
      startDate: '2026-01-01',
      lastRun: '2026-01-09',
      skipWeekends: true,
    });
    // Jan 10 2026 is Saturday, so skip to Monday Jan 12
    expect(result).toBe('2026-01-12');
  });

  it('skipWeekends advances Sunday to Monday', () => {
    const result = calculateNextRun({
      ...baseInput,
      frequency: 'daily',
      startDate: '2026-01-01',
      lastRun: '2026-01-10',
      skipWeekends: true,
    });
    // Jan 11 2026 is Sunday, next run would be Jan 11 (Sun), advance to Jan 12 (Mon)
    expect(result).toBe('2026-01-12');
  });

  it('businessDayAdjustment previous moves Saturday to Friday', () => {
    const result = calculateNextRun({
      ...baseInput,
      frequency: 'daily',
      startDate: '2026-01-01',
      lastRun: '2026-01-09',
      businessDayAdjustment: 'previous',
    });
    // Jan 10 2026 is Saturday, adjust to previous Friday Jan 9
    expect(result).toBe('2026-01-09');
  });

  it('businessDayAdjustment next moves Saturday to Monday', () => {
    const result = calculateNextRun({
      ...baseInput,
      frequency: 'daily',
      startDate: '2026-01-01',
      lastRun: '2026-01-09',
      businessDayAdjustment: 'next',
    });
    expect(result).toBe('2026-01-12');
  });

  it('businessDayAdjustment nearest for Saturday picks Friday (closer than Monday)', () => {
    const result = calculateNextRun({
      ...baseInput,
      frequency: 'daily',
      startDate: '2026-01-01',
      lastRun: '2026-01-09',
      businessDayAdjustment: 'nearest',
    });
    // Saturday Jan 10, Friday Jan 9 is 1 day back, Monday Jan 12 is 2 days forward
    expect(result).toBe('2026-01-09');
  });

  it('does not affect weekday dates', () => {
    const result = calculateNextRun({
      ...baseInput,
      frequency: 'daily',
      startDate: '2026-01-01',
      lastRun: '2026-01-05',
      skipWeekends: true,
    });
    // Jan 6 2026 is Tuesday
    expect(result).toBe('2026-01-06');
  });
});

describe('getOccurrenceId', () => {
  it('generates deterministic ID from recurringId and date', () => {
    const id = getOccurrenceId('abc-123', '2026-01-15');
    expect(id).toBe('abc-123|2026-01-15');
  });

  it('produces different IDs for different dates', () => {
    const id1 = getOccurrenceId('abc-123', '2026-01-15');
    const id2 = getOccurrenceId('abc-123', '2026-02-15');
    expect(id1).not.toBe(id2);
  });

  it('produces different IDs for different recurrings same date', () => {
    const id1 = getOccurrenceId('abc-123', '2026-01-15');
    const id2 = getOccurrenceId('xyz-789', '2026-01-15');
    expect(id1).not.toBe(id2);
  });
});
