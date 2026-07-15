import { useState, useEffect } from 'react';
import type { Category, BudgetInsert, Budget } from '@budgetos/database';
import { formatError } from '@/lib/formatError';
import { useToastStore } from '@/stores/toast';
import { logger } from '@/core/logger';

interface CreateBudgetModalProps {
  categories: Category[];
  isPending: boolean;
  budget?: Budget | null;
  onCreate: (data: BudgetInsert) => Promise<void>;
  onUpdate?: (id: string, data: BudgetInsert) => Promise<void>;
  onClose: () => void;
}

const now = new Date();
const defaultYear = now.getFullYear();
const defaultMonth = now.getMonth() + 1;

export function CreateBudgetModal({ categories, isPending, budget, onCreate, onUpdate, onClose }: CreateBudgetModalProps) {
  const isEdit = !!budget;
  const expenseCategories = categories.filter((c) => c.type === 'expense' && !c.is_archived);
  const addToast = useToastStore((s) => s.addToast);

  const [categoryId, setCategoryId] = useState(budget?.category_id ?? '');
  const [amount, setAmount] = useState(budget?.amount?.toString() ?? '');
  const [year] = useState(budget?.year ?? defaultYear);
  const [month] = useState(budget?.month ?? defaultMonth);
  const [rollover, setRollover] = useState(budget?.rollover ?? false);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!categoryId) {
      setError('Category is required.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    try {
      const payload: BudgetInsert = {
        category_id: categoryId,
        year,
        month,
        amount: parsedAmount,
        rollover,
      };

      if (isEdit && onUpdate && budget) {
        await onUpdate(budget.id, payload);
        addToast('success', 'Budget updated successfully');
      } else {
        await onCreate(payload);
        addToast('success', 'Budget created successfully');
      }
      onClose();
    } catch (err) {
      const { message, detail } = formatError(err);
      logger.error(isEdit ? 'Budget update failed' : 'Budget creation failed', 'CreateBudgetModal', err);
      const devMsg = import.meta.env.DEV && detail ? `${message} — ${detail}` : message;
      setError(devMsg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="budget-modal-title">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-slate-900">
        <div className="mb-1 flex items-center justify-between">
          <h2 id="budget-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEdit ? 'Edit Budget' : 'Create Budget'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Category *
            </label>
            {expenseCategories.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
                No expense categories available
              </p>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Select a category</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ''}{c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Budget Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="flex-1">
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Year</label>
              <p className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                {year}
              </p>
            </div>
            <div className="flex-1">
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Month</label>
              <p className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                {new Date(year, month - 1).toLocaleString('en-US', { month: 'long' })}
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rollover}
              onChange={(e) => setRollover(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Roll over unused amount to next month
            </span>
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
