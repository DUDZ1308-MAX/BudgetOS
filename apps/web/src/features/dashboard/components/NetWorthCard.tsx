import { memo } from 'react';
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

export const NetWorthCard = memo(function NetWorthCard({ netWorth, totalAssets, totalLiabilities, monthlyChange, isLoading }: Props) {
  const isPositive = netWorth >= 0;

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
      delay={0.05}
    >
      <div className="space-y-3">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`text-3xl font-bold tabular-nums tracking-tight ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {formatCurrency(netWorth)}
        </motion.p>

        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Assets: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(totalAssets)}</span></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span>Liabilities: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(totalLiabilities)}</span></span>
          </div>
        </div>

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
