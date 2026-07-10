import { memo } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { Recommendation } from '@/intelligence/types';

interface Props {
  recommendations?: Recommendation[];
}

const priorityLabels: Record<string, string> = {
  critical: 'Critical',
  high: 'High Priority',
  medium: 'Medium',
  low: 'Suggestion',
};

const priorityColors: Record<string, string> = {
  critical: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30',
  high: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30',
  medium: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30',
  low: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30',
};

export const RecommendationWidget = memo(function RecommendationWidget({ recommendations }: Props) {
  if (!recommendations || recommendations.length === 0) return null;

  const top = recommendations[0];
  if (!top) return null;

  return (
    <DashboardCard
      title="Top Recommendation"
      action={
        <a href="/health" className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
          View all
        </a>
      }
    >
      <div className={`rounded-lg border-l-[3px] p-3 ${
        top.priority === 'critical' ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
        : top.priority === 'high' ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
        : top.priority === 'medium' ? 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
        : 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
      }`}>
        <div className="mb-1">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[top.priority]}`}>
            {priorityLabels[top.priority]}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{top.title}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{top.description}</p>
        {top.estimatedImpact && (
          <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Impact: {top.estimatedImpact}
          </p>
        )}
      </div>
    </DashboardCard>
  );
});
