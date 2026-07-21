import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';
import type { DashboardSavingsSnapshot } from '@/lib/dashboard/types';

interface Props {
  snapshot: DashboardSavingsSnapshot;
  isLoading?: boolean;
}

function AnimatedValue({ target, isCurrency }: { target: number; isCurrency?: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const startVal = displayed;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(startVal + (target - startVal) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target]);
  return <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--accent-primary)' }}>{isCurrency ? formatCurrency(displayed) : `${displayed.toFixed(0)}%`}</span>;
}

export const SavingsSnapshotCard = memo(function SavingsSnapshotCard({ snapshot, isLoading }: Props) {
  if (isLoading) {
    return (
      <DashboardCard title="Savings" subtitle="Goals progress">
        <div className="space-y-3">
          <div className="h-8 w-36 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-2 animate-pulse rounded-full" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-4 w-48 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
        </div>
      </DashboardCard>
    );
  }

  const pct = snapshot.goalCompletionPct;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference * (1 - Math.min(pct, 100) / 100);

  return (
    <DashboardCard
      title="Savings Snapshot"
      subtitle={`${snapshot.activeGoals} active ${snapshot.activeGoals === 1 ? 'goal' : 'goals'}`}
      accent="left"
      action={
        <a href="/savings" className="text-xs font-medium hover:underline" style={{ color: 'var(--accent-text)' }}>
          All Goals →
        </a>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative h-16 w-16 shrink-0"
          >
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border-default)" strokeWidth="4" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke={pct >= 80 ? 'var(--status-success)' : pct >= 40 ? 'var(--status-warning)' : 'var(--status-error)'}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="premium-gauge"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
              {Math.round(pct)}%
            </span>
          </motion.div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Saved</span>
              <AnimatedValue target={snapshot.totalSaved} isCurrency />
            </div>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          {snapshot.nearestGoal && (
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Nearest Goal</span>
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                {snapshot.nearestGoal} ({Math.round(snapshot.nearestGoalProgress)}%)
              </span>
            </div>
          )}
          {snapshot.nextMilestone && (
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Next Milestone</span>
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                {formatCurrency(snapshot.nextMilestoneAmount)} to go
              </span>
            </div>
          )}
          {!snapshot.nearestGoal && (
            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No savings goals yet</p>
          )}
        </div>
      </div>
    </DashboardCard>
  );
});
