import { memo } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { DashboardMortgage } from '@/lib/dashboard/types';
import { formatCurrency } from '@/services/transactionService';

interface Props {
  mortgages?: DashboardMortgage[];
  isLoading?: boolean;
}

export const MortgageSnapshotCard = memo(function MortgageSnapshotCard({ mortgages = [], isLoading }: Props) {
  const mortgage = mortgages.length > 0 ? mortgages[0] : null;

  if (isLoading) {
    return (
      <DashboardCard title="Mortgage Snapshot" delay={0.35}>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (!mortgage) {
    return (
      <DashboardCard title="Mortgage Snapshot" delay={0.35}>
        <div className="flex h-32 items-center justify-center">
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No mortgage tracked yet</p>
            <a href="/mortgage" className="mt-2 inline-block text-xs hover:underline" style={{ color: 'var(--accent-text)' }}>
              Add your mortgage →
            </a>
          </div>
        </div>
      </DashboardCard>
    );
  }

  const progress = mortgage.progressPct;

  return (
    <DashboardCard
      title="Mortgage Snapshot"
      subtitle={mortgage.name || 'Primary mortgage'}
      action={
        <a href="/mortgage" className="text-xs hover:underline" style={{ color: 'var(--accent-text)' }}>
          Details →
        </a>
      }
      delay={0.35}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Remaining Balance</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(mortgage.remainingBalance)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Monthly Payment</span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(mortgage.monthlyPayment)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Equity Built</span>
          <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {progress.toFixed(1)}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          />
        </div>
      </div>
    </DashboardCard>
  );
});
