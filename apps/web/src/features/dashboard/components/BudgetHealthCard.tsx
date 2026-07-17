import { memo, useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface BudgetItem {
  categoryName: string;
  budgeted: number;
  spent: number;
}

interface Props {
  budgets: BudgetItem[];
  isLoading?: boolean;
}

function AnimatedPercentage({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 1000;
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

  return <span>{Math.round(displayed)}%</span>;
}

function getProgressColor(pct: number): string {
  if (pct > 100) return 'premium-progress-bar-error';
  if (pct > 80) return 'premium-progress-bar-warning';
  return 'premium-progress-bar-success';
}

export const BudgetHealthCard = memo(function BudgetHealthCard({ budgets, isLoading }: Props) {
  const stats = useMemo(() => {
    const onTrack = budgets.filter((b) => b.budgeted > 0 && b.spent <= b.budgeted).length;
    const warnings = budgets.filter((b) => b.budgeted > 0 && b.spent > b.budgeted * 0.8 && b.spent <= b.budgeted).length;
    const overBudget = budgets.filter((b) => b.budgeted > 0 && b.spent > b.budgeted).length;
    const totalBudgeted = budgets.reduce((s, b) => s + b.budgeted, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const pctUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    return { onTrack, warnings, overBudget, totalBudgeted, totalSpent, pctUsed };
  }, [budgets]);

  if (isLoading) {
    return (
      <DashboardCard title="Budget Health" delay={0.12}>
        <div className="space-y-3">
          <div className="h-8 w-24 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-4 w-40 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
        </div>
      </DashboardCard>
    );
  }

  if (budgets.length === 0) {
    return (
      <DashboardCard title="Budget Health" delay={0.12}>
        <div className="flex h-24 items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No budgets set up yet</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Budget Health"
      subtitle={`${budgets.length} categories tracked`}
      accent="left"
      delay={0.12}
    >
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-baseline gap-2"
        >
          <span className="premium-stat-value" style={{ color: stats.pctUsed > 100 ? 'var(--status-error)' : stats.pctUsed > 80 ? 'var(--status-warning)' : 'var(--status-success)' }}>
            <AnimatedPercentage target={stats.pctUsed} />
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>of budget used</span>
        </motion.div>

        <div className="premium-progress">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(stats.pctUsed, 100)}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`premium-progress-bar ${getProgressColor(stats.pctUsed)}`}
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          {stats.onTrack > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(52, 211, 153, 0.4)' }} />
              <span style={{ color: 'var(--text-muted)' }}>{stats.onTrack} on track</span>
            </div>
          )}
          {stats.warnings > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" style={{ boxShadow: '0 0 6px rgba(251, 191, 36, 0.4)' }} />
              <span style={{ color: 'var(--text-muted)' }}>{stats.warnings} warning</span>
            </div>
          )}
          {stats.overBudget > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 6px rgba(248, 113, 113, 0.4)' }} />
              <span style={{ color: 'var(--text-muted)' }}>{stats.overBudget} over budget</span>
            </div>
          )}
        </div>

        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Spent: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(stats.totalSpent)}</span></span>
          <span>Budget: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(stats.totalBudgeted)}</span></span>
        </div>
      </div>
    </DashboardCard>
  );
});
