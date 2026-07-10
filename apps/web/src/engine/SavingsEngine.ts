import { computeGoalProgress, calculateSurplus } from '@budgetos/engine';
import type { SavingsGoal } from '@budgetos/database';

export interface GoalProgressResult {
  percentComplete: number;
  monthsRemaining: number;
  onTrack: boolean;
  estimatedCompletionDate: string;
  remainingAmount: number;
  status: 'not_started' | 'on_track' | 'behind' | 'completed';
  daysRemaining: number;
}

export interface SavingsDashboard {
  totalSaved: number;
  activeGoals: number;
  completedGoals: number;
  largestGoal: { name: string; target: number } | null;
  averageMonthlySavings: number;
  totalTarget: number;
}

export function computeGoalStatus(goal: SavingsGoal): GoalProgressResult {
  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);
  const remaining = Math.max(0, target - current);
  const pct = target > 0 ? (current / target) * 100 : 0;

  if (target === 0) {
    return {
      percentComplete: 0, monthsRemaining: 0, onTrack: false,
      estimatedCompletionDate: '', remainingAmount: 0,
      status: 'not_started', daysRemaining: 0,
    };
  }
  if (current >= target) {
    return {
      percentComplete: 100, monthsRemaining: 0, onTrack: true,
      estimatedCompletionDate: new Date().toISOString().slice(0, 10),
      remainingAmount: 0, status: 'completed', daysRemaining: 0,
    };
  }

  let status: GoalProgressResult['status'] = 'not_started';
  if (current > 0) status = 'on_track';

  if (goal.target_date) {
    try {
      const engineResult = computeGoalProgress({
        currentAmount: current,
        targetAmount: target,
        monthlyContribution: 0,
        targetDate: goal.target_date,
      });
      if (engineResult) {
        const daysLeft = Math.max(0, Math.ceil(
          (new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ));
        status = engineResult.onTrack ? 'on_track' : 'behind';
        if (current <= 0) status = 'not_started';
        return {
          percentComplete: pct,
          monthsRemaining: engineResult.monthsRemaining,
          onTrack: engineResult.onTrack,
          estimatedCompletionDate: engineResult.estimatedCompletionDate,
          remainingAmount: remaining,
          status,
          daysRemaining: daysLeft,
        };
      }
    } catch { /* fall through */ }
  }

  const estMonths = remaining > 0 ? Infinity : 0;
  return {
    percentComplete: pct, monthsRemaining: estMonths, onTrack: true,
    estimatedCompletionDate: '', remainingAmount: remaining,
    status, daysRemaining: 0,
  };
}

export function computeSurplus(income: number, expenses: number, sinkingFunds: number = 0): number {
  try {
    const result = calculateSurplus({ totalIncome: income, totalExpenses: expenses, sinkingFunds });
    return result != null ? Math.max(0, result) : Math.max(0, income - expenses - sinkingFunds);
  } catch {
    return Math.max(0, income - expenses - sinkingFunds);
  }
}

export function computeSavingsDashboard(goals: SavingsGoal[]): SavingsDashboard {
  const active = goals.filter((g) => g.status !== 'completed' && g.status !== 'cancelled');
  const completed = goals.filter((g) => g.status === 'completed');
  let largest: { name: string; target: number } | null = null;
  for (const g of goals) {
    const t = Number(g.target_amount);
    if (!largest || t > largest.target) largest = { name: g.name, target: t };
  }
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  return {
    totalSaved,
    activeGoals: active.length,
    completedGoals: completed.length,
    largestGoal: largest,
    averageMonthlySavings: 0,
    totalTarget,
  };
}
