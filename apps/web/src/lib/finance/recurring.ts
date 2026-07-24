export type ScheduleFrequency = 'one_time' | 'daily' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';

export type BusinessDayAdjustment = 'none' | 'previous' | 'next' | 'nearest';

export interface ScheduleInput {
  startDate: string;
  endDate: string | null;
  frequency: ScheduleFrequency;
  intervalCount: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  monthOfYear: number | null;
  lastRun: string | null;
  skipWeekends?: boolean;
  businessDayAdjustment?: BusinessDayAdjustment;
  timezone?: string;
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

function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function toBusinessDay(date: Date, adjustment: BusinessDayAdjustment): Date {
  if (!isBusinessDay(date)) {
    switch (adjustment) {
      case 'previous': {
        let d = new Date(date);
        while (!isBusinessDay(d)) d.setDate(d.getDate() - 1);
        return d;
      }
      case 'next': {
        let d = new Date(date);
        while (!isBusinessDay(d)) d.setDate(d.getDate() + 1);
        return d;
      }
      case 'nearest': {
        const next = new Date(date);
        while (!isBusinessDay(next)) next.setDate(next.getDate() + 1);
        const prev = new Date(date);
        while (!isBusinessDay(prev)) prev.setDate(prev.getDate() - 1);
        const diffNext = Math.abs(next.getTime() - date.getTime());
        const diffPrev = Math.abs(prev.getTime() - date.getTime());
        return diffNext < diffPrev ? next : prev;
      }
      default:
        return date;
    }
  }
  return date;
}

export function calculateNextRun(input: ScheduleInput): string {
  const { startDate, endDate, frequency, intervalCount, dayOfWeek, dayOfMonth, monthOfYear, lastRun, skipWeekends, businessDayAdjustment } = input;

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
    case 'semimonthly': {
      const firstDate = dayOfMonth ?? 1;
      const dim = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
      const secondDate = Math.min(firstDate + 14, dim);
      const lastDay = base.getDate();
      if (lastDay < secondDate) {
        next = normalizeDate(base.getFullYear(), base.getMonth(), secondDate);
      } else {
        next = normalizeDate(base.getFullYear(), base.getMonth() + intervalCount, firstDate);
      }
      break;
    }
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

  // Apply business day adjustment if requested
  if (businessDayAdjustment && businessDayAdjustment !== 'none') {
    next = toBusinessDay(next, businessDayAdjustment);
  } else if (skipWeekends) {
    next = toBusinessDay(next, 'next');
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

// ---------------------------------------------------------------------------
// Deterministic Occurrence ID — used for duplicate prevention
// Format: "<recurring_id>|<date>" — each recurring+date pair is unique
// ---------------------------------------------------------------------------
export function getOccurrenceId(recurringId: string, date: string): string {
  return `${recurringId}|${date}`;
}

export async function checkDuplicateOccurrence(
  supabaseClient: any,
  recurringId: string,
  date: string,
): Promise<boolean> {
  const { data } = await supabaseClient
    .from('transactions')
    .select('id')
    .eq('recurring_id', recurringId)
    .eq('date', date)
    .maybeSingle();
  return !!data;
}
