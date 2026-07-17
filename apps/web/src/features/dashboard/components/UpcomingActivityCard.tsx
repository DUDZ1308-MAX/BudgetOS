import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';
import { useNavigate } from 'react-router-dom';

interface ActivityItem {
  id: string;
  name: string;
  amount: number;
  nextRun: string;
  type: 'income' | 'expense';
  frequency: string;
}

interface Props {
  activity?: ActivityItem[];
  isLoading?: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: string }> = {
  salary: { icon: '💼' },
  bills: { icon: '📄' },
  mortgage: { icon: '🏠' },
  transfer: { icon: '🔄' },
  savings: { icon: '💰' },
  investment: { icon: '📈' },
  subscription: { icon: '📱' },
  entertainment: { icon: '🎬' },
  food: { icon: '🍔' },
  transport: { icon: '🚗' },
  utilities: { icon: '⚡' },
  insurance: { icon: '🛡️' },
};

function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
    if (lower.includes(key)) return config.icon;
  }
  return '📋';
}

function getRecurrenceBadge(frequency: string): string {
  switch (frequency) {
    case 'weekly': return 'Weekly';
    case 'biweekly': return 'Biweekly';
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
    case 'yearly': return 'Yearly';
    default: return frequency;
  }
}

function getDueDateClass(nextRun: string, today: string): string {
  if (nextRun <= today) return 'text-red-500 font-medium';
  const daysUntil = Math.ceil((new Date(nextRun).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 3) return 'text-amber-500 font-medium';
  return '';
}

export const UpcomingActivityCard = memo(function UpcomingActivityCard({ activity = [], isLoading }: Props) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0] ?? '';

  const sortedActivity = useMemo(() => {
    return [...activity]
      .sort((a, b) => a.nextRun.localeCompare(b.nextRun))
      .slice(0, 5);
  }, [activity]);

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
      {sortedActivity.length === 0 ? (
        <div className="flex h-24 items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming activity</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedActivity.map((item, i) => {
            const isDue = item.nextRun <= today;
            const isIncome = item.type === 'income';
            const icon = getCategoryIcon(item.name);
            const dueClass = getDueDateClass(item.nextRun, today);
            const recurrence = getRecurrenceBadge(item.frequency);
            const daysUntil = Math.ceil((new Date(item.nextRun).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + i * 0.05 }}
                className="flex items-center justify-between rounded-xl py-2 px-3 transition-all"
                style={{ background: isDue ? 'color-mix(in srgb, var(--status-error) 5%, transparent)' : 'transparent' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{icon}</span>
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                    <span className="premium-badge premium-badge-info" style={{ fontSize: '9px', padding: '1px 5px' }}>
                      {recurrence}
                    </span>
                  </div>
                  <p className={`ml-6 text-xs ${dueClass}`} style={!dueClass ? { color: 'var(--text-muted)' } : undefined}>
                    {isDue ? 'Due now' : daysUntil <= 3 ? `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}` : new Date(item.nextRun).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
});
