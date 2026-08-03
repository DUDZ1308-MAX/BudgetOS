import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import { useCalendarData } from './useCalendarData';
import { useForecastData } from './useForecastData';
import { CalendarGrid } from './components/CalendarGrid';
import { ForecastSidebar } from './components/ForecastSidebar';
import { CashFlowForecastPanel } from './components/CashFlowForecastPanel';
import type { CalendarEvent } from '@/lib/dashboard/types';

type EventFilter = 'all' | 'income' | 'expense' | 'mortgage' | 'savings' | 'recurring';

const FILTERS: Array<{ key: EventFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expenses' },
  { key: 'mortgage', label: 'Mortgage' },
  { key: 'savings', label: 'Savings' },
  { key: 'recurring', label: 'Recurring' },
];

function eventKey(e: CalendarEvent): string {
  return e.status === 'projected' && e.sourceId ? `${e.source}|${e.sourceId}|${e.date}` : e.id;
}

export function CalendarPage() {
  const user = useAuthStore((s) => s.user);
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().slice(0, 10));
  const [filter, setFilter] = useState<EventFilter>('all');
  const [showProjected, setShowProjected] = useState(true);

  const { data, isLoading, isError } = useCalendarData(user?.id, currentYear, currentMonth);
  const { data: forecast, isLoading: forecastLoading } = useForecastData(user?.id);

  const monthLabel = useMemo(
    () =>
      new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [currentYear, currentMonth],
  );

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const mergedEvents = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, CalendarEvent>();
    for (const e of data.events) map.set(eventKey(e), e);
    // Merge multi-occurrence projected events (biweekly, semimonthly, etc.)
    // from the 90-day forecast into the displayed month, deduped per occurrence.
    for (const e of forecast?.ranges[90]?.events ?? []) {
      if (e.status !== 'projected') continue;
      if (!e.date.startsWith(monthKey)) continue;
      const key = eventKey(e);
      if (!map.has(key)) map.set(key, e);
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [data, forecast, monthKey]);

  const filteredEvents = useMemo(
    () =>
      mergedEvents.filter((e) => {
        if (!showProjected && e.status === 'projected') return false;
        if (filter === 'all') return true;
        if (filter === 'recurring') return e.source === 'recurring';
        if (filter === 'mortgage') return e.type === 'mortgage';
        if (filter === 'savings') return e.source === 'savings';
        return e.type === filter;
      }),
    [mergedEvents, filter, showProjected],
  );

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 0) { setCurrentYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 11) { setCurrentYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now.toISOString().slice(0, 10));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Financial Calendar</h1>
          <p className="text-xs text-gray-400 mt-1 sm:text-sm">
            Forecast your cash flow and stay ahead of upcoming bills
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPrevMonth}
            className="p-1.5 text-gray-400 hover:text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-white text-center sm:text-lg min-w-0 sm:min-w-[180px]">{monthLabel}</h2>
          <button
            onClick={goToNextMonth}
            className="p-1.5 text-gray-400 hover:text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-400">Failed to load calendar data</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    filter === f.key
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showProjected}
                onChange={(e) => setShowProjected(e.target.checked)}
                className="accent-cyan-400 w-3.5 h-3.5"
              />
              Show projected events
              <span className="hidden sm:inline text-gray-600">(dashed = projected)</span>
            </label>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            <div className="flex-1 min-w-0">
              <CalendarGrid
                year={currentYear}
                month={currentMonth}
                events={filteredEvents}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>
            <ForecastSidebar
              dailyForecast={data?.forecast ?? []}
              monthlyForecast={data?.monthlyForecast ?? {
                year: currentYear,
                month: currentMonth,
                income: 0, expenses: 0, savings: 0, debtPayments: 0, mortgage: 0,
                budgetRemaining: 0, projectedNetWorthChange: 0,
                lowestBalance: 0, highestBalance: 0, netCashFlow: 0,
              }}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* Cash Flow Forecast */}
          <CashFlowForecastPanel data={forecast} isLoading={forecastLoading} />
        </div>
      )}
    </motion.div>
  );
}
