import { memo, useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';

interface SavingsGoal {
  id: string;
  name: string;
  current_amount: number;
  target_amount: number;
  target_date?: string | null;
  monthly_contribution?: number;
  is_completed?: boolean;
  status?: string;
}

interface Props {
  goals: SavingsGoal[];
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; badgeClass: string }> = {
  on_track: { label: 'On Track', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', dot: 'bg-emerald-500', badgeClass: 'premium-badge-success' },
  ahead: { label: 'Ahead', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', dot: 'bg-emerald-500', badgeClass: 'premium-badge-success' },
  behind: { label: 'Behind', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', dot: 'bg-amber-500', badgeClass: 'premium-badge-warning' },
  completed: { label: 'Completed', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30', dot: 'bg-indigo-500', badgeClass: 'premium-badge-info' },
  not_started: { label: 'Not Started', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50', dot: 'bg-slate-400', badgeClass: 'premium-badge-info' },
};

function getGoalStatus(goal: SavingsGoal): string {
  if (goal.is_completed || goal.status === 'completed') return 'completed';
  const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  if (pct >= 100) return 'completed';
  if (goal.target_date) {
    const now = new Date();
    const target = new Date(goal.target_date);
    const monthsLeft = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const remaining = goal.target_amount - goal.current_amount;
    if (goal.monthly_contribution && goal.monthly_contribution > 0) {
      const monthsNeeded = remaining / goal.monthly_contribution;
      if (monthsNeeded < monthsLeft * 0.8) return 'ahead';
      return monthsNeeded > monthsLeft ? 'behind' : 'on_track';
    }
    if (monthsLeft < 0 && pct < 100) return 'behind';
  }
  return pct > 0 ? 'on_track' : 'not_started';
}

function getEstimatedCompletion(goal: SavingsGoal): string | null {
  if (goal.is_completed || goal.status === 'completed') return null;
  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return null;
  if (goal.monthly_contribution && goal.monthly_contribution > 0) {
    const monthsNeeded = Math.ceil(remaining / goal.monthly_contribution);
    const completion = new Date();
    completion.setMonth(completion.getMonth() + monthsNeeded);
    return completion.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return null;
}

function getMonthlyRequired(goal: SavingsGoal): number | null {
  if (goal.is_completed || goal.status === 'completed') return null;
  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return null;
  if (!goal.target_date) return null;
  const now = new Date();
  const target = new Date(goal.target_date);
  const monthsLeft = Math.max(1, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  return remaining / monthsLeft;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function CircularProgress({ percentage, size = 48, strokeWidth = 4 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(percentage, 100) / 100);
  const color = percentage >= 80 ? 'var(--status-success)' : percentage >= 50 ? 'var(--accent-primary)' : 'var(--status-warning)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border-default)" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="premium-gauge"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums" style={{ color }}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

function GoalRow({ goal, index }: { goal: SavingsGoal; index: number }) {
  const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
  const status = getGoalStatus(goal);
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started!;
  const remaining = goal.target_amount - goal.current_amount;
  const estimatedCompletion = getEstimatedCompletion(goal);
  const monthlyRequired = getMonthlyRequired(goal);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 + index * 0.08 }}
      className="group rounded-xl p-4 transition-all"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-start gap-3">
        <CircularProgress percentage={pct} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{goal.name}</h4>
            <span className={`premium-badge ${config.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
              {config.label}
            </span>
          </div>

          <div className="mt-2">
            <div className="premium-progress">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.3 + index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="premium-progress-bar premium-progress-bar-gradient"
              />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>
              <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatCurrency(goal.current_amount)}</span>
              {' / '}
              <span className="tabular-nums">{formatCurrency(goal.target_amount)}</span>
            </span>
            <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {pct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right space-y-1">
          {goal.monthly_contribution && goal.monthly_contribution > 0 ? (
            <div className="text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Monthly: </span>
              <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(goal.monthly_contribution)}
              </span>
            </div>
          ) : monthlyRequired !== null ? (
            <div className="text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Need/mo: </span>
              <span className="font-semibold tabular-nums" style={{ color: 'var(--status-warning)' }}>
                {formatCurrency(monthlyRequired)}
              </span>
            </div>
          ) : null}
          {estimatedCompletion && (
            <div className="text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Est: </span>
              <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {estimatedCompletion}
              </span>
            </div>
          )}
          {goal.target_date && (
            <div className="text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Target: </span>
              <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {formatDate(goal.target_date)}
              </span>
            </div>
          )}
          {remaining > 0 && (
            <div className="text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Remaining: </span>
              <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(remaining)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const SavingsGoalProgress = memo(function SavingsGoalProgress({ goals, isLoading }: Props) {
  const navigate = useNavigate();
  const activeGoals = useMemo(() => goals.filter((g) => !g.is_completed && g.status !== 'completed'), [goals]);
  const displayGoals = useMemo(() => activeGoals.slice(0, 5), [activeGoals]);
  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.current_amount, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.target_amount, 0), [goals]);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  if (isLoading) {
    return (
      <DashboardCard title="Savings Goals" delay={0.12}>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (goals.length === 0) {
    return (
      <DashboardCard title="Savings Goals" delay={0.12}>
        <div className="flex h-40 items-center justify-center">
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No savings goals yet</p>
            <button
              onClick={() => navigate('/savings')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-white transition-all hover:opacity-90"
              style={{ background: 'var(--accent-primary)' }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Your First Goal
            </button>
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Savings Goals"
      subtitle={`${activeGoals.length} active · ${formatCurrency(totalSaved)} saved of ${formatCurrency(totalTarget)}`}
      accent="top"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/savings')}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
          >
            View All Goals
          </button>
          <button
            onClick={() => navigate('/savings')}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'var(--accent-primary)' }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Goal
          </button>
        </div>
      }
      delay={0.12}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Overall Progress</span>
          <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{overallPct.toFixed(1)}%</span>
        </div>
        <div className="premium-progress mt-1.5" style={{ height: '0.75rem' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(overallPct, 100)}%` }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="premium-progress-bar premium-progress-bar-gradient"
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>{formatCurrency(totalSaved)} saved</span>
          <span>{formatCurrency(totalTarget - totalSaved)} to go</span>
        </div>
      </div>

      <div className="space-y-2" role="list" aria-label="Savings goals">
        {displayGoals.map((goal, i) => (
          <GoalRow key={goal.id} goal={goal} index={i} />
        ))}
      </div>

      {activeGoals.length > 5 && (
        <button
          onClick={() => navigate('/savings')}
          className="mt-3 w-full rounded-lg py-2 text-center text-xs font-medium transition-colors"
          style={{ color: 'var(--accent-text)', background: 'var(--accent-muted)' }}
        >
          View {activeGoals.length - 5} more goal{activeGoals.length - 5 !== 1 ? 's' : ''} →
        </button>
      )}
    </DashboardCard>
  );
});
