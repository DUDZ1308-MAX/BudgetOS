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
      <DashboardCard title="Savings Goals" subtitle="Goal progress">
        <div className="space-y-3">
          <div className="h-8 w-full animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
            <div className="h-4 w-1/2 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Savings"
      subtitle={`${snapshot.activeGoals} active goal${snapshot.activeGoals !== 1 ? 's' : ''}`}
      accent="left"
      href="/savings"
    >
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <AnimatedValue target={snapshot.totalSaved} isCurrency />
          <span className="text-xs font-medium" style={{ color: 'var(--status-success)' }}>
            {snapshot.goalCompletionPct.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--accent-gradient)', width: `${snapshot.goalCompletionPct}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${snapshot.goalCompletionPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        {snapshot.nearestGoal && (
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Next: {snapshot.nearestGoal}</span>
            <span>{snapshot.nearestGoalProgress.toFixed(0)}%</span>
          </div>
        )}
        {snapshot.nextMilestone && (
          <div className="rounded-lg p-2 text-xs" style={{ background: 'var(--bg-elevated)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Next milestone: </span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{snapshot.nextMilestone}</span>
            <span style={{ color: 'var(--text-muted)' }}> — {formatCurrency(snapshot.nextMilestoneAmount)}</span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
});
