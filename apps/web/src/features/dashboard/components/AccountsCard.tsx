import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency } from '@/services/transactionService';
import { SkeletonLoader } from './SkeletonLoader';
import { EmptyState } from './EmptyState';

export const AccountsCard = memo(function AccountsCard() {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading } = useAccounts();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Accounts</h3>
        <button
          onClick={() => navigate('/accounts')}
          className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400"
        >
          View all
        </button>
      </div>

      <div className="px-5 py-3">
        {isLoading ? (
          <div className="space-y-4 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <SkeletonLoader lines={1} className="w-1/3" />
                <SkeletonLoader lines={1} className="w-1/4" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState message="No accounts yet." action={{ label: 'Create Account', onClick: () => navigate('/accounts') }} />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {account.type.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{account.name}</p>
                    <p className="text-xs capitalize text-slate-400 dark:text-slate-500">{account.type}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(Number(account.balance))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
