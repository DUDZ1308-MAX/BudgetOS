import { memo, useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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

const STATUS_COLORS: Record<string, { ring: string; bg: string; text: string; glow: string }> = {
  on_track: { ring: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', glow: '0 0 12px rgba(16, 185, 129, 0.3)' },
  behind: { ring: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', glow: '0 0 12px rgba(245, 158, 11, 0.3)' },
  completed: { ring: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600 dark:text-indigo-400', glow: '0 0 12px rgba(99, 102, 241, 0.3)' },
  not_started: { ring: 'var(--text-muted)', bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-500', glow: 'none' },
};

function GoalRing({ goal, index }: { goal: SavingsGoal; index: number }) {
  const [animated, setAnimated] = useState(0);
  const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const colors = STATUS_COLORS[goal.status ?? 'not_started'] ?? STATUS_COLORS.not_started!;
  const circumference = 2 * Math.PI * 32;
  const offset = circumference * (1 - animated / 100);
  const isComplete = goal.status === 'completed' || pct >= 100;

  useEffect(() => {
    const duration = 1200 + index * 200;
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
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
      className="flex flex-col items-center gap-2"
    >
      <div className={`relative h-[76px] w-[76px] ${isComplete ? 'celebration-pulse' : ''}`}>
        <svg className="h-[76px] w-[76px] -rotate-90" viewBox="0 0 76 76">
          <defs>
            <linearGradient id={`goalGrad-${goal.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.ring} stopOpacity={0.4} />
              <stop offset="100%" stopColor={colors.ring} stopOpacity={1} />
            </linearGradient>
            <filter id={`goalGlow-${goal.id}`}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="38" cy="38" r="32" fill="none" stroke="var(--border-default)" strokeWidth="5" />
          <circle
            cx="38" cy="38" r="32"
            fill="none"
            stroke={`url(#goalGrad-${goal.id})`}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            filter={isComplete ? `url(#goalGlow-${goal.id})` : undefined}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {Math.round(animated)}%
        </span>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{goal.name}</p>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
        </p>
      </div>
    </motion.div>
  );
}

export const SavingsGoalProgress = memo(function SavingsGoalProgress({ goals, isLoading }: Props) {
  const activeGoals = useMemo(() => goals.filter((g) => g.status !== 'completed'), [goals]);
  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.current_amount, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.target_amount, 0), [goals]);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  if (isLoading) {
    return (
      <DashboardCard title="Savings Goals" delay={0.12}>
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-20 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (goals.length === 0) {
    return (
      <DashboardCard title="Savings Goals" delay={0.12}>
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No savings goals yet.</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Savings Goals"
      subtitle={`${activeGoals.length} active · ${formatCurrency(totalSaved)} saved`}
      delay={0.12}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Overall Progress</span>
          <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{overallPct.toFixed(1)}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(overallPct, 100)}%` }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
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
