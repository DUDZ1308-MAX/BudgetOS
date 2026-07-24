import type { DailyForecast, MonthlyForecast } from '@/lib/dashboard/types';
import { EventChip } from './EventChip';

interface ForecastSidebarProps {
  dailyForecast: DailyForecast[];
  monthlyForecast: MonthlyForecast;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function ForecastSidebar({ dailyForecast, monthlyForecast, selectedDate, onSelectDate }: ForecastSidebarProps) {
  const selectedDayForecast = selectedDate
    ? dailyForecast.find((d) => d.date === selectedDate)
    : null;

  const formatCurrency = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col gap-4 w-80 shrink-0">
      {/* Monthly Forecast Card */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Monthly Forecast</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Income</span>
            <span className="text-emerald-400 font-medium">{formatCurrency(monthlyForecast.income)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Expenses</span>
            <span className="text-red-400 font-medium">{formatCurrency(monthlyForecast.expenses)}</span>
          </div>
          <div className="border-t border-white/10 pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 font-medium">Net Cash Flow</span>
              <span className={`font-semibold ${monthlyForecast.netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(monthlyForecast.netCashFlow)}
              </span>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Mortgage</span>
            <span className="text-violet-400 font-medium">{formatCurrency(monthlyForecast.mortgage)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Savings</span>
            <span className="text-blue-400 font-medium">{formatCurrency(monthlyForecast.savings)}</span>
          </div>
        </div>
      </div>

      {/* Daily Balance Range */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Balance Range</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Highest</span>
            <span className="text-emerald-400 font-medium">{formatCurrency(monthlyForecast.highestBalance)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Lowest</span>
            <span className="text-red-400 font-medium">{formatCurrency(monthlyForecast.lowestBalance)}</span>
          </div>
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDayForecast && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {new Date(selectedDayForecast.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h3>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Opening</span>
              <span className="text-gray-200 font-medium">{formatCurrency(selectedDayForecast.openingBalance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Money In</span>
              <span className="text-emerald-400 font-medium">{formatCurrency(selectedDayForecast.moneyIn)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Money Out</span>
              <span className="text-red-400 font-medium">{formatCurrency(selectedDayForecast.moneyOut)}</span>
            </div>
            <div className="border-t border-white/10 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300 font-medium">Ending</span>
                <span className={`font-semibold ${selectedDayForecast.endingBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(selectedDayForecast.endingBalance)}
                </span>
              </div>
            </div>
          </div>
          {selectedDayForecast.events.length > 0 && (
            <>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Events</h4>
              <div className="flex flex-col gap-1">
                {selectedDayForecast.events.map((e) => (
                  <EventChip key={e.id} event={e} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Quick Balance Forecast (mini sparkline days) */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">7-Day Outlook</h3>
        <div className="flex gap-1.5">
          {dailyForecast.slice(0, 7).map((day) => {
            const min = Math.min(...dailyForecast.slice(0, 7).map((d) => d.endingBalance));
            const max = Math.max(...dailyForecast.slice(0, 7).map((d) => d.endingBalance));
            const range = max - min || 1;
            const heightPct = ((day.endingBalance - min) / range) * 100;
            const isNegative = day.endingBalance < 0;

            return (
              <button
                key={day.date}
                onClick={() => onSelectDate(day.date)}
                className={`flex-1 flex flex-col items-center gap-1 p-1 rounded-lg transition-colors cursor-pointer
                  ${day.date === selectedDate ? 'bg-white/10 ring-1 ring-cyan-400' : 'hover:bg-white/5'}`}
              >
                <span className="text-[10px] text-gray-500 font-medium">
                  {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                </span>
                <div className="h-12 w-full relative flex items-end justify-center">
                  <div
                    className={`w-full rounded-sm transition-all ${
                      isNegative ? 'bg-red-500/60' : 'bg-emerald-500/60'
                    }`}
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                </div>
                <span className={`text-[10px] tabular-nums font-medium ${isNegative ? 'text-red-400' : 'text-gray-300'}`}>
                  ${Math.round(day.endingBalance).toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
