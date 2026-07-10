import { SkeletonLoader } from './SkeletonLoader';
import { formatCurrency } from '@/services/transactionService';
import type { CategoryBudgetStatus } from '@/lib/dashboard/types';

interface BudgetSummaryCardProps {
  budgets: CategoryBudgetStatus[];
  isLoading: boolean;
}

export function BudgetSummaryCard({ budgets, isLoading }: BudgetSummaryCardProps) {
  const onTrack = budgets.filter((b) => b.percentUsed <= 100).length;
  const overBudget = budgets.filter((b) => b.percentUsed > 100).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Budget Utilization {budgets.length > 0 && `(${onTrack} on track, ${overBudget} over)`}
        </h3>
      </div>
      <div className="px-5 py-3">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <SkeletonLoader lines={1} className="w-full" />
              </div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">No budgets set for this month.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {budgets.map((b) => {
              const isOver = b.percentUsed > 100;
              return (
                <div key={b.categoryId} className="py-3 first:pt-0 last:pb-0">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{b.categoryName}</span>
                    <span className={`text-xs font-medium ${isOver ? 'text-red-500' : 'text-slate-500'}`}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.budgeted)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-2 rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-brand-500'}`}
                      style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                    />
                  </div>
                  {isOver && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {formatCurrency(Math.abs(b.remaining))} over budget
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
