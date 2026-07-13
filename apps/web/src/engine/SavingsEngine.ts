import { calculateGoalProgress, calculateSurplus } from '@/lib/finance';
import type { SavingsGoalInput } from '@/lib/finance';

export interface OldGoalProgressResult {
  percentComplete: number;
  remainingAmount: number;
  daysRemaining: number;
  status: 'not_started' | 'on_track' | 'behind' | 'completed';
  estimatedCompletionDate: string;
  monthsRemaining: number;
  onTrack: boolean;
}

export interface OldSavingsDashboard {
  totalSaved: number;
  totalTarget: number;
  activeGoals: number;
  completedGoals: number;
  largestGoal: { name: string; target: number; current: number } | null;
}

export function computeGoalStatus(goal: SavingsGoalInput): OldGoalProgressResult {
  const progress = calculateGoalProgress(goal);
  const monthsRemaining = Math.max(1, Math.round(progress.daysRemaining / 30));
  const monthly = progress.requiredMonthly || Math.max(0, goal.target_amount - goal.current_amount) / monthsRemaining;
  const remaining = progress.remaining;
  const rate = monthsRemaining > 0 ? monthly : remaining;
  const estimatedCompletion = rate > 0
    ? new Date(Date.now() + (remaining / rate) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    percentComplete: progress.percent,
    remainingAmount: progress.remaining,
    daysRemaining: progress.daysRemaining,
    status: progress.status,
    estimatedCompletionDate: estimatedCompletion,
    monthsRemaining,
    onTrack: progress.status === 'on_track' || progress.status === 'completed',
  };
}

export function computeSurplus(income: number, expenses: number, sinkingFunds: number = 0): number {
  return calculateSurplus(income, expenses, sinkingFunds);
}

export function computeSavingsDashboard(goals: SavingsGoalInput[]): OldSavingsDashboard {
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const activeGoals = goals.filter((g) => g.status !== 'completed' && g.status !== 'cancelled').length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const largestGoal = goals.length > 0
    ? goals.reduce((max, g) => (g.target_amount > max.target_amount ? g : max), goals[0]!)
    : null;

  return {
    totalSaved,
    totalTarget,
    activeGoals,
    completedGoals,
    largestGoal: largestGoal
      ? { name: largestGoal.name, target: largestGoal.target_amount, current: largestGoal.current_amount }
      : null,
  };
}
