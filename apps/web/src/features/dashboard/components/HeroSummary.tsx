import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClickableCard } from '@/components/dashboard/ClickableCard';
import { formatCurrency } from '@/services/transactionService';

interface HeroMetricProps {
  label: string;
  value: number;
  isCurrency?: boolean;
  isPercent?: boolean;
  isPositive?: boolean;
  delay?: number;
  onClick?: () => void;
  ariaLabel?: string;
}

function AnimatedCount({ target, isCurrency, isPercent, isPositive }: { target: number; isCurrency?: boolean; isPercent?: boolean; isPositive?: boolean }) {
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

  const formatted = isCurrency
    ? formatCurrency(displayed)
    : isPercent
      ? `${displayed.toFixed(1)}%`
      : displayed.toFixed(0);

  const color = isPositive === undefined
    ? 'var(--text-primary)'
    : isPositive || target >= 0
      ? 'var(--status-success)'
      : 'var(--status-error)';

  return <span className="text-lg font-bold tabular-nums sm:text-xl md:text-2xl" style={{ color }}>{formatted}</span>;
}

const HeroMetric = memo(function HeroMetric({ label, value, isCurrency, isPercent, isPositive, delay = 0, onClick, ariaLabel }: HeroMetricProps) {
  return (
    <ClickableCard onClick={onClick} ariaLabel={ariaLabel}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-xl border p-3 sm:p-4"
        style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="mt-1">
          <AnimatedCount target={value} isCurrency={isCurrency} isPercent={isPercent} isPositive={isPositive} />
        </div>
      </motion.div>
    </ClickableCard>
  );
});

interface HeroSummaryProps {
  netWorth: number;
  availableCash: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  cashFlow: number;
  savingsRate: number;
  healthScore: number | null;
  isLoading?: boolean;
  onMetricClick?: Record<string, () => void>;
}

export const HeroSummary = memo(function HeroSummary({ netWorth, availableCash, monthlyIncome, monthlyExpenses, cashFlow, savingsRate, healthScore, isLoading, onMetricClick = {} }: HeroSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-16 sm:h-20 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-7">
      <HeroMetric label="Net Worth" value={netWorth} isCurrency isPositive={netWorth >= 0} delay={0.05} onClick={onMetricClick.netWorth} ariaLabel="View net worth details" />
      <HeroMetric label="Available Cash" value={availableCash} isCurrency isPositive delay={0.1} onClick={onMetricClick.availableCash} ariaLabel="View available cash" />
      <HeroMetric label="Monthly Income" value={monthlyIncome} isCurrency isPositive delay={0.15} onClick={onMetricClick.monthlyIncome} ariaLabel="View income transactions" />
      <HeroMetric label="Monthly Expenses" value={monthlyExpenses} isCurrency isPositive={false} delay={0.2} onClick={onMetricClick.monthlyExpenses} ariaLabel="View expense transactions" />
      <HeroMetric label="Cash Flow" value={cashFlow} isCurrency isPositive={cashFlow >= 0} delay={0.25} onClick={onMetricClick.cashFlow} ariaLabel="View cash flow report" />
      <HeroMetric label="Savings Rate" value={savingsRate} isPercent isPositive={savingsRate >= 20} delay={0.3} onClick={onMetricClick.savingsRate} ariaLabel="View savings goals" />
      <HeroMetric
        label="Health Score"
        value={healthScore ?? 0}
        isPositive={(healthScore ?? 0) >= 60}
        delay={0.35}
        onClick={onMetricClick.healthScore}
        ariaLabel="View financial health score"
      />
    </div>
  );
});
