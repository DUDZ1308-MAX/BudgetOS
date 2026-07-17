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

const COMPONENT_META: Record<string, { label: string; icon: string; format: 'percent' | 'ratio' | 'months' | 'score' }> = {
  savingsRate: { label: 'Savings Rate', icon: '💰', format: 'percent' },
  debtToIncome: { label: 'Debt-to-Income', icon: '📉', format: 'ratio' },
  emergencyFund: { label: 'Emergency Fund', icon: '🛡️', format: 'months' },
  budgetAdherence: { label: 'Budget Score', icon: '📊', format: 'score' },
  netWorthTrend: { label: 'Net Worth Trend', icon: '📈', format: 'score' },
};

function formatComponentValue(key: string, value: number, format: string): string {
  switch (format) {
    case 'percent': return `${value.toFixed(1)}%`;
    case 'ratio': return `${value.toFixed(0)}%`;
    case 'months': return `${value.toFixed(1)} months`;
    case 'score': return `${value.toFixed(0)}%`;
    default: return `${value.toFixed(0)}`;
  }
}

function getComponentColor(key: string, value: number): string {
  if (key === 'savingsRate') return value >= 20 ? '#10b981' : value >= 10 ? 'var(--accent-primary)' : '#f59e0b';
  if (key === 'debtToIncome') return value <= 20 ? '#10b981' : value <= 36 ? 'var(--accent-primary)' : '#f59e0b';
  if (key === 'emergencyFund') return value >= 6 ? '#10b981' : value >= 3 ? 'var(--accent-primary)' : '#f59e0b';
  if (key === 'budgetAdherence') return value >= 80 ? '#10b981' : value >= 60 ? 'var(--accent-primary)' : '#f59e0b';
  return getHealthColor(value);
}

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

  const components = result?.components
    ? Object.entries(result.components).slice(0, 4).map(([key, val]) => {
        const meta = COMPONENT_META[key] ?? { label: key, icon: '📋', format: 'score' as const };
        const displayValue = val.percentage;
        return {
          key,
          label: meta.label,
          icon: meta.icon,
          format: meta.format,
          value: displayValue,
          color: getComponentColor(key, displayValue),
        };
      })
    : [];

  if (isLoading) {
    return (
      <DashboardCard title="Financial Health" delay={0.1}>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 animate-pulse rounded-full" style={{ background: 'var(--bg-elevated)' }} />
          <div className="flex-1 space-y-2">
            {[1, 2, 3, 4].map((i) => (
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

        <div className="min-w-0 flex-1 space-y-2">
          {components.map((comp, i) => (
            <motion.div
              key={comp.key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.08 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{comp.icon}</span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{comp.label}</span>
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: comp.color }}>
                {formatComponentValue(comp.key, comp.value, comp.format)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
});
