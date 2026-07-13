import { memo } from 'react';
import type { RecurringTransaction } from '@budgetos/database';
import { formatCurrency } from '@/services/transactionService';

interface RecurringRowProps {
  recurring: RecurringTransaction;
  accountName: string;
  categoryName: string;
  categoryIcon: string | null;
  frequencyLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onRunNow: () => void;
  onTogglePause: () => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const typeColors: Record<string, string> = {
  income: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  expense: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
  transfer: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
};

const typeIcons: Record<string, string> = {
  income: '+',
  expense: '-',
  transfer: '→',
};

export const RecurringRow = memo(function RecurringRow({
  recurring,
  accountName,
  categoryName,
  categoryIcon,
  frequencyLabel,
  onEdit,
  onDelete,
  onRunNow,
  onTogglePause,
}: RecurringRowProps) {
  const isDue = recurring.next_run <= (new Date().toISOString().split('T')[0] ?? '');
  const isPaused = recurring.status === 'paused';

  return (
    <div className={`rounded-xl border bg-white px-4 py-3 dark:bg-slate-900 ${
      isDue && !isPaused
        ? 'border-amber-200 dark:border-amber-800'
        : 'border-slate-200 dark:border-slate-800'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${typeColors[recurring.type]}`}>
            {categoryIcon ? <span className="text-xs">{categoryIcon}</span> : <span>{typeIcons[recurring.type]}</span>}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{recurring.name}</p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[recurring.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {recurring.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{frequencyLabel}</span>
              <span>&middot;</span>
              <span>{categoryName}</span>
              <span className="hidden sm:inline">&middot;</span>
              <span className="hidden sm:inline">{accountName}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <p className="font-medium text-slate-700 dark:text-slate-300">Next</p>
              <p>{new Date(recurring.next_run).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
            {recurring.last_run && (
              <div className="text-center">
                <p className="font-medium text-slate-700 dark:text-slate-300">Last</p>
                <p>{new Date(recurring.last_run).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            )}
            <div className="text-center">
              <p className="font-medium text-slate-700 dark:text-slate-300">Auto</p>
              <p>{recurring.auto_post ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className={`text-sm font-semibold tabular-nums ${
            recurring.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {recurring.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(recurring.amount))}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-3 shrink-0">
          <button onClick={onTogglePause} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300" title={isPaused ? 'Resume' : 'Pause'}>
            {isPaused ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            )}
          </button>
          <button onClick={onRunNow} disabled={isPaused} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-indigo-400" title="Run Now">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
          <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300" title="Edit">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button onClick={onDelete} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800 dark:hover:text-red-400" title="Delete">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});
