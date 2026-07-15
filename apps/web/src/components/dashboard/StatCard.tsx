import { formatCurrency } from '@/services/transactionService';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface StatCardProps {
  label: string;
  value: number;
  previousValue?: number;
  isLoading: boolean;
  isCurrency?: boolean;
  accent?: 'default' | 'positive' | 'negative';
  tooltip?: string;
}

function TrendBadge({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const isUp = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isUp
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
      }`}
    >
      <svg
        className={`h-3 w-3 ${isUp ? '' : 'rotate-180'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export function StatCard({ label, value, previousValue, isLoading, isCurrency = true, accent = 'default', tooltip }: StatCardProps) {
  const colorClass =
    accent === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : accent === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-slate-900 dark:text-white';

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Subtle gradient accent bar on top */}
      <span
        className={`absolute inset-x-0 top-0 h-0.5 ${
          accent === 'positive'
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            : accent === 'negative'
              ? 'bg-gradient-to-r from-red-400 to-red-500'
              : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
        }`}
      />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        {!isLoading && previousValue !== undefined && (
          <TrendBadge current={value} previous={previousValue} />
        )}
      </div>
      {isLoading ? (
        <div className="mt-2">
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
      ) : (
        <p className={`mt-1.5 text-2xl font-bold tabular-nums tracking-tight ${colorClass}`}>
          {isCurrency ? formatCurrency(value) : value}
        </p>
      )}
    </div>
  );
}
