import { memo } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

interface GoalWithAnalysis {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  projectedCompletion: string;
  probability: number;
  onTrack: boolean;
}

interface Props {
  goals?: GoalWithAnalysis[];
}

export const SavingsMilestonesWidget = memo(function SavingsMilestonesWidget({ goals }: Props) {
  if (!goals || goals.length === 0) return null;

  return (
    <DashboardCard
      title="Savings Milestones"
      action={
        <a href="/savings" className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
          View goals
        </a>
      }
    >
      <div className="space-y-3">
        {goals.slice(0, 3).map((g) => {
          const pct = g.targetAmount > 0
            ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100)
            : 0;
          return (
            <div key={g.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">{g.name}</span>
                <span className="text-slate-400">
                  ${Math.round(g.currentAmount).toLocaleString()} / ${Math.round(g.targetAmount).toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
                <span>{pct}% complete</span>
                {g.projectedCompletion && <span>by {g.projectedCompletion}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
});
