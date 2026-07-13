export type ScheduleFrequency = 'one_time' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';

export interface ScheduleInput {
  startDate: string;
  endDate: string | null;
  frequency: ScheduleFrequency;
  intervalCount: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  monthOfYear: number | null;
  lastRun: string | null;
}

export function calculateNextRun(input: ScheduleInput): string {
  const { startDate, endDate, frequency, intervalCount, dayOfWeek, dayOfMonth, monthOfYear, lastRun } = input;
  const base = lastRun ? new Date(lastRun + 'T00:00:00') : new Date(startDate + 'T00:00:00');
  const end = endDate ? new Date(endDate + 'T00:00:00') : null;

  let next: Date;

  switch (frequency) {
    case 'one_time':
      next = new Date(startDate + 'T00:00:00');
      break;
    case 'daily':
      next = addDays(base, intervalCount);
      break;
    case 'weekly':
      next = addDays(base, 7 * intervalCount);
      break;
    case 'biweekly':
      next = addDays(base, 14 * intervalCount);
      break;
    case 'monthly':
      if (dayOfMonth !== null) {
        next = new Date(base.getFullYear(), base.getMonth() + intervalCount, dayOfMonth);
        if (next.getDate() !== dayOfMonth) {
          next = new Date(base.getFullYear(), base.getMonth() + intervalCount + 1, 0);
        }
      } else {
        next = new Date(base.getFullYear(), base.getMonth() + intervalCount, base.getDate());
      }
      break;
    case 'quarterly':
      next = new Date(base.getFullYear(), base.getMonth() + 3 * intervalCount, base.getDate());
      break;
    case 'semi_annual':
      next = new Date(base.getFullYear(), base.getMonth() + 6 * intervalCount, base.getDate());
      break;
    case 'yearly':
      if (dayOfMonth !== null && monthOfYear !== null) {
        next = new Date(base.getFullYear() + intervalCount, monthOfYear - 1, dayOfMonth);
      } else {
        next = new Date(base.getFullYear() + intervalCount, base.getMonth(), base.getDate());
      }
      break;
    default:
      next = new Date(startDate + 'T00:00:00');
  }

  if (end && next > end) {
    return end.toISOString().split('T')[0] ?? '';
  }

  return next.toISOString().split('T')[0] ?? '';
}

export function getNextRunAfterRun(input: ScheduleInput, runDate: string): string {
  return calculateNextRun({
    ...input,
    lastRun: runDate,
  });
}

export function isDue(nextRun: string, asOf: string = todayString()): boolean {
  return nextRun <= asOf;
}

export function getUpcoming(input: ScheduleInput, count: number): string[] {
  const dates: string[] = [];
  let current = { ...input };
  for (let i = 0; i < count; i++) {
    const next = calculateNextRun(current);
    if (current.endDate && next.localeCompare(current.endDate) > 0) break;
    dates.push(next);
    current = { ...current, lastRun: next };
  }
  return dates;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function todayString(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}
