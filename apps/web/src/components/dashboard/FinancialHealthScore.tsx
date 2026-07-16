import { memo, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { FinancialHealthResult } from '@/intelligence/types';

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

function getHealthTextColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-brand-500';
  if (score >= 40) return 'text-amber-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-500';
}

interface Props {
  result?: FinancialHealthResult | null;
  isLoading?: boolean;
}

export const FinancialHealthScore = memo(function FinancialHealthScore({ result, isLoading }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isReady, setIsReady] = useState(false);

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

  const color = useMemo(() => result ? getHealthColor(result.overallScore) : '#6366f1', [result]);
  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - animatedScore / 100);
  const topFactors = result?.factors.slice(0, 4) ?? [];

  if (isLoading) {
    return (
      <DashboardCard title="Financial Health Score" delay={0.1}>
        <div className="flex items-center gap-6">
          <div className="h-28 w-28 animate-pulse rounded-full" style={{ background: 'var(--bg-elevated)' }} />
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded" style={{ background: 'var(--bg-elevated)' }} />
            ))}
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (!result) return null;

  return (
    <DashboardCard
      title="Financial Health Score"
      subtitle={getHealthLabel(result.overallScore)}
      action={
        <a href="/health" className="text-xs hover:underline" style={{ color: 'var(--accent-text)' }}>
          View details
        </a>
      }
      delay={0.1}
    >
      <div className="flex items-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative flex h-[120px] w-[120px] shrink-0 items-center justify-center"
        >
          <svg
            className="h-[120px] w-[120px] -rotate-90"
            viewBox="0 0 100 100"
            role="img"
            aria-label={`Financial health score: ${result.overallScore} out of 100`}
          >
            <defs>
              <linearGradient id="healthGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="50%" stopColor={color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={color} stopOpacity={1} />
              </linearGradient>
              <filter id="healthGaugeGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="var(--border-default)"
              strokeWidth="6"
            />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="url(#healthGaugeGradient)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              filter={isReady ? 'url(#healthGaugeGlow)' : undefined}
              style={{ transition: 'filter 0.5s ease' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold tabular-nums" style={{ color }}>
              {animatedScore}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>/ 100</span>
          </div>
        </motion.div>

        <div className="min-w-0 flex-1 space-y-2.5">
          {topFactors.map((f, i) => (
            <motion.div
              key={f.factor}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                <span className={`ml-2 shrink-0 font-semibold tabular-nums ${getHealthTextColor(f.score)}`}>
                  {f.score}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${f.score}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: getHealthColor(f.score) }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {result.improvementSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="mt-4 rounded-xl p-3"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Top suggestion</p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {result.improvementSuggestions[0]!.message}
          </p>
        </motion.div>
      )}
    </DashboardCard>
  );
});
