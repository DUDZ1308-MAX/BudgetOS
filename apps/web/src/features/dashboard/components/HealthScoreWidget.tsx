import { memo } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { FinancialHealthResult } from '@/intelligence/types';

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-brand-500';
  if (score >= 40) return 'text-amber-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-500';
}

function getHealthBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-brand-500';
  if (score >= 40) return 'bg-amber-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

interface Props {
  result?: FinancialHealthResult | null;
}

export const HealthScoreWidget = memo(function HealthScoreWidget({ result }: Props) {
  if (!result) return null;

  const topFactors = result.factors.slice(0, 3);

  return (
    <DashboardCard
      title="Financial Health"
      action={
        <a href="/health" className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
          View details
        </a>
      }
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <span className={`text-3xl font-bold ${getHealthColor(result.overallScore)}`}>
            {result.overallScore}
          </span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${getHealthBg(result.overallScore)}`}
              style={{ width: `${result.overallScore}%` }}
            />
          </div>
          <div className="mt-2 space-y-1">
            {topFactors.map((f) => (
              <div key={f.factor} className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{f.label}</span>
                <span className={`font-medium ${getHealthColor(f.score)}`}>{f.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
});
