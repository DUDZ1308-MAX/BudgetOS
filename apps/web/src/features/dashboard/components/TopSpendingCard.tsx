import { SkeletonLoader } from './SkeletonLoader';
import { formatCurrency } from '@/services/transactionService';

interface TopSpendingCardProps {
  categories: { categoryName: string; amount: number }[];
  isLoading: boolean;
}

export function TopSpendingCard({ categories, isLoading }: TopSpendingCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top Spending Categories</h3>
      </div>
      <div className="px-5 py-3">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <SkeletonLoader lines={1} className="w-1/3" />
                <SkeletonLoader lines={1} className="w-1/4" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
            No spending data for this month.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((cat, i) => (
              <div key={cat.categoryName} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{cat.categoryName}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                  {formatCurrency(cat.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
