import type { FinancialForecast } from '@/ai/types';

interface ForecastCardsProps {
  forecasts: FinancialForecast[];
}

const trendIcons = { up: '↑', down: '↓', stable: '→' };
const trendColors = { up: 'text-emerald-600', down: 'text-red-600', stable: 'text-slate-500' };

export function ForecastCards({ forecasts }: ForecastCardsProps) {
  if (forecasts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Forecasts</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {forecasts.slice(0, 4).map((fc) => (
          <div
            key={fc.type}
            className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{fc.title}</span>
              <span className={`text-lg font-bold ${trendColors[fc.trend]}`}>{trendIcons[fc.trend]}</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              ${fc.projected.toFixed(0)}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Current: ${fc.current.toFixed(0)}</span>
              <span>·</span>
              <span>{fc.confidence}% confidence</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{fc.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
