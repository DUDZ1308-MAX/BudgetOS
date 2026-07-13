import { daysBetween } from './dates';

export interface SavingsGoalInput {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: string;
}

export interface GoalProgressResult {
  remaining: number;
  percent: number;
  status: 'not_started' | 'on_track' | 'behind' | 'completed';
  daysRemaining: number;
  requiredMonthly: number;
}

export interface SavingsDashboard {
  totalSaved: number;
  totalTarget: number;
  activeGoals: number;
  completedGoals: number;
  largestGoal: SavingsGoalInput | null;
}

export function calculateGoalProgress(goal: SavingsGoalInput): GoalProgressResult {
  const { target_amount, current_amount, target_date, status } = goal;
  const remaining = Math.max(0, target_amount - current_amount);
  const percent = target_amount > 0 ? (current_amount / target_amount) * 100 : 0;

  if (target_amount === 0) {
    return { remaining: 0, percent: 0, status: 'not_started', daysRemaining: 0, requiredMonthly: 0 };
  }
  if (current_amount >= target_amount || status === 'completed') {
    return { remaining: 0, percent: 100, status: 'completed', daysRemaining: 0, requiredMonthly: 0 };
  }

  let daysRemaining = 0;
  if (target_date) {
    const now = new Date();
    const target = new Date(target_date);
    daysRemaining = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
  }

  const monthsRemaining = Math.max(1, daysRemaining / 30.44);
  const requiredMonthly = remaining / monthsRemaining;

  let goalStatus: GoalProgressResult['status'] = 'not_started';
  if (current_amount > 0) {
    goalStatus = daysRemaining > 0 && percent >= 50 ? 'on_track' : 'behind';
  }

  return { remaining, percent, status: goalStatus, daysRemaining, requiredMonthly: Math.round(requiredMonthly * 100) / 100 };
}

export function calculateRemainingAmount(target: number, current: number): number {
  return Math.max(0, target - current);
}

export function calculateRequiredMonthlyContribution(
  target: number,
  current: number,
  monthsRemaining: number,
): number {
  const remaining = calculateRemainingAmount(target, current);
  if (monthsRemaining <= 0) return remaining;
  return Math.round((remaining / monthsRemaining) * 100) / 100;
}

export function calculateGoalCompletionDate(
  current: number,
  target: number,
  monthlyContribution: number,
): { months: number; date: string } | null {
  const remaining = calculateRemainingAmount(target, current);
  if (remaining <= 0) return { months: 0, date: new Date().toISOString().split('T')[0] ?? '' };
  if (monthlyContribution <= 0) return null;

  const months = Math.ceil(remaining / monthlyContribution);
  const now = new Date();
  const completionDate = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
  return { months, date: completionDate.toISOString().split('T')[0] ?? '' };
}

export function calculateSavingsAllocation(
  income: number,
  expenses: number,
  rate: number = 0.2,
): number {
  const surplus = Math.max(0, income - expenses);
  return Math.round(Math.min(surplus, income * rate) * 100) / 100;
}

export function calculateSurplus(income: number, expenses: number, sinkingFunds: number = 0): number {
  return Math.max(0, income - expenses - sinkingFunds);
}

export function computeGoalStatus(goal: SavingsGoalInput): GoalProgressResult {
  return calculateGoalProgress(goal);
}

export function computeSavingsDashboard(goals: SavingsGoalInput[]): SavingsDashboard {
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const activeGoals = goals.filter((g) => g.status !== 'completed' && g.status !== 'cancelled').length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const largestGoal = goals.length > 0
    ? goals.reduce((max, g) => (g.target_amount > max.target_amount ? g : max), goals[0]!)
    : null;

  return { totalSaved, totalTarget, activeGoals, completedGoals, largestGoal };
}
