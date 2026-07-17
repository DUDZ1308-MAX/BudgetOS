import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface Props {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyChange?: number;
  isLoading?: boolean;
}

function AnimatedValue({ target, isPositive }: { target: number; isPositive: boolean }) {
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

  return (
    <span className={`premium-stat-value ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
      {formatCurrency(displayed)}
    </span>
  );
}

function TrendBadge({ change }: { change: number }) {
  if (change === 0) return null;
  const isUp = change >= 0;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className={`premium-badge ${isUp ? 'premium-badge-success' : 'premium-badge-error'}`}
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
      {Math.abs(change).toFixed(1)}%
    </motion.span>
  );
}

export const NetWorthCard = memo(function NetWorthCard({ netWorth, totalAssets, totalLiabilities, monthlyChange, isLoading }: Props) {
  const isPositive = netWorth >= 0;
  const assetPct = totalAssets > 0 ? (totalAssets / (totalAssets + totalLiabilities)) * 100 : 100;

  if (isLoading) {
    return (
      <DashboardCard title="Net Worth" delay={0.05}>
        <div className="space-y-3">
          <div className="h-10 w-32 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-4 w-48 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Net Worth"
      subtitle="Total assets minus liabilities"
      accent="left"
      delay={0.05}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AnimatedValue target={netWorth} isPositive={isPositive} />
          </motion.div>
          {monthlyChange !== undefined && monthlyChange !== 0 && (
            <TrendBadge change={monthlyChange} />
          )}
        </div>

        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(52, 211, 153, 0.4)' }} />
            <span>Assets: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(totalAssets)}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" style={{ boxShadow: '0 0 6px rgba(248, 113, 113, 0.4)' }} />
            <span>Liabilities: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(totalLiabilities)}</span></span>
          </div>
        </div>

        {totalAssets + totalLiabilities > 0 && (
          <div>
            <div className="premium-progress">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${assetPct}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="premium-progress-bar premium-progress-bar-success"
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <span>{assetPct.toFixed(0)}% assets</span>
              <span>{(100 - assetPct).toFixed(0)}% liabilities</span>
            </div>
          </div>
        )}

        {monthlyChange !== undefined && monthlyChange !== 0 && (
          <div className="flex items-center gap-1 text-xs">
            <span className={monthlyChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
              {monthlyChange >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(monthlyChange))}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
});
