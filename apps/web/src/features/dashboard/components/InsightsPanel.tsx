import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { DashboardService } from '@/services/DashboardService';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { SkeletonLoader } from './SkeletonLoader';
import { Tooltip } from '@/components/ui/Tooltip';

export const InsightsPanel = memo(function InsightsPanel() {
  const user = useAuthStore((s) => s.user);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: () => DashboardService.getDashboardData(user!.id),
    enabled: !!user,
  });

  const insights = dashboardData?.insights ?? [];
  const criticalCount = insights.filter((i) => i.type === 'critical').length;

  return (
    <DashboardCard
      title="Recent Insights"
      subtitle="AI-powered recommendations"
      action={
        criticalCount > 0 && (
          <Tooltip content={`${criticalCount} critical insight${criticalCount > 1 ? 's' : ''} requiring attention`}>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
              {criticalCount} critical
            </span>
          </Tooltip>
        )
      }
    >
      {isLoading ? (
        <SkeletonLoader lines={3} />
      ) : insights.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
          No insights yet. Add transactions and budgets to get started.
        </p>
      ) : (
        <div className="space-y-2.5">
          {insights.slice(0, 4).map((insight) => {
            const colors: Record<string, string> = {
              critical: 'border-l-red-500 bg-red-50/70 dark:bg-red-950/30',
              warning: 'border-l-amber-500 bg-amber-50/70 dark:bg-amber-950/30',
              success: 'border-l-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30',
              info: 'border-l-blue-500 bg-blue-50/70 dark:bg-blue-950/30',
            };
            const tooltipContent = insight.type === 'critical'
              ? 'Critical — requires immediate attention'
              : insight.type === 'warning'
                ? 'Warning — review this item'
                : undefined;
            const item = (
              <div
                key={insight.id}
                className={`rounded-xl border-l-[3px] p-3 text-sm ${colors[insight.type] ?? 'border-l-slate-300 bg-slate-50 dark:bg-slate-800'}`}
              >
                <p className="font-medium text-slate-900 dark:text-white">{insight.title}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{insight.message}</p>
              </div>
            );
            return tooltipContent ? (
              <Tooltip key={insight.id} content={tooltipContent}>{item}</Tooltip>
            ) : item;
          })}
        </div>
      )}
    </DashboardCard>
  );
});
