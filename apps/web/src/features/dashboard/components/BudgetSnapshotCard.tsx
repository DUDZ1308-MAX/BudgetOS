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
          <div className="h-8 w-full animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
            <div className="h-4 w-1/2 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          </div>
        </div>
      </DashboardCard>
    );
  }

  const usageColor = snapshot.monthlyUsagePct > 90 ? 'var(--status-error)' : snapshot.monthlyUsagePct > 70 ? 'var(--status-warning)' : 'var(--status-success)';

  return (
    <DashboardCard
      title="Budget"
      subtitle={`${snapshot.onTrack} on track, ${snapshot.over} over`}
      accent="left"
      href="/budgets"
    >
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <AnimatedPct target={snapshot.monthlyUsagePct} />
          <span className="text-xs font-medium" style={{ color: usageColor }}>
            {snapshot.monthlyUsagePct <= 100 ? 'On Track' : 'Over Budget'}
          </span>
        </div>
        <div className="h-2 w-full rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ background: usageColor, width: `${Math.min(snapshot.monthlyUsagePct, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Remaining: {formatCurrency(snapshot.remainingBudget)}</span>
          {snapshot.topCategory && <span>Top: {snapshot.topCategory}</span>}
        </div>
      </div>
    </DashboardCard>
  );
});
