import { useNavigate } from 'react-router-dom';

export function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-5xl text-slate-300 dark:text-slate-600">&#x2194;</div>
      <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
        No transactions yet
      </h3>
      <p className="mb-6 max-w-xs text-sm text-slate-500 dark:text-slate-400">
        Add your first expense or income to start tracking your finances.
      </p>
      <button
        onClick={() => navigate('/transactions/add')}
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        + Add Transaction
      </button>
    </div>
  );
}
