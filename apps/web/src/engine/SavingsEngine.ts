import { computeGoalProgress, calculateSurplus } from '@budgetos/engine';

export interface GoalProgressResult {
  percentComplete: number;
  remainingAmount: number;
  daysRemaining: number;
  status: 'not_started' | 'on_track' | 'behind' | 'completed';
  estimatedCompletionDate: string;
  monthsRemaining: number;
  onTrack: boolean;
}

export interface SavingsDashboard {
  totalSaved: number;
  totalTarget: number;
  activeGoals: number;
  completedGoals: number;
  largestGoal: { name: string; target: number; current: number } | null;
}

export function computeGoalStatus(goal: { target_amount: number; current_amount: number; deadline?: string | null; target_date?: string | null; status?: string; monthly_contribution?: number }): GoalProgressResult {
  if (goal.target_amount <= 0) {
    return {
      percentComplete: 0,
      remainingAmount: Math.max(0, goal.target_amount - goal.current_amount),
      daysRemaining: 0,
      status: 'not_started',
      estimatedCompletionDate: 'N/A',
      monthsRemaining: 0,
      onTrack: false,
    };
  }

  const targetDate = goal.deadline || goal.target_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const monthlyContrib = goal.monthly_contribution || (remaining / 12);

  const progress = computeGoalProgress({
    currentAmount: goal.current_amount,
    targetAmount: goal.target_amount,
    targetDate,
    monthlyContribution: monthlyContrib,
  });

  const monthsRemaining = progress.monthsRemaining;
  const daysRemaining = monthsRemaining * 30;

  let status: GoalProgressResult['status'] = 'not_started';
  if (progress.percentComplete >= 100) status = 'completed';
  else if (progress.onTrack) status = 'on_track';
  else status = 'behind';

  return {
    percentComplete: progress.percentComplete,
    remainingAmount: remaining,
    daysRemaining,
    status,
    estimatedCompletionDate: progress.estimatedCompletionDate,
    monthsRemaining,
    onTrack: progress.onTrack,
  };
}

export function computeSurplus(income: number, expenses: number, sinkingFunds: number = 0): number {
  return Math.max(0, calculateSurplus({ totalIncome: income, totalExpenses: expenses, sinkingFunds }));
}

export function computeSavingsDashboard(goals: { target_amount: number; current_amount: number; name: string; status?: string }[]): SavingsDashboard {
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
