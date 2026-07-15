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
  icon?: React.ReactNode;
}

function TrendBadge({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const isUp = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
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

const accentStyles = {
  positive: {
    card: 'border-l-4 border-l-emerald-500',
    value: 'text-emerald-600 dark:text-emerald-400',
    icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  },
  negative: {
    card: 'border-l-4 border-l-red-500',
    value: 'text-red-600 dark:text-red-400',
    icon: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  },
  default: {
    card: 'border-l-4 border-l-brand-500',
    value: 'text-slate-900 dark:text-white',
    icon: 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400',
  },
};

export function StatCard({ label, value, previousValue, isLoading, isCurrency = true, accent = 'default', tooltip, icon }: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${styles.card}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.icon}`}>
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
              {tooltip && <InfoTooltip content={tooltip} />}
            </div>
            {isLoading ? (
              <div className="mt-2">
                <div className="h-8 w-24 skeleton" />
              </div>
            ) : (
              <p className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${styles.value}`}>
                {isCurrency ? formatCurrency(value) : value}
              </p>
            )}
          </div>
        </div>
        {!isLoading && previousValue !== undefined && (
          <TrendBadge current={value} previous={previousValue} />
        )}
      </div>
    </div>
  );
}
