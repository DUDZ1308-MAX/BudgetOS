import { useNavigate } from 'react-router-dom';
import { useTransactions, useArchiveTransaction } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { TransactionList } from './components/TransactionList';
import { LoadingSkeleton } from './components/LoadingSkeleton';

export function TransactionsPage() {
  const navigate = useNavigate();
  const { data: transactions, isLoading } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const archiveMutation = useArchiveTransaction();

  function handleArchive(id: string) {
    archiveMutation.mutate(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
        <button
          onClick={() => navigate('/transactions/add')}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <TransactionList
          transactions={transactions ?? []}
          accounts={accounts}
          categories={categories}
          onArchive={handleArchive}
        />
      )}

      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        {transactions && transactions.length > 0
          ? `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`
          : ''}
      </p>
    </div>
  );
}
