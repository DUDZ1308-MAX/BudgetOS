import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/services/transactionService';
import { SkeletonLoader } from './SkeletonLoader';
import { EmptyState } from './EmptyState';
import type { TransactionSummary } from '@/types';

interface RecentTransactionsCardProps {
  transactions: TransactionSummary[];
  isLoading: boolean;
}

export const RecentTransactionsCard = memo(function RecentTransactionsCard({ transactions, isLoading }: RecentTransactionsCardProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
        <button
          onClick={() => navigate('/transactions')}
          className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
        >
          View all
        </button>
      </div>

      <div className="px-5 py-3">
        {isLoading ? (
          <div className="space-y-4 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SkeletonLoader variant="circle" className="h-8 w-8" />
                  <div className="space-y-1.5">
                    <SkeletonLoader lines={1} className="w-32" />
                    <SkeletonLoader lines={1} className="w-20" />
                  </div>
                </div>
                <SkeletonLoader lines={1} className="w-16" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            message="No transactions yet"
            description="Record your first income or expense"
            action={{ label: 'Add Transaction', onClick: () => navigate('/transactions/add') }}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((t) => {
              const isIncome = t.amount >= 0;
              return (
                <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {t.merchant || t.categoryName || 'Transaction'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {t.categoryName && `${t.categoryName} · `}
                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`ml-3 shrink-0 text-sm font-semibold tabular-nums ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
