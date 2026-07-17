import { memo } from 'react';
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
  const score = result?.overallScore ?? 0;
  const color = getHealthColor(score);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - score / 100);
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
            <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border-default)" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums" style={{ color }}>
            {score}
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
