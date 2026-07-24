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
  weekly: '/wk',
  biweekly: '/2wk',
  semiMonthly: '/mo',
  monthly: '/mo',
  accelerated_biweekly: '/2wk',
};

export const MortgageSummary = memo(function MortgageSummary({ mortgages, isLoading }: Props) {
  if (isLoading) {
    return (
      <DashboardCard title="Mortgage" subtitle="Loan overview">
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

  if (mortgages.length === 0) {
    return (
      <DashboardCard title="Mortgage" subtitle="Loan overview">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No mortgage data available.</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Mortgage"
      subtitle={`${mortgages.length} loan${mortgages.length !== 1 ? 's' : ''}`}
      accent="left"
      href="/mortgage"
    >
      {mortgages.map((m) => (
        <div key={m.id}>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.name}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.paymentFrequency ? FREQ_LABELS[m.paymentFrequency] ?? '' : ''}</span>
          </div>
          <div className="mt-1">
            <AnimatedValue target={m.remainingBalance} isCurrency />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--accent-gradient)', width: `${m.principalPaidPct}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${m.principalPaidPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{m.principalPaidPct.toFixed(0)}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Monthly: {formatCurrency(m.monthlyPayment)}</span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.yearsRemaining}y remaining</span>
          </div>
        </div>
      ))}
    </DashboardCard>
  );
});
