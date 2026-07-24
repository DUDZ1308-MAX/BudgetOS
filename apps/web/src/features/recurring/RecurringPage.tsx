import { useState } from 'react';
import { useRecurringTransactions, useCreateRecurringTransaction, useUpdateRecurringTransaction, useDeleteRecurringTransaction } from '@/hooks/useRecurringTransactions';
import { useAuthStore } from '@/stores/auth';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useToastStore } from '@/stores/toast';
import { RecurringRow } from './components/RecurringRow';
import { RecurringForm } from './components/RecurringForm';
import { BatchPostingPanel } from './components/BatchPostingPanel';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { calculateNextRun, checkDuplicateOccurrence } from '@/engine/RecurringEngine';
import { supabase } from '@/lib/supabase';
import type { RecurringTransaction, RecurringTransactionInsert, RecurringTransactionUpdate } from '@budgetos/database';

export function RecurringPage() {
  const { data: recurrings, isLoading, refetch } = useRecurringTransactions();
  const user = useAuthStore((s) => s.user);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createMutation = useCreateRecurringTransaction();
  const updateMutation = useUpdateRecurringTransaction();
  const deleteMutation = useDeleteRecurringTransaction();
  const createTransaction = useCreateTransaction();
  const addToast = useToastStore((s) => s.addToast);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [deleting, setDeleting] = useState<RecurringTransaction | null>(null);

  const accountMap = new Map(accounts?.map((a) => [a.id, a]));
  const categoryMap = new Map(categories?.map((c) => [c.id, c]));

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (rt: RecurringTransaction) => {
    setEditing(rt);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting.id);
    addToast('success', `Deleted recurring transaction "${deleting.name}"`);
    setDeleting(null);
  };

  const handleRunNow = async (rt: RecurringTransaction) => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    const nextRun = calculateNextRun({
      startDate: rt.start_date,
      endDate: rt.end_date,
      frequency: rt.frequency,
      intervalCount: rt.interval_count,
      dayOfWeek: rt.day_of_week,
      dayOfMonth: rt.day_of_month,
      monthOfYear: rt.month_of_year,
      lastRun: today,
    });

    if (rt.end_date && today > rt.end_date) {
      addToast('error', 'This recurring transaction has passed its end date');
      return;
    }

    if (!rt.account_id) {
      addToast('error', 'No account linked to this recurring transaction. Please edit and assign an account.');
      return;
    }

    const alreadyPosted = await checkDuplicateOccurrence(supabase, rt.id, today);
    if (alreadyPosted) {
      addToast('info', `Transaction for "${rt.name}" was already posted today`);
      return;
    }

    try {
      await createTransaction.mutateAsync({
        account_id: rt.account_id,
        category_id: rt.category_id,
        amount: rt.amount,
        date: today,
        merchant: rt.name,
        note: rt.description,
        recurring_id: rt.id,
      });

      await updateMutation.mutateAsync({
        id: rt.id,
        data: {
          last_run: today,
          next_run: nextRun,
          status: rt.end_date && nextRun > rt.end_date ? 'completed' : 'active',
        },
      });

      addToast('success', `Transaction posted for "${rt.name}"`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to post transaction. Please check your account and try again.';
      addToast('error', msg);
    }
  };

  const handleTogglePause = async (rt: RecurringTransaction) => {
    const newStatus = rt.status === 'paused' ? 'active' : 'paused';
    await updateMutation.mutateAsync({ id: rt.id, data: { status: newStatus } });
    addToast('success', `Recurring transaction "${rt.name}" ${newStatus === 'paused' ? 'paused' : 'resumed'}`);
  };

  const handleFormSave = async (data: RecurringTransactionInsert | RecurringTransactionUpdate) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: data as RecurringTransactionUpdate });
      addToast('success', `Updated "${'name' in data ? (data as any).name : editing.name}"`);
    } else {
      await createMutation.mutateAsync(data as RecurringTransactionInsert);
      addToast('success', 'Created recurring transaction');
    }
    setShowForm(false);
    setEditing(null);
  };

  const frequencyLabels: Record<string, string> = {
    one_time: 'One Time', daily: 'Daily', weekly: 'Weekly',
    biweekly: 'Biweekly', semimonthly: 'Semi-Monthly', monthly: 'Monthly', quarterly: 'Quarterly',
    semi_annual: 'Semi-Annual', yearly: 'Yearly',
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recurring Transactions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage bills, subscriptions, and recurring income
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BatchPostingPanel userId={user?.id ?? ''} onComplete={refetch} />
          <button
            onClick={handleCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            + New Recurring
          </button>
        </div>
      </div>

      {(!recurrings || recurrings.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
          <svg className="h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">No recurring transactions</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Set up your first bill or recurring income</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurrings.map((rt) => (
            <RecurringRow
              key={rt.id}
              recurring={rt}
              accountName={rt.account_id ? accountMap.get(rt.account_id)?.name ?? 'Unknown' : 'None'}
              categoryName={rt.category_id ? categoryMap.get(rt.category_id)?.name ?? 'Unknown' : 'Uncategorized'}
              categoryIcon={rt.category_id ? categoryMap.get(rt.category_id)?.icon ?? null : null}
              frequencyLabel={frequencyLabels[rt.frequency] ?? rt.frequency}
              onEdit={() => handleEdit(rt)}
              onDelete={() => setDeleting(rt)}
              onRunNow={() => handleRunNow(rt)}
              onTogglePause={() => handleTogglePause(rt)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <RecurringForm
          recurring={editing}
          accounts={accounts ?? []}
          categories={categories ?? []}
          onSave={handleFormSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open={true}
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
          title="Delete Recurring Transaction"
          message={`Are you sure you want to delete "${deleting.name}"? Previously generated transactions will not be affected.`}
          confirmLabel="Delete"
          variant="danger"
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
