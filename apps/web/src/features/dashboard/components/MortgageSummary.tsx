import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';
import type { DashboardMortgage } from '@/lib/dashboard/types';

interface Props {
  mortgages: DashboardMortgage[];
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
  return <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{isCurrency ? formatCurrency(displayed) : displayed.toFixed(1)}</span>;
}

const FREQ_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  semi_monthly: 'Semi-Monthly',
  bi_weekly: 'Bi-Weekly',
  accelerated_bi_weekly: 'Accel. Bi-Weekly',
  weekly: 'Weekly',
  accelerated_weekly: 'Accel. Weekly',
};

export const MortgageSummary = memo(function MortgageSummary({ mortgages, isLoading }: Props) {
  const primary = mortgages[0];

  if (isLoading) {
    return (
      <DashboardCard title="Mortgage Summary" subtitle="Payoff progress">
        <div className="space-y-3">
          <div className="h-8 w-36 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-2 animate-pulse rounded-full" style={{ background: 'var(--bg-elevated)' }} />
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-6 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />)}
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (!primary) {
    return (
      <DashboardCard title="Mortgage" subtitle="No mortgage data" accent="none">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          <a href="/mortgage" className="text-indigo-500 hover:underline">Add a mortgage</a> to see your payoff progress.
        </p>
      </DashboardCard>
    );
  }

  const pct = primary.progressPct;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference * (1 - Math.min(pct, 100) / 100);

  return (
    <DashboardCard
      title="Mortgage Summary"
      subtitle={`${primary.name} — ${FREQ_LABELS[primary.paymentFrequency] ?? primary.paymentFrequency}`}
      accent="left"
      action={
        <a href="/mortgage" className="text-xs font-medium hover:underline" style={{ color: 'var(--accent-text)' }}>
          Open Mortgage →
        </a>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          {/* Progress ring */}
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
                stroke="var(--accent-primary)" strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="premium-gauge"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums" style={{ color: 'var(--accent-primary)' }}>
              {Math.round(pct)}%
            </span>
          </motion.div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Remaining</span>
              <AnimatedValue target={primary.remainingBalance} isCurrency />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Payment</span>
              <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(primary.monthlyPayment)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Interest Saved</span>
              <span className="text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(primary.interestSaved)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Payoff Date</span>
          <span className="text-right font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {primary.payoffDate ? new Date(primary.payoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>Years Remaining</span>
          <span className="text-right font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>{primary.yearsRemaining}y</span>
        </div>
      </div>
    </DashboardCard>
  );
});
