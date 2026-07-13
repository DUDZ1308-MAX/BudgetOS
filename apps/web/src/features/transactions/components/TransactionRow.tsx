import { memo } from 'react';
import type { Transaction } from '@budgetos/database';
import { formatCurrency } from '@/services/transactionService';

interface TransactionRowProps {
  transaction: Transaction;
  accountName: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  onArchive: (id: string) => void;
}

export const TransactionRow = memo(function TransactionRow({
  transaction,
  accountName,
  categoryName,
  categoryIcon,
  onArchive,
}: TransactionRowProps) {
  const isRecurring = !!transaction.recurring_id;
  const isIncome = transaction.amount >= 0;

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
            isIncome
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
              : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
          }`}
        >
          {categoryIcon ? (
            <span className="text-xs">{categoryIcon}</span>
          ) : (
            <span>{isIncome ? '+' : '-'}</span>
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
            {transaction.merchant || categoryName || 'Transaction'}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{categoryName ?? 'Uncategorized'}</span>
            {isRecurring && <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">Recurring</span>}
            <span className="hidden sm:inline">&middot;</span>
            <span className="hidden sm:inline">{accountName ?? 'Unknown account'}</span>
            <span>&middot;</span>
            <span>{new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span
          className={`text-sm font-semibold tabular-nums ${
            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
        </span>
        <button
          onClick={() => onArchive(transaction.id)}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          title="Remove"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
});
