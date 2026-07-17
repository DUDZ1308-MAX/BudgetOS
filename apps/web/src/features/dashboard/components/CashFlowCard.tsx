import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface Props {
  income: number;
  expenses: number;
  savings: number;
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

function SavingsRateRing({ rate }: { rate: number }) {
  const circumference = 2 * Math.PI * 14;
  const offset = circumference * (1 - Math.min(rate, 100) / 100);
  const color = rate >= 20 ? 'var(--status-success)' : rate >= 10 ? 'var(--status-warning)' : 'var(--status-error)';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative h-[40px] w-[40px] shrink-0"
    >
      <svg className="h-[40px] w-[40px] -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="14" fill="none" stroke="var(--border-default)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r="14"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="premium-gauge"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums" style={{ color }}>
        {Math.round(rate)}%
      </span>
    </motion.div>
  );
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
      accent="left"
      delay={0.08}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <AnimatedValue target={savings} isPositive={isPositive} />
          </motion.div>
          <SavingsRateRing rate={savingsRate} />
        </div>

        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(52, 211, 153, 0.4)' }} />
            <span>Income: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(income)}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" style={{ boxShadow: '0 0 6px rgba(248, 113, 113, 0.4)' }} />
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
