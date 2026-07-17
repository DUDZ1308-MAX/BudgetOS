import { memo } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { DashboardMortgage } from '@/lib/dashboard/types';
import { formatCurrency } from '@/services/transactionService';

interface Props {
  mortgages?: DashboardMortgage[];
  isLoading?: boolean;
}

function EquityRing({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 20;
  const offset = circumference * (1 - Math.min(progress, 100) / 100);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative h-[48px] w-[48px] shrink-0"
    >
      <svg className="h-[48px] w-[48px] -rotate-90" viewBox="0 0 48 48">
        <defs>
          <linearGradient id="equityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--status-success)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--status-success)" stopOpacity={1} />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border-default)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke="url(#equityGrad)"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="premium-gauge"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
        {Math.round(progress)}%
      </span>
    </motion.div>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
  const principalPaid = mortgage.totalCost - mortgage.totalInterest - mortgage.remainingBalance;

  return (
    <DashboardCard
      title="Mortgage Snapshot"
      subtitle={mortgage.name || 'Primary mortgage'}
      accent="left"
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

        {mortgage.interestSaved > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Interest Saved</span>
            <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(mortgage.interestSaved)}
            </span>
          </div>
        )}

        {mortgage.payoffDate && (
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Est. Payoff</span>
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {formatDate(mortgage.payoffDate)}
            </span>
          </div>
        )}

        <div className="premium-divider" />

        <div className="flex items-center gap-3">
          <EquityRing progress={progress} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Equity Built</span>
              <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {progress.toFixed(1)}%
              </span>
            </div>
            <div className="premium-progress mt-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="premium-progress-bar premium-progress-bar-success"
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
});
