import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DashboardInsight } from '@/lib/dashboard/types';

interface Props {
  insights: DashboardInsight[];
  isLoading?: boolean;
}

const TYPE_STYLES: Record<DashboardInsight['type'], { border: string; bg: string; iconBg: string }> = {
  positive: {
    border: 'border-emerald-200 dark:border-emerald-900',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
  },
  neutral: {
    border: 'border-blue-200 dark:border-blue-900',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-900',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
  },
};

export const InsightsCards = memo(function InsightsCards({ insights, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--border-default)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No insights available yet. Add more financial data to see personalized insights.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight, i) => {
        const styles = TYPE_STYLES[insight.type] ?? TYPE_STYLES.neutral;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`rounded-xl border p-4 ${styles.border} ${styles.bg}`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${styles.iconBg}`}>
                {insight.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{insight.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight.description}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
