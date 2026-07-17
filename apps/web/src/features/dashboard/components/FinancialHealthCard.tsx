import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { DashboardFinancialHealth } from '@/lib/dashboard/types';

function getHealthColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return 'var(--accent-primary)';
  if (score >= 40) return '#f59e0b';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

function getHealthLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

function getHealthBadgeClass(score: number): string {
  if (score >= 80) return 'premium-badge-success';
  if (score >= 60) return 'premium-badge-info';
  if (score >= 40) return 'premium-badge-warning';
  return 'premium-badge-error';
}

const COMPONENT_LABELS: Record<string, string> = {
  savingsRate: 'Savings Rate',
  debtToIncome: 'Debt to Income',
  emergencyFund: 'Emergency Fund',
  budgetAdherence: 'Budget Adherence',
  netWorthTrend: 'Net Worth Trend',
};

interface Props {
  result?: DashboardFinancialHealth | null;
  isLoading?: boolean;
}

export const FinancialHealthCard = memo(function FinancialHealthCard({ result, isLoading }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const score = result?.overallScore ?? 0;
  const color = getHealthColor(score);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - animatedScore / 100);

  useEffect(() => {
    if (!result) return;
    const target = result.overallScore;
    const duration = 1400;
    const start = performance.now();
    const startVal = animatedScore;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setIsReady(true);
      }
    }
    requestAnimationFrame(tick);
  }, [result?.overallScore]);

  const topFactors = result?.components
    ? Object.entries(result.components)
        .slice(0, 3)
        .map(([key, val]) => ({
          factor: key,
          label: COMPONENT_LABELS[key] ?? key,
          score: val.earnedPoints,
        }))
    : [];

  if (isLoading) {
    return (
      <DashboardCard title="Financial Health" delay={0.1}>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 animate-pulse rounded-full" style={{ background: 'var(--bg-elevated)' }} />
          <div className="flex-1 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
            ))}
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Financial Health"
      subtitle={result ? getHealthLabel(score) : 'No data yet'}
      accent="left"
      action={
        <a href="/health" className="text-xs hover:underline" style={{ color: 'var(--accent-text)' }}>
          Details →
        </a>
      }
      delay={0.1}
    >
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative h-[80px] w-[80px] shrink-0"
        >
          <svg className="h-[80px] w-[80px] -rotate-90" viewBox="0 0 80 80">
            <defs>
              <linearGradient id="healthGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="50%" stopColor={color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={color} stopOpacity={1} />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border-default)" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="url(#healthGaugeGrad)"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={isReady ? 'premium-gauge-glow' : ''}
              style={{ transition: 'filter 0.5s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums" style={{ color }}>
            {animatedScore}
          </span>
        </motion.div>

        <div className="min-w-0 flex-1 space-y-1.5">
          {topFactors.map((f) => (
            <div key={f.factor} className="flex items-center justify-between text-xs">
              <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
              <span className="ml-2 shrink-0 font-semibold tabular-nums" style={{ color: getHealthColor(f.score) }}>
                {f.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
});
