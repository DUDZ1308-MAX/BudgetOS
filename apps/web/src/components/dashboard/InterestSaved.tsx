import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface Props {
  interestSaved: number;
  totalInterest: number;
  monthlyPayment: number;
  payoffMonthsOriginal: number;
  payoffMonthsCurrent: number;
  monthsSaved: number;
  isLoading?: boolean;
}

function AnimatedCounter({ target, prefix = '$', duration = 1200 }: { target: number; prefix?: string; duration?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return <span>{prefix}{formatCurrency(value).slice(1)}</span>;
}

export const InterestSaved = memo(function InterestSaved({
  interestSaved,
  totalInterest,
  monthlyPayment,
  payoffMonthsOriginal,
  payoffMonthsCurrent,
  monthsSaved,
  isLoading,
}: Props) {
  const yearsSaved = Math.floor(monthsSaved / 12);
  const remainingMonths = monthsSaved % 12;

  if (isLoading) {
    return (
      <DashboardCard title="Interest Saved from Extra Payments" delay={0.3}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (interestSaved <= 0 && monthsSaved <= 0) {
    return (
      <DashboardCard title="Interest Saved from Extra Payments" delay={0.3}>
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add extra payments to see interest savings.</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Interest Saved from Extra Payments"
      subtitle="Impact of your extra payments"
      delay={0.3}
    >
      <div className="space-y-4">
        {/* Hero stat */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="gradient-hero-success rounded-xl p-5"
        >
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Total Interest Saved</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
            <AnimatedCounter target={interestSaved} />
          </p>
          <p className="mt-1 text-xs text-emerald-600/70 dark:text-emerald-400/70">
            {monthsSaved > 0 && (
              <>
                Payoff accelerated by{' '}
                <span className="font-semibold">
                  {yearsSaved > 0 && `${yearsSaved} year${yearsSaved !== 1 ? 's' : ''}`}
                  {yearsSaved > 0 && remainingMonths > 0 && ' '}
                  {remainingMonths > 0 && `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`}
                </span>
              </>
            )}
          </p>
        </motion.div>

        {/* Comparison bars */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Original payoff</span>
              <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {Math.ceil(payoffMonthsOriginal / 12)} years ({payoffMonthsOriginal} months)
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: '100%', background: 'var(--border-strong)' }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>With extra payments</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                {Math.ceil(payoffMonthsCurrent / 12)} years ({payoffMonthsCurrent} months)
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${payoffMonthsOriginal > 0 ? (payoffMonthsCurrent / payoffMonthsOriginal) * 100 : 100}%` }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
              />
            </div>
          </motion.div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Original Interest', value: formatCurrency(totalInterest + interestSaved) },
            { label: 'New Interest', value: formatCurrency(totalInterest) },
            { label: 'Monthly Payment', value: formatCurrency(monthlyPayment) },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
              className="rounded-xl p-3 text-center"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
});
