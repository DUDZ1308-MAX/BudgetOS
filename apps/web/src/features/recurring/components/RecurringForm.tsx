import { useState, useEffect, useRef, useCallback } from 'react';
import type { RecurringTransaction, RecurringTransactionInsert, Account, Category } from '@budgetos/database';
import { calculateNextRun } from '@/engine/RecurringEngine';

interface Props {
  recurring: RecurringTransaction | null;
  accounts: Account[];
  categories: Category[];
  onSave: (data: RecurringTransactionInsert | any) => void;
  onCancel: () => void;
}

const frequencies = [
  { value: 'one_time', label: 'One Time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'yearly', label: 'Yearly' },
];

const reminderOptions = [
  { value: '', label: 'No reminder' },
  { value: 'today', label: 'On the day' },
  { value: 'day_before', label: '1 day before' },
  { value: 'three_days_before', label: '3 days before' },
  { value: 'week_before', label: '1 week before' },
];

export function RecurringForm({ recurring, accounts, categories, onSave, onCancel }: Props) {
  const isEditing = !!recurring;
  const [name, setName] = useState(recurring?.name ?? '');
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(recurring?.type ?? 'expense');
  const [amount, setAmount] = useState(recurring ? String(Math.abs(recurring.amount)) : '');
  const [accountId, setAccountId] = useState(recurring?.account_id ?? '');
  const [categoryId, setCategoryId] = useState(recurring?.category_id ?? '');
  const [frequency, setFrequency] = useState(recurring?.frequency ?? 'monthly');
  const [startDate, setStartDate] = useState(recurring?.start_date ?? '');
  const [endDate, setEndDate] = useState(recurring?.end_date ?? '');
  const [description, setDescription] = useState(recurring?.description ?? '');
  const [autoPost, setAutoPost] = useState(recurring?.auto_post ?? true);
  const [reminderType, setReminderType] = useState(recurring?.reminder_type ?? '' as string);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const [dayOfMonth, setDayOfMonth] = useState(recurring?.day_of_month ?? (recurring ? null : 1));

  useEffect(() => {
    if (!startDate && !recurring) {
      setStartDate(new Date().toISOString().split('T')[0] ?? '');
    }
    if (recurring?.day_of_month) setDayOfMonth(recurring.day_of_month);
  }, [recurring, startDate]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  }, [onCancel]);

  const filteredCategories = categories.filter((c) => {
    if (type === 'income') return c.type === 'income';
    if (type === 'expense') return c.type === 'expense';
    return true;
  });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) errs.amount = 'Valid amount is required';
    if (!accountId) errs.accountId = 'Account is required';
    if (!startDate) errs.startDate = 'Start date is required';
    if (endDate && endDate < startDate) errs.endDate = 'End date must be after start date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const signedAmount = type === 'expense' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));

    const payload: RecurringTransactionInsert = {
      name: name.trim(),
      type,
      amount: signedAmount,
      account_id: accountId || null,
      category_id: categoryId || null,
      frequency: frequency as any,
      interval_count: 1,
      day_of_month: frequency === 'monthly' || frequency === 'yearly' ? (dayOfMonth as number) : null,
      month_of_year: frequency === 'yearly' ? 1 : null,
      start_date: startDate,
      end_date: endDate || null,
      description: description.trim() || null,
      auto_post: autoPost,
      reminder_type: (reminderType || null) as any,
      status: recurring?.status ?? 'active',
    };

    payload.next_run = calculateNextRun({
      startDate,
      endDate: endDate || null,
      frequency: frequency as any,
      intervalCount: 1,
      dayOfWeek: null,
      dayOfMonth: (frequency === 'monthly' || frequency === 'yearly') ? (dayOfMonth as number) : null,
      monthOfYear: frequency === 'yearly' ? 1 : null,
      lastRun: null,
    });

    try {
      await onSave(payload);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div ref={dialogRef} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {isEditing ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500" placeholder="e.g. Netflix Subscription" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Amount ($)</label>
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500" placeholder="0.00" />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Account</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {errors.accountId && <p className="mt-1 text-xs text-red-500">{errors.accountId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="">No category</option>
              {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              {frequencies.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          {(frequency === 'monthly' || frequency === 'yearly') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Day of month</label>
              <input type="number" min={1} max={31} value={dayOfMonth ?? ''} onChange={(e) => setDayOfMonth(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">End date (optional)</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500" placeholder="Optional notes" />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={autoPost} onChange={(e) => setAutoPost(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600" />
              Auto-post transactions
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reminder</label>
            <select value={reminderType} onChange={(e) => setReminderType(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              {reminderOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
