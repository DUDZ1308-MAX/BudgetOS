import { memo } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface Props {
  income: number;
  expenses: number;
  savings: number;
  isLoading?: boolean;
}

export const CashFlowCard = memo(function CashFlowCard({ income, expenses, savings, isLoading }: Props) {
  const savingsRate = income > 0 ? ((savings / income) * 100) : 0;
  const isPositive = savings >= 0;

  if (isLoading) {
    return (
      <DashboardCard title="Cash Flow" delay={0.08}>
        <div className="space-y-3">
          <div className="h-10 w-32 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-4 w-48 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Cash Flow"
      subtitle="This month's overview"
      delay={0.08}
    >
      <div className="space-y-3">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className={`text-3xl font-bold tabular-nums tracking-tight ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {formatCurrency(savings)}
        </motion.p>

        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Income: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(income)}</span></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span>Expenses: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(expenses)}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className={`font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {savingsRate.toFixed(1)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>savings rate</span>
        </div>
      </div>
    </DashboardCard>
  );
});
