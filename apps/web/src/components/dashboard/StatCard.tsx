import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/services/transactionService';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface StatCardProps {
  label: string;
  value: number;
  previousValue?: number;
  isLoading: boolean;
  isCurrency?: boolean;
  accent?: 'default' | 'positive' | 'negative';
  tooltip?: string;
  icon?: React.ReactNode;
}

function AnimatedValue({ value, isCurrency }: { value: number; isCurrency: boolean }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    const startVal = displayed;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(startVal + (value - startVal) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span className="tabular-nums tracking-tight">
      {isCurrency ? formatCurrency(displayed) : Math.round(displayed)}
    </span>
  );
}

function TrendBadge({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const isUp = pct >= 0;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isUp
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
      }`}
    >
      <svg
        className={`h-3 w-3 ${isUp ? '' : 'rotate-180'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      {Math.abs(pct).toFixed(1)}%
    </motion.span>
  );
}

const accentStyles = {
  positive: {
    card: 'stat-card-positive',
    value: 'text-emerald-600 dark:text-emerald-400',
    icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    glow: 'var(--glow-success)',
  },
  negative: {
    card: 'stat-card-negative',
    value: 'text-red-600 dark:text-red-400',
    icon: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    glow: 'var(--glow-error)',
  },
  default: {
    card: 'stat-card-default',
    value: 'text-slate-900 dark:text-white',
    icon: 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400',
    glow: 'var(--glow-accent)',
  },
};

export const StatCard = memo(function StatCard({ label, value, previousValue, isLoading, isCurrency = true, accent = 'default', tooltip, icon }: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2, boxShadow: styles.glow }}
      className={`group relative overflow-hidden rounded-2xl p-5 ${styles.card}`}
      style={{
        background: 'var(--card-gradient)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--depth-shadow)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.icon}`}
            >
              {icon}
            </motion.div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              {tooltip && <InfoTooltip content={tooltip} />}
            </div>
            {isLoading ? (
              <div className="mt-2">
                <div className="h-8 w-24 skeleton" />
              </div>
            ) : (
              <p className={`mt-1 text-2xl font-bold ${styles.value}`}>
                <AnimatedValue value={value} isCurrency={isCurrency} />
              </p>
            )}
          </div>
        </div>
        {!isLoading && previousValue !== undefined && (
          <TrendBadge current={value} previous={previousValue} />
        )}
      </div>
    </motion.div>
  );
});
