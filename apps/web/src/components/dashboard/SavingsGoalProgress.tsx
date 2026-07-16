import { memo, useMemo, useEffect, useState } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface SavingsGoal {
  id: string;
  name: string;
  current_amount: number;
  target_amount: number;
  target_date?: string | null;
  status?: string;
}

interface Props {
  goals: SavingsGoal[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, { ring: string; bg: string; text: string }> = {
  on_track: { ring: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400' },
  behind: { ring: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400' },
  completed: { ring: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600 dark:text-indigo-400' },
  not_started: { ring: '#94a3b8', bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-500' },
};

function GoalRing({ goal, index }: { goal: SavingsGoal; index: number }) {
  const [animated, setAnimated] = useState(0);
  const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const colors = STATUS_COLORS[goal.status ?? 'not_started'] ?? STATUS_COLORS.not_started!;
  const circumference = 2 * Math.PI * 32;
  const offset = circumference * (1 - animated / 100);

  useEffect(() => {
    const duration = 1000 + index * 150;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(pct * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [pct, index]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[76px] w-[76px]">
        <svg className="h-[76px] w-[76px] -rotate-90" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r="32" fill="none" stroke="#e2e8f0" strokeWidth="5" className="dark:stroke-slate-700" />
          <circle
            cx="38" cy="38" r="32"
            fill="none"
            stroke={colors.ring}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums text-slate-900 dark:text-white">
          {Math.round(animated)}%
        </span>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{goal.name}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
        </p>
      </div>
    </div>
  );
}

export const SavingsGoalProgress = memo(function SavingsGoalProgress({ goals, isLoading }: Props) {
  const activeGoals = useMemo(() => goals.filter((g) => g.status !== 'completed'), [goals]);
  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.current_amount, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.target_amount, 0), [goals]);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  if (isLoading) {
    return (
      <DashboardCard title="Savings Goals">
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (goals.length === 0) {
    return (
      <DashboardCard title="Savings Goals">
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">No savings goals yet.</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Savings Goals"
      subtitle={`${activeGoals.length} active · ${formatCurrency(totalSaved)} saved`}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Overall Progress</span>
          <span className="font-semibold text-slate-700 dark:text-white tabular-nums">{overallPct.toFixed(1)}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
            style={{ width: `${Math.min(overallPct, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-2" role="list" aria-label="Savings goals progress">
        {goals.slice(0, 5).map((goal, i) => (
          <GoalRing key={goal.id} goal={goal} index={i} />
        ))}
      </div>
    </DashboardCard>
  );
});
