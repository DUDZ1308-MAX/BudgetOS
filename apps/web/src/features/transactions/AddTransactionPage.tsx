import { useState } from 'react';
import { useAccounts, useCreateAccount } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { TransactionForm } from './components/TransactionForm';
import { AccountFormModal } from './components/AccountFormModal';
import { SuccessMessage } from '@/components/ui/SuccessMessage';
import { logger } from '@/core/logger';

export function AddTransactionPage() {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const createMutation = useCreateTransaction();
  const createAccountMutation = useCreateAccount();
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (accountsLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Transaction</h1>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Transaction</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Record an income or expense
        </p>
      </div>

      {successMessage && (
        <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      )}

      {createMutation.isError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400" role="alert">
          Failed to create transaction. Please try again.
        </div>
      )}

      {accounts.length === 0 && !showCreateAccount ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You need at least one account before adding transactions.
          </p>
          <button
            onClick={() => setShowCreateAccount(true)}
            className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Create Account
          </button>
        </div>
      ) : (
        <TransactionForm
          accounts={accounts}
          categories={categories}
          isPending={createMutation.isPending}
          createTransaction={createMutation.mutateAsync}
          onShowCreateAccount={() => setShowCreateAccount(true)}
          onSuccess={() => setSuccessMessage('Transaction created successfully!')}
        />
      )}

      {showCreateAccount && (
        <AccountFormModal
          isPending={createAccountMutation.isPending}
          onCreate={async (data) => {
            try {
              const result = await createAccountMutation.mutateAsync(data);
              setShowCreateAccount(false);
            } catch (err) {
              logger.error('Account creation rejected', 'AddTransactionPage', err);
              throw err;
            }
          }}
          onClose={() => setShowCreateAccount(false)}
        />
      )}
    </div>
  );
}
