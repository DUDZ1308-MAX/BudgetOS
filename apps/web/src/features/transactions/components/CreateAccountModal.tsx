import { useState, useEffect } from 'react';
import type { AccountInsert } from '@budgetos/database';
import { accountFormSchema } from '@/services/accountsService';
import { useToastStore } from '@/stores/toast';
import { formatError } from '@/lib/formatError';
import { FocusTrap } from '@/components/ui/FocusTrap';
import { logger } from '@/core/logger';

interface CreateAccountModalProps {
  isPending: boolean;
  onCreate: (data: AccountInsert) => Promise<void>;
  onClose: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit', label: 'Credit' },
  { value: 'loan', label: 'Loan' },
  { value: 'investment', label: 'Investment' },
] as const;

export function CreateAccountModal({ isPending, onCreate, onClose }: CreateAccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('checking');
  const [startingBalance, setStartingBalance] = useState('');
  const [error, setError] = useState('');
  const addToast = useToastStore((s) => s.addToast);

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

    const result = accountFormSchema.safeParse({
      name: name.trim(),
      type,
      balance: parseFloat(startingBalance) || 0,
    });

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      setError(firstIssue?.message ?? 'Invalid form data');
      return;
    }

    try {
      await onCreate({
        name: result.data.name,
        type: result.data.type as AccountInsert['type'],
        balance: result.data.balance,
        currency: 'USD',
        is_active: true,
      });
      addToast('success', 'Account created successfully');
      onClose();
    } catch (err) {
      const { message, detail } = formatError(err);
      logger.error('Account creation failed', 'CreateAccountModal', err);
      const devMsg = import.meta.env.DEV && detail ? `${message} — ${detail}` : message;
      setError(devMsg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="create-account-title">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <FocusTrap active={true}>
      <div className="relative w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-slate-900">
        <div className="mb-1 flex items-center justify-between">
          <h2 id="create-account-title" className="text-lg font-semibold text-slate-900 dark:text-white">Create Account</h2>
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
              Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Main Checking"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Starting Balance
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>
          </div>

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
              {isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
      </FocusTrap>
    </div>
  );
}
