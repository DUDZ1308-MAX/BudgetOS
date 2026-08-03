import { calculateNextRun } from '@/lib/finance/recurring';
import type {
  CalendarEvent,
  DailyForecast,
} from '@/lib/dashboard/types';
import type {
  CashFlowForecast,
  ForecastMortgageInput,
  ForecastRangeSummary,
  ForecastRecurringInput,
  ForecastSavingsInput,
  ForecastTransactionInput,
  ForecastWarning,
  ForecastWindow,
} from '@/lib/forecast/types';

// ============================================================================
// Date helpers (local-time, YYYY-MM-DD)
// ============================================================================

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, m! - 1, d ?? 1);
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function todayKey(): string {
  return toDateKey(new Date());
}

// ============================================================================
// Recurring expansion — uses the existing calculateNextRun scheduling SSOT.
// Chains forward from next_run to project every occurrence in the window,
// including multiple occurrences per month (biweekly, semimonthly, weekly).
// ============================================================================

export function expandRecurring(
  recurring: ForecastRecurringInput,
  startDate: string,
  endDate: string,
): string[] {
  if (recurring.status !== 'active') return [];
  if (!recurring.nextRun && !recurring.startDate) return [];

  const dates: string[] = [];
  let cursor = recurring.nextRun ?? recurring.startDate;
  let guard = 0;

  while (guard < 600) {
    if (cursor < startDate) {
      const nextCursor = calculateNextRun({
        startDate: recurring.startDate,
        endDate: recurring.endDate,
        frequency: recurring.frequency as never,
        intervalCount: recurring.intervalCount || 1,
        dayOfWeek: recurring.dayOfWeek,
        dayOfMonth: recurring.dayOfMonth,
        monthOfYear: recurring.monthOfYear,
        lastRun: cursor,
      });
      if (nextCursor === cursor) break;
      cursor = nextCursor;
      guard += 1;
      continue;
    }
    if (cursor > endDate) break;
    dates.push(cursor);

    const nextCursor = calculateNextRun({
      startDate: recurring.startDate,
      endDate: recurring.endDate,
      frequency: recurring.frequency as never,
      intervalCount: recurring.intervalCount || 1,
      dayOfWeek: recurring.dayOfWeek,
      dayOfMonth: recurring.dayOfMonth,
      monthOfYear: recurring.monthOfYear,
      lastRun: cursor,
    });
    if (nextCursor === cursor || nextCursor <= cursor) break;
    cursor = nextCursor;
    guard += 1;
  }

  return dates;
}

// ============================================================================
// Event builder — actual posted transactions + projected recurring / mortgage /
// savings occurrences. Projected events are clearly marked (status, isForecast)
// and are never mistaken for actual activity.
// ============================================================================

interface BuildEventsInput {
  transactions: ForecastTransactionInput[];
  recurrings: ForecastRecurringInput[];
  savingsGoals: ForecastSavingsInput[];
  mortgages: ForecastMortgageInput[];
  categories?: Array<{ id: string; name: string }>;
  startDate: string;
  endDate: string;
}

function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

function forEachMonth(startDate: string, endDate: string, cb: (year: number, month: number) => void): void {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  let year = start.getFullYear();
  let month = start.getMonth();
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();
  let guard = 0;
  while ((year < endYear || (year === endYear && month <= endMonth)) && guard < 60) {
    cb(year, month);
    month += 1;
    if (month === 12) {
      month = 0;
      year += 1;
    }
    guard += 1;
  }
}

export function buildForecastEvents(input: BuildEventsInput): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const categoryMap = new Map((input.categories ?? []).map((c) => [c.id, c.name]));
  const postedByRecurring = new Map<string, Set<string>>();

  // --- Actual posted transactions ------------------------------------------
  for (const t of input.transactions) {
    if (t.isArchived) continue;
    if (t.date < input.startDate || t.date > input.endDate) continue;
    if (t.recurringId) {
      const set = postedByRecurring.get(t.recurringId) ?? new Set<string>();
      set.add(t.date);
      postedByRecurring.set(t.recurringId, set);
    }
    events.push({
      id: `txn-${t.id}`,
      title: t.merchant ?? 'Transaction',
      date: t.date,
      amount: Math.abs(Number(t.amount)),
      type: Number(t.amount) >= 0 ? 'income' : 'expense',
      category: categoryMap.get(t.categoryId ?? '') ?? 'Uncategorized',
      source: t.recurringId ? 'recurring' : 'transaction',
      status: 'actual',
      isForecast: false,
      sourceId: t.id,
      accountId: t.accountId ?? undefined,
      categoryId: t.categoryId ?? undefined,
    });
  }

  // --- Projected recurring occurrences -------------------------------------
  for (const r of input.recurrings) {
    if (r.status !== 'active') continue;
    const posted = postedByRecurring.get(r.id);
    const dates = expandRecurring(r, input.startDate, input.endDate);
    for (const date of dates) {
      if (posted?.has(date)) continue;
      events.push({
        id: `rec-${r.id}-${date}`,
        title: r.name,
        date,
        amount: Math.abs(Number(r.amount)),
        type: r.type === 'income' ? 'income' : 'expense',
        category: 'recurring',
        source: 'recurring',
        status: 'projected',
        isForecast: true,
        sourceId: r.id,
        frequency: r.frequency,
      });
    }
  }

  // --- Projected mortgage payments (monthly, respecting start day) ---------
  for (const m of input.mortgages) {
    if (m.remainingBalance <= 0) continue;
    const payDay = m.startDate ? parseDateKey(m.startDate).getDate() : 1;
    forEachMonth(input.startDate, input.endDate, (year, month) => {
      const day = clampDay(year, month + 1, payDay);
      const date = toDateKey(new Date(year, month, day));
      if (date < input.startDate || date > input.endDate) return;
      events.push({
        id: `mort-${m.id}-${date}`,
        title: `${m.name} Payment`,
        date,
        amount: m.monthlyPayment,
        type: 'mortgage',
        category: 'mortgage',
        source: 'mortgage',
        status: 'projected',
        isForecast: true,
        sourceId: m.id,
        mortgageId: m.id,
        frequency: m.paymentFrequency,
      });
    });
  }

  // --- Projected savings contributions (monthly, day 1) ---------------------
  for (const g of input.savingsGoals) {
    if (g.isCompleted || g.monthlyContribution <= 0) continue;
    forEachMonth(input.startDate, input.endDate, (year, month) => {
      const date = toDateKey(new Date(year, month, 1));
      if (date < input.startDate || date > input.endDate) return;
      events.push({
        id: `sav-${g.id}-${date}`,
        title: `${g.name} Contribution`,
        date,
        amount: g.monthlyContribution,
        type: 'contribution',
        category: 'savings',
        source: 'savings',
        status: 'projected',
        isForecast: true,
        sourceId: g.id,
        goalId: g.id,
      });
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

// ============================================================================
// Daily series + range summaries
// ============================================================================

export function buildDailySeries(
  events: CalendarEvent[],
  startingBalance: number,
  days: number,
  asOfDate: string,
): Array<{ date: string; balance: number; netChange: number }> {
  const points: Array<{ date: string; balance: number; netChange: number }> = [];
  let running = startingBalance;
  for (let i = 0; i < days; i++) {
    const date = addDays(asOfDate, i);
    let netChange = 0;
    for (const e of events) {
      if (e.date === date) {
        netChange += e.type === 'income' ? e.amount : -e.amount;
      }
    }
    running += netChange;
    points.push({ date, balance: running, netChange });
  }
  return points;
}

export function computeRangeSummary(
  events: CalendarEvent[],
  startingBalance: number,
  window: ForecastWindow,
  asOfDate: string,
): ForecastRangeSummary {
  const startDate = asOfDate;
  const endDate = addDays(asOfDate, window - 1);
  const windowEvents = events.filter((e) => e.date >= startDate && e.date <= endDate);

  const income = windowEvents.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const expenses = windowEvents.filter((e) => e.type !== 'income').reduce((s, e) => s + e.amount, 0);

  let running = startingBalance;
  let lowest = startingBalance;
  let lowestBalanceDate: string | null = null;
  let daysBelowZero = 0;

  for (let i = 0; i < window; i++) {
    const date = addDays(asOfDate, i);
    let netChange = 0;
    for (const e of windowEvents) {
      if (e.date === date) netChange += e.type === 'income' ? e.amount : -e.amount;
    }
    running += netChange;
    if (running < lowest) {
      lowest = running;
      lowestBalanceDate = date;
    }
    if (running < 0) daysBelowZero += 1;
  }

  return {
    window,
    startDate,
    endDate,
    startingBalance,
    income,
    expenses,
    netCashFlow: income - expenses,
    endingBalance: running,
    lowestBalance: lowest,
    lowestBalanceDate,
    daysBelowZero,
    events: windowEvents,
  };
}

export function generateWarnings(
  ranges: Partial<Record<ForecastWindow, ForecastRangeSummary>>,
  availableCash: number,
): ForecastWarning[] {
  const warnings: ForecastWarning[] = [];
  const windows: ForecastWindow[] = [30, 60, 90];

  for (const window of windows) {
    const range = ranges[window];
    if (!range) continue;
    if (range.lowestBalance < 0) {
      warnings.push({
        id: `overdraft-${window}`,
        severity: 'critical',
        title: 'Overdraft risk in next 90 days',
        message: `Balance is projected to drop to ${formatMoney(range.lowestBalance)} on ${formatDate(range.lowestBalanceDate)} within the next ${window} days.`,
        date: range.lowestBalanceDate,
      });
    } else if (availableCash > 0 && range.lowestBalance < availableCash * 0.15) {
      warnings.push({
        id: `low-balance-${window}`,
        severity: 'warning',
        title: 'Low balance ahead',
        message: `Balance dips to ${formatMoney(range.lowestBalance)} within the next ${window} days. Consider delaying discretionary spending.`,
        date: range.lowestBalanceDate,
      });
    }
  }

  if (warnings.length === 0) {
    warnings.push({
      id: 'healthy',
      severity: 'info',
      title: 'Cash flow looks healthy',
      message: 'No overdrafts or low-balance periods are projected in the next 90 days.',
      date: null,
    });
  }

  return warnings;
}

function formatMoney(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(key: string | null): string {
  if (!key) return 'the end of the period';
  const d = parseDateKey(key);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// Orchestrator — single computation for 30/60/90-day horizons.
// Pure: no I/O, fully deterministic when asOfDate is supplied.
// ============================================================================

export interface CashFlowForecastInput {
  asOfDate?: string;
  availableCash: number;
  transactions: ForecastTransactionInput[];
  recurrings: ForecastRecurringInput[];
  savingsGoals: ForecastSavingsInput[];
  mortgages: ForecastMortgageInput[];
  categories?: Array<{ id: string; name: string }>;
  windows?: ForecastWindow[];
}

export function computeCashFlowForecast(input: CashFlowForecastInput): CashFlowForecast {
  const asOfDate = input.asOfDate ?? todayKey();
  const windows: ForecastWindow[] = input.windows ?? [30, 60, 90];
  const endDate = addDays(asOfDate, 89);

  const events = buildForecastEvents({
    transactions: input.transactions,
    recurrings: input.recurrings,
    savingsGoals: input.savingsGoals,
    mortgages: input.mortgages,
    categories: input.categories,
    startDate: asOfDate,
    endDate,
  });

  const daily = buildDailySeries(events, input.availableCash, 90, asOfDate);

  const ranges: Partial<Record<ForecastWindow, ForecastRangeSummary>> = {};
  for (const window of windows) {
    ranges[window] = computeRangeSummary(events, input.availableCash, window, asOfDate);
  }

  const warnings = generateWarnings(ranges, input.availableCash);

  return {
    asOfDate,
    availableCash: input.availableCash,
    daily,
    ranges,
    warnings,
    eventCount: events.length,
    recurringCount: input.recurrings.filter((r) => r.status === 'active').length,
    mortgageCount: input.mortgages.filter((m) => m.remainingBalance > 0).length,
    savingsCount: input.savingsGoals.filter((g) => !g.isCompleted && g.monthlyContribution > 0).length,
  };
}

// ============================================================================
// Backward-compatible summary for the calendar sidebar — derives a DailyForecast
// array (compatible with the existing ForecastSidebar) from the forecast events.
// ============================================================================

export function toDailyForecast(
  daily: Array<{ date: string; balance: number; netChange: number }>,
  events: CalendarEvent[],
): DailyForecast[] {
  let running = 0;
  return daily.map((point) => {
    const openingBalance = running;
    const dayEvents = events.filter((e) => e.date === point.date);
    const moneyIn = dayEvents.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const moneyOut = dayEvents.filter((e) => e.type !== 'income').reduce((s, e) => s + e.amount, 0);
    running = point.balance;
    return {
      date: point.date,
      openingBalance,
      moneyIn,
      moneyOut,
      endingBalance: point.balance,
      events: dayEvents,
    };
  });
}
