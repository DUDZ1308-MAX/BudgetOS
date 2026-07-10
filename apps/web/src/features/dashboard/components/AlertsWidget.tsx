import { memo } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { ProactiveAlert } from '@/intelligence/types';

interface Props {
  alerts?: ProactiveAlert[];
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
};

export const AlertsWidget = memo(function AlertsWidget({ alerts }: Props) {
  if (!alerts || alerts.length === 0) return null;

  const recent = alerts.slice(0, 3);

  return (
    <DashboardCard
      title="Alerts"
      subtitle={alerts.length > 3 ? `${alerts.length} total` : undefined}
      action={
        <a href="/notifications" className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
          View all
        </a>
      }
    >
      <div className="space-y-2">
        {recent.map((a) => (
          <div key={a.id} className="flex items-start gap-2 text-sm">
            <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${severityColors[a.severity] ?? 'bg-slate-400'}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-900 dark:text-white">{a.title}</p>
              <p className="truncate text-xs text-slate-400">{a.message}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
});
