import type { GoalAnalysis, IntelligenceInput } from './types';
import { computeGoalStatus } from '@/engine/SavingsEngine';

export function analyzeGoals(input: IntelligenceInput): Record<string, GoalAnalysis> {
  const results: Record<string, GoalAnalysis> = {};

  for (const goal of input.savingsGoals) {
    const status = computeGoalStatus(goal);
    const current = Number(goal.current_amount);
    const target = Number(goal.target_amount);

    if (target <= 0) continue;

    const remaining = Math.max(0, target - current);
    const probability = estimateSuccessProbability(current, target, status);
    const progressForecast = forecastProgress(current, target, status);
    const suggestedContribution = suggestContribution(current, target, status, goal.target_date ?? undefined);

    results[goal.id] = {
      projectedCompletion: status.estimatedCompletionDate || 'Not calculated',
      probability,
      progressForecast,
      suggestedContribution,
      monthsToCompletion: status.monthsRemaining,
      onTrack: status.onTrack,
    };
  }

  return results;
}

function estimateSuccessProbability(current: number, target: number, status: { onTrack: boolean; monthsRemaining: number }): number {
  if (current >= target) return 100;
  if (status.onTrack) return Math.min(90, 50 + status.monthsRemaining * 5);
  return Math.max(10, 50 - status.monthsRemaining * 5);
}

function forecastProgress(current: number, target: number, status: { monthsRemaining: number }): number[] {
  const forecast: number[] = [];
  const remaining = Math.max(0, target - current);
  const months = Math.min(12, Math.max(1, status.monthsRemaining));
  const perMonth = remaining / months;

  for (let i = 1; i <= Math.min(6, months); i++) {
    const projected = current + perMonth * i;
    forecast.push(Math.round(Math.min(target, projected)));
  }

  return forecast;
}

function suggestContribution(
  current: number,
  target: number,
  status: { monthsRemaining: number },
  targetDate?: string,
): number {
  if (current >= target) return 0;
  const remaining = target - current;
  let monthsLeft = status.monthsRemaining;

  if (targetDate && monthsLeft <= 0) {
    monthsLeft = Math.max(1, Math.round(
      (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30),
    ));
  }

  if (monthsLeft <= 0) monthsLeft = 12;
  return Math.round(remaining / monthsLeft);
}
