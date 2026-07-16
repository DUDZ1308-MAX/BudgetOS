import { memo, useEffect, useState } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { FinancialHealthResult } from '@/intelligence/types';

function getHealthColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#6366f1';
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

  useEffect(() => {
    if (!result) return;
    const target = result.overallScore;
    const duration = 1200;
    const start = performance.now();
    const startVal = animatedScore;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [result?.overallScore]);

  if (isLoading) {
    return (
      <DashboardCard title="Financial Health Score">
        <div className="flex items-center gap-6">
          <div className="h-28 w-28 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (!result) return null;

  const color = getHealthColor(result.overallScore);
  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - animatedScore / 100);
  const topFactors = result.factors.slice(0, 4);

  return (
    <DashboardCard
      title="Financial Health Score"
      subtitle={getHealthLabel(result.overallScore)}
      action={
        <a href="/health" className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
          View details
        </a>
      }
    >
      <div className="flex items-center gap-6">
        <div className="relative flex h-[120px] w-[120px] shrink-0 items-center justify-center">
          <svg
            className="h-[120px] w-[120px] -rotate-90"
            viewBox="0 0 100 100"
            role="img"
            aria-label={`Financial health score: ${result.overallScore} out of 100`}
          >
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="6"
              className="dark:stroke-slate-700"
            />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-none"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold tabular-nums" style={{ color }}>
              {animatedScore}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">/ 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          {topFactors.map((f) => (
            <div key={f.factor}>
              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-slate-600 dark:text-slate-400">{f.label}</span>
                <span className={`ml-2 shrink-0 font-semibold tabular-nums ${getHealthTextColor(f.score)}`}>
                  {f.score}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${f.score}%`,
                    backgroundColor: getHealthColor(f.score),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.improvementSuggestions.length > 0 && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Top suggestion</p>
          <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">
            {result.improvementSuggestions[0]!.message}
          </p>
        </div>
      )}
    </DashboardCard>
  );
});
