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

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function normalizeDate(year: number, month: number, day: number): Date {
  const d = new Date(year, month, day);
  if (d.getDate() !== day) {
    return new Date(year, month + 1, 0);
  }
  return d;
}

export function calculateNextRun(input: ScheduleInput): string {
  const { startDate, endDate, frequency, intervalCount, dayOfWeek, dayOfMonth, monthOfYear, lastRun } = input;

  if (!lastRun) {
    return startDate;
  }

  const base = new Date(lastRun + 'T00:00:00');
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
        next = normalizeDate(base.getFullYear(), base.getMonth() + intervalCount, dayOfMonth);
      } else {
        next = normalizeDate(base.getFullYear(), base.getMonth() + intervalCount, base.getDate());
      }
      break;
    case 'quarterly':
      next = normalizeDate(base.getFullYear(), base.getMonth() + 3 * intervalCount, base.getDate());
      break;
    case 'semi_annual':
      next = normalizeDate(base.getFullYear(), base.getMonth() + 6 * intervalCount, base.getDate());
      break;
    case 'yearly':
      if (dayOfMonth !== null && monthOfYear !== null) {
        next = normalizeDate(base.getFullYear() + intervalCount, monthOfYear - 1, dayOfMonth);
      } else {
        next = normalizeDate(base.getFullYear() + intervalCount, base.getMonth(), base.getDate());
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
  return calculateNextRun({ ...input, lastRun: runDate });
}

export function isDue(nextRun: string, asOf: string = todayISO()): boolean {
  return nextRun <= asOf;
}

export function getUpcoming(input: ScheduleInput, count: number): string[] {
  const dates: string[] = [];
  const endDate = input.endDate;
  let current = { ...input, endDate: undefined as any };
  for (let i = 0; i < count; i++) {
    const next = calculateNextRun(current);
    if (endDate && next.localeCompare(endDate) > 0) break;
    if (dates.includes(next)) break;
    dates.push(next);
    current = { ...current, lastRun: next };
  }
  return dates;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysUntilNextRun(nextRun: string): number {
  const now = new Date();
  const next = new Date(nextRun + 'T00:00:00');
  const diff = next.getTime() - now.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function isRecurringDueToday(nextRun: string): boolean {
  return nextRun === todayISO();
}
