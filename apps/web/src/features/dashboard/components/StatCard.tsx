import { memo } from 'react';
import { formatCurrency } from '@/services/transactionService';
import { SkeletonLoader } from './SkeletonLoader';

interface StatCardProps {
  label: string;
  value: number;
  isLoading: boolean;
  isCurrency?: boolean;
  accent?: 'default' | 'positive' | 'negative';
}

export const StatCard = memo(function StatCard({ label, value, isLoading, isCurrency = true, accent = 'default' }: StatCardProps) {
  const colorClass =
    accent === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : accent === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-slate-900 dark:text-white';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {isLoading ? (
        <div className="mt-2">
          <SkeletonLoader lines={1} className="w-2/3" />
        </div>
      ) : (
        <p className={`mt-1 text-2xl font-semibold tabular-nums ${colorClass}`}>
          {isCurrency ? formatCurrency(value) : value}
        </p>
      )}
    </div>
  );
});
