import { memo } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';
import type { DashboardUpcomingItem } from '@/lib/dashboard/types';

interface Props {
  items: DashboardUpcomingItem[];
  isLoading?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  income: '💰',
  expense: '💳',
  mortgage: '🏠',
  contribution: '🎯',
};

const TYPE_COLORS: Record<string, string> = {
  income: 'var(--status-success)',
  expense: 'var(--status-error)',
  mortgage: 'var(--accent-primary)',
  contribution: 'var(--status-warning)',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const UpcomingSection = memo(function UpcomingSection({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <DashboardCard title="Upcoming" subtitle="Next 30 days">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full" style={{ background: 'var(--bg-elevated)' }} />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
                <div className="h-3 w-16 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
              </div>
              <div className="h-4 w-16 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
            </div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (items.length === 0) {
    return (
      <DashboardCard title="Upcoming" subtitle="Next 30 days">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming activity in the next 30 days.</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Upcoming Activity"
      subtitle="Next 30 days"
      action={
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{items.length} items</span>
      }
    >
      <div className="space-y-1">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <span className="text-lg">{TYPE_ICONS[item.type] ?? '📌'}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatDate(item.date)}</p>
            </div>
            <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: TYPE_COLORS[item.type] ?? 'var(--text-secondary)' }}>
              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
            </span>
          </motion.div>
        ))}
      </div>
    </DashboardCard>
  );
});
