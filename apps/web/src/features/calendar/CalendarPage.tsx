import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import { useCalendarData } from './useCalendarData';
import { CalendarGrid } from './components/CalendarGrid';
import { ForecastSidebar } from './components/ForecastSidebar';

export function CalendarPage() {
  const user = useAuthStore((s) => s.user);
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().slice(0, 10));

  const { data, isLoading, isError } = useCalendarData(user?.id, currentYear, currentMonth);

  const monthLabel = useMemo(
    () =>
      new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [currentYear, currentMonth],
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
      className="p-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Calendar</h1>
          <p className="text-sm text-gray-400 mt-1">
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
          <h2 className="text-lg font-semibold text-white min-w-[180px] text-center">{monthLabel}</h2>
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
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <CalendarGrid
              year={currentYear}
              month={currentMonth}
              events={data?.events ?? []}
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
      )}
    </motion.div>
  );
}
