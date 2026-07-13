import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { recurringApi } from '@/lib/api/recurring';
import { formatCurrency } from '@/services/transactionService';

export function UpcomingBillsWidget() {
  const user = useAuthStore((s) => s.user);
  const today = new Date().toISOString().split('T')[0] ?? '';

  const { data: recurrings = [] } = useQuery({
    queryKey: ['recurring-transactions', user?.id],
    queryFn: () => recurringApi.list(user!.id),
    enabled: !!user,
  });

  const upcomingBills = recurrings
    .filter((r) => r.type === 'expense' && r.status === 'active')
    .sort((a, b) => a.next_run.localeCompare(b.next_run))
    .slice(0, 5);

  if (upcomingBills.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Bills</h3>
        <p className="mt-4 text-center text-sm text-slate-400">No upcoming bills</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Bills</h3>
      <div className="mt-3 space-y-2">
        {upcomingBills.map((bill) => {
          const isDue = bill.next_run <= today;
          return (
            <div key={bill.id} className="flex items-center justify-between py-1.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{bill.name}</p>
                <p className={`text-xs ${isDue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                  {isDue ? 'Due now' : new Date(bill.next_run).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                -{formatCurrency(Math.abs(bill.amount))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function UpcomingIncomeWidget() {
  const user = useAuthStore((s) => s.user);
  const today = new Date().toISOString().split('T')[0] ?? '';

  const { data: recurrings = [] } = useQuery({
    queryKey: ['recurring-transactions', user?.id],
    queryFn: () => recurringApi.list(user!.id),
    enabled: !!user,
  });

  const upcomingIncome = recurrings
    .filter((r) => r.type === 'income' && r.status === 'active')
    .sort((a, b) => a.next_run.localeCompare(b.next_run))
    .slice(0, 5);

  if (upcomingIncome.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Income</h3>
        <p className="mt-4 text-center text-sm text-slate-400">No upcoming income</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Income</h3>
      <div className="mt-3 space-y-2">
        {upcomingIncome.map((inc) => (
          <div key={inc.id} className="flex items-center justify-between py-1.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{inc.name}</p>
              <p className="text-xs text-slate-400">
                {new Date(inc.next_run).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(Math.abs(inc.amount))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
