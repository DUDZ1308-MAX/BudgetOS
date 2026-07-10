import { useState } from 'react';
import { useAccounts, useCreateAccount } from '@/hooks/useAccounts';
import { formatCurrency } from '@/services/transactionService';
import { CreateAccountModal } from '@/features/transactions/components/CreateAccountModal';
export function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const createAccountMutation = useCreateAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function handleCreate(data: Parameters<typeof createAccountMutation.mutateAsync>[0]) {
    await createAccountMutation.mutateAsync(data);
    setShowCreateModal(false);
  }

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
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">No accounts yet. Create one to get started.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Create Account
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{account.name}</p>
                  <p className="text-xs text-slate-400 capitalize dark:text-slate-500">{account.type}</p>
                </div>
                <p className={`text-lg font-semibold tabular-nums ${
                  Number(account.balance) >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'
                }`}>
                  {formatCurrency(Number(account.balance))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAccountModal
          isPending={createAccountMutation.isPending}
          onCreate={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
