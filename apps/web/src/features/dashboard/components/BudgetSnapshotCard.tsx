import { memo, useEffect, useState } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';
import type { DashboardBudgetSnapshot } from '@/lib/dashboard/types';

interface Props {
  snapshot: DashboardBudgetSnapshot;
  isLoading?: boolean;
}

function AnimatedPct({ target }: { target: number }) {
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
  return <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--accent-primary)' }}>{displayed.toFixed(0)}%</span>;
}

export const BudgetSnapshotCard = memo(function BudgetSnapshotCard({ snapshot, isLoading }: Props) {
  if (isLoading) {
    return (
      <DashboardCard title="Budget" subtitle="Monthly overview">
        <div className="space-y-3">
          <div className="h-8 w-24 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-2 animate-pulse rounded-full" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-4 w-40 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
        </div>
      </DashboardCard>
    );
  }

  const barColor = snapshot.monthlyUsagePct > 100
    ? 'var(--status-error)'
    : snapshot.monthlyUsagePct > 80
      ? 'var(--status-warning)'
      : 'var(--status-success)';

  return (
    <DashboardCard
      title="Budget Snapshot"
      subtitle={`${snapshot.onTrack} on track, ${snapshot.over} over`}
      accent="left"
      action={
        <a href="/budgets" className="text-xs font-medium hover:underline" style={{ color: 'var(--accent-text)' }}>
          All Budgets →
        </a>
      }
    >
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Monthly Usage</span>
          <AnimatedPct target={snapshot.monthlyUsagePct} />
        </div>

        <div className="premium-progress">
          <div
            className="premium-progress-bar"
            style={{ width: `${Math.min(snapshot.monthlyUsagePct, 100)}%`, background: barColor }}
          />
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Top Category</span>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              {snapshot.topCategory ?? '—'} {snapshot.topCategoryAmount > 0 ? `(${formatCurrency(snapshot.topCategoryAmount)})` : ''}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Remaining</span>
            <span className="font-medium" style={{ color: snapshot.remainingBudget > 0 ? 'var(--status-success)' : 'var(--status-error)' }}>
              {formatCurrency(snapshot.remainingBudget)}
            </span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
});
