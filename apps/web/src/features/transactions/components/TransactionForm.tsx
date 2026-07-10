import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UseMutateAsyncFunction } from '@tanstack/react-query';
import type { Account, Category, Transaction } from '@budgetos/database';
import { transactionFormSchema, toSignedAmount, getTodayString, formatCurrency } from '@/services/transactionService';
import type { TransactionFormData } from '@/services/transactionService';
import { useToastStore } from '@/stores/toast';
import { InlineValidation } from '@/components/ui/InlineValidation';

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  isPending: boolean;
  createTransaction: UseMutateAsyncFunction<Transaction | null, Error, any, unknown>;
  onShowCreateAccount: () => void;
  onSuccess?: () => void;
}

export function TransactionForm({
  accounts,
  categories,
  isPending,
  createTransaction,
  onShowCreateAccount,
  onSuccess,
}: TransactionFormProps) {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const activeAccounts = accounts.filter((a) => a.is_active);

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCategories = categories.filter((c) => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const formData: TransactionFormData = {
      amount: parseFloat(amount) || 0,
      type,
      category_id: categoryId,
      account_id: accountId,
      date,
      merchant: merchant || '',
      note: note || '',
    };

    const result = transactionFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      await createTransaction({
        account_id: result.data.account_id,
        category_id: result.data.category_id,
        amount: toSignedAmount(result.data.amount, result.data.type),
        date: result.data.date,
        merchant: result.data.merchant || null,
        note: result.data.note || null,
      });
      addToast('success', 'Transaction saved successfully');
      onSuccess?.();
      navigate('/transactions');
    } catch {
      setErrors({ form: 'Failed to save transaction. Please try again.' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategoryId(''); }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              type === t
                ? t === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-emerald-500 text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t === 'expense' ? 'Expense' : 'Income'}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Amount *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-required="true"
            aria-invalid={errors.amount ? 'true' : undefined}
            className={`w-full rounded-xl border bg-white py-2.5 pl-8 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 ${
              errors.amount ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
            }`}
          />
        </div>
        <InlineValidation error={errors.amount} touched={true} />
      </div>

      <div>
        <label htmlFor="categoryId" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Category *
        </label>
        {categories.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            Loading default categories...
          </p>
        ) : filteredCategories.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            No {type} categories available.
          </p>
        ) : (
          <select
            id="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-required="true"
            aria-invalid={errors.category_id ? 'true' : undefined}
            className={`w-full rounded-xl border bg-white py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-white ${
              errors.category_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <option value="">Select a category</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}{c.name}
              </option>
            ))}
          </select>
        )}
        <InlineValidation error={errors.category_id} touched={true} />
      </div>

      <div>
        <label htmlFor="accountId" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Account *
        </label>
        {activeAccounts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-3 px-3 text-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-slate-400 dark:text-slate-500">No accounts found.</p>
            <button
              type="button"
              onClick={onShowCreateAccount}
              className="mt-2 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
            >
              + Create an account first
            </button>
          </div>
        ) : (
          <select
            id="accountId"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            aria-required="true"
            aria-invalid={errors.account_id ? 'true' : undefined}
            className={`w-full rounded-xl border bg-white py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-white ${
              errors.account_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <option value="">Select an account</option>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatCurrency(a.balance)})
              </option>
            ))}
          </select>
        )}
        <InlineValidation error={errors.account_id} touched={true} />
      </div>

      <div>
        <label htmlFor="date" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Date *
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-required="true"
          aria-invalid={errors.date ? 'true' : undefined}
          className={`w-full rounded-xl border bg-white py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-white ${
            errors.date ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
          }`}
        />
        <InlineValidation error={errors.date} touched={true} />
      </div>

      <div>
        <label htmlFor="merchant" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Merchant <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="merchant"
          type="text"
          placeholder="e.g. Whole Foods"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      <div>
        <label htmlFor="note" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Note <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="note"
          placeholder="Add a note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      {errors.form && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {errors.form}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate('/transactions')}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || activeAccounts.length === 0}
          className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
