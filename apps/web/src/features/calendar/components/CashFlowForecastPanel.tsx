import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CashFlowForecast, ForecastRangeSummary, ForecastWarning, ForecastWindow } from '@/lib/forecast/types';

interface CashFlowForecastPanelProps {
  data?: CashFlowForecast;
  isLoading?: boolean;
}

const WINDOWS: ForecastWindow[] = [30, 60, 90];

function formatCurrency(n: number, fractionDigits = 0): string {
  return `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
}

const warningStyles: Record<ForecastWarning['severity'], string> = {
  critical: 'border-red-500/30 bg-red-500/10 text-red-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  info: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
};

function RangeCard({ summary, active, onSelect }: { summary: ForecastRangeSummary; active: boolean; onSelect: () => void }) {
  const positive = summary.netCashFlow >= 0;
  return (
    <button
      onClick={onSelect}
      className={`flex-1 min-w-[180px] text-left rounded-xl border p-4 transition-colors cursor-pointer ${
        active ? 'border-cyan-400/60 bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-300">{summary.window}-Day</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Forecast</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold text-white tabular-nums">{formatCurrency(summary.endingBalance)}</span>
        <span className={`text-xs font-semibold tabular-nums ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {positive ? '+' : ''}{formatCurrency(summary.netCashFlow)}
        </span>
      </div>
      <div className="mt-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Income</span>
          <span className="text-emerald-400 font-medium tabular-nums">{formatCurrency(summary.income)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Expenses</span>
          <span className="text-red-400 font-medium tabular-nums">{formatCurrency(summary.expenses)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Lowest balance</span>
          <span className={`font-medium tabular-nums ${summary.lowestBalance < 0 ? 'text-red-400' : 'text-gray-200'}`}>
            {formatCurrency(summary.lowestBalance)}
          </span>
        </div>
        {summary.daysBelowZero > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Days below zero</span>
            <span className="text-red-400 font-medium tabular-nums">{summary.daysBelowZero}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]!.value;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 shadow-lg">
      <p className="mb-0.5 text-xs text-gray-400">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${value < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(value, 2)}</p>
    </div>
  );
}

export function CashFlowForecastPanel({ data, isLoading }: CashFlowForecastPanelProps) {
  const [activeWindow, setActiveWindow] = useState<ForecastWindow>(30);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.daily.slice(0, activeWindow).map((point, i) => ({
      date: new Date(point.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      balance: Math.round(point.balance),
      isLast: i === activeWindow - 1,
    }));
  }, [data, activeWindow]);

  if (isLoading) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <div className="h-4 w-48 bg-white/10 rounded animate-pulse mb-4" />
        <div className="h-40 bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Cash Flow Forecast</h3>
            <p className="text-xs text-gray-500 mt-1">Projected balance over the next 30 days</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 p-0.5 opacity-50 pointer-events-none" aria-hidden="true">
            {WINDOWS.map((w) => (
              <span
                key={w}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  activeWindow === w ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400'
                }`}
              >
                {w}D
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] py-10 text-center">
          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-300">No forecast data yet</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Add accounts and transactions to see a projected cash flow forecast here. Demo mode shows the UI only — sign in to load your real data.
          </p>
        </div>
      </div>
    );
  }

  const summary = data.ranges[activeWindow];

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Cash Flow Forecast</h3>
            <p className="text-xs text-gray-500 mt-1">Projected balance over the next {activeWindow} days</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 p-0.5">
            {WINDOWS.map((w) => (
              <button
                key={w}
                onClick={() => setActiveWindow(w)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeWindow === w ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {w}D
              </button>
            ))}
          </div>
        </div>

        {/* Warning banners */}
        {data.warnings.map((w) => (
          <div key={w.id} className={`rounded-lg border px-3 py-2 mb-3 text-xs ${warningStyles[w.severity]}`}>
            <span className="font-semibold">{w.title}.</span> {w.message}
          </div>
        ))}

        {/* Chart */}
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
              <Area type="monotone" dataKey="balance" stroke="#22d3ee" strokeWidth={2} fill="url(#forecastGradient)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Range cards */}
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4 overflow-x-auto pb-1">
        {WINDOWS.map((w) => {
          const s = data.ranges[w];
          if (!s) return null;
          return <RangeCard key={w} summary={s} active={w === activeWindow} onSelect={() => setActiveWindow(w)} />;
        })}
      </div>

      {/* Event count footer */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-1 text-xs text-gray-500">
        <span>{data.eventCount} events projected</span>
        <span>{data.recurringCount} active recurring</span>
        {data.mortgageCount > 0 && <span>{data.mortgageCount} mortgage</span>}
        {data.savingsCount > 0 && <span>{data.savingsCount} savings goal</span>}
        <span className="text-gray-600">Projected events shown for planning only</span>
      </div>
    </div>
  );
}
