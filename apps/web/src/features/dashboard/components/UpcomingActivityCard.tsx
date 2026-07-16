import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { recurringApi } from '@/lib/api/recurring';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';
import { useNavigate } from 'react-router-dom';

export const UpcomingActivityCard = memo(function UpcomingActivityCard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0] ?? '';

  const { data: recurrings = [], isLoading } = useQuery({
    queryKey: ['recurring-transactions', user?.id],
    queryFn: () => recurringApi.list(user!.id),
    enabled: !!user,
  });

  const upcomingBills = recurrings
    .filter((r) => r.type === 'expense' && r.status === 'active')
    .sort((a, b) => a.next_run.localeCompare(b.next_run))
    .slice(0, 3);

  const upcomingIncome = recurrings
    .filter((r) => r.type === 'income' && r.status === 'active')
    .sort((a, b) => a.next_run.localeCompare(b.next_run))
    .slice(0, 3);

  const allItems = [
    ...upcomingBills.map((b) => ({ ...b, type: 'expense' as const })),
    ...upcomingIncome.map((i) => ({ ...i, type: 'income' as const })),
  ].sort((a, b) => a.next_run.localeCompare(b.next_run)).slice(0, 5);

  if (isLoading) {
    return (
      <DashboardCard title="Upcoming Activity" delay={0.3}>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          ))}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Upcoming Activity"
      subtitle="Bills and income"
      action={
        <button
          onClick={() => navigate('/recurring')}
          className="text-xs hover:underline"
          style={{ color: 'var(--accent-text)' }}
        >
          View all →
        </button>
      }
      delay={0.3}
    >
      {allItems.length === 0 ? (
        <div className="flex h-24 items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming activity</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allItems.map((item) => {
            const isDue = item.next_run <= today;
            const isIncome = item.type === 'income';
            return (
              <div key={item.id} className="flex items-center justify-between rounded-lg py-1.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                  <p className={`text-xs ${isDue ? 'text-red-500 font-medium' : ''}`} style={!isDue ? { color: 'var(--text-muted)' } : undefined}>
                    {isDue ? 'Due now' : new Date(item.next_run).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
});
