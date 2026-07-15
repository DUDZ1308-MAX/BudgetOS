import { useState } from 'react';
import { useAccounts, useCreateAccount, useUpdateAccount } from '@/hooks/useAccounts';
import { formatCurrency } from '@/services/transactionService';
import { AccountFormModal } from '@/features/transactions/components/AccountFormModal';
import { IconAccounts } from '@/components/ui/Icons';
import type { Account } from '@budgetos/database';

export function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  async function handleCreate(data: Parameters<typeof createAccountMutation.mutateAsync>[0]) {
    await createAccountMutation.mutateAsync(data);
    setShowCreateModal(false);
  }

  async function handleUpdate(id: string, data: Parameters<typeof updateAccountMutation.mutateAsync>[0]['data']) {
    await updateAccountMutation.mutateAsync({ id, data });
  }

  const isPending = createAccountMutation.isPending || updateAccountMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Accounts</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Create Account
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 dark:border-slate-700">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
            <IconAccounts className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">No accounts yet</h3>
          <p className="mt-1 max-w-sm text-center text-xs text-slate-500 dark:text-slate-400">
            Create accounts for your bank, credit cards, or cash to start tracking your net worth and balances.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            + Create Account
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="group rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{account.name}</p>
                  <p className="text-xs text-slate-400 capitalize dark:text-slate-500">{account.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-lg font-semibold tabular-nums ${
                    Number(account.balance) >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'
                  }`}>
                    {formatCurrency(Number(account.balance))}
                  </p>
                  <button
                    onClick={() => setEditingAccount(account)}
                    className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    aria-label={`Edit ${account.name}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <AccountFormModal
          isPending={createAccountMutation.isPending}
          onCreate={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingAccount && (
        <AccountFormModal
          isPending={updateAccountMutation.isPending}
          account={editingAccount}
          onUpdate={handleUpdate}
          onClose={() => setEditingAccount(null)}
        />
      )}
    </div>
  );
}
