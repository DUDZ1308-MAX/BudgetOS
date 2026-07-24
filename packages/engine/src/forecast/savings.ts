import type {
  SavingsMilestone,
  SavingsGoalForecast,
  SavingsForecastResult,
} from '@budgetos/shared';
import { addMonths } from '../shared/date';

export interface SavingsGoalInput {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  targetDate: string | null;
}

export interface SavingsForecastInput {
  goals: SavingsGoalInput[];
  expectedReturnRate: number;
}

export function computeSavingsForecast(
  input: SavingsForecastInput,
  maxMonths: number = 120,
): SavingsForecastResult {
  const startDate = new Date().toISOString().slice(0, 10);
  const monthlyReturn = input.expectedReturnRate / 12;

  const goals = input.goals.map((g): SavingsGoalForecast => {
    if (g.targetAmount <= 0) {
      return {
        goalId: g.id,
        goalName: g.name,
        currentAmount: Math.round(g.currentAmount * 100) / 100,
        targetAmount: 0,
        monthlyContribution: g.monthlyContribution,
        targetDate: g.targetDate,
        projectedCompletionDate: null,
        onTrack: true,
        projectedBalance: Math.round(g.currentAmount * 100) / 100,
        milestones: [],
      };
    }

    let balance = g.currentAmount;
    const milestones: SavingsMilestone[] = [];
    let completionMonth: number | null = null;

    const milestoneTargets = [0.25, 0.5, 0.75, 1.0];
    let nextMilestoneIdx = 0;

    for (let month = 1; month <= maxMonths; month++) {
      balance += g.monthlyContribution;
      balance += balance * monthlyReturn;

      if (balance >= g.targetAmount) {
        completionMonth = month;
        milestones.push({
          date: addMonths(startDate, month - 1),
          projectedBalance: Math.round(balance * 100) / 100,
          targetAmount: g.targetAmount,
          progressPercent: 100,
          label: 'Goal Complete',
        });
        break;
      }

      const progress = balance / g.targetAmount;
      if (nextMilestoneIdx < milestoneTargets.length && progress >= milestoneTargets[nextMilestoneIdx]!) {
        milestones.push({
          date: addMonths(startDate, month - 1),
          projectedBalance: Math.round(balance * 100) / 100,
          targetAmount: g.targetAmount,
          progressPercent: Math.round(progress * 10000) / 100,
          label: `${Math.round(milestoneTargets[nextMilestoneIdx]! * 100)}% Complete`,
        });
        nextMilestoneIdx++;
      }
    }

    const targetDateObj = g.targetDate ? new Date(g.targetDate) : null;
    const now = new Date();
    const monthsToTarget = targetDateObj
      ? Math.max(0, (targetDateObj.getFullYear() - now.getFullYear()) * 12 + (targetDateObj.getMonth() - now.getMonth()))
      : maxMonths;

    const projectedCompletionDate = completionMonth !== null
      ? addMonths(startDate, completionMonth - 1)
      : null;
    const onTrack = completionMonth !== null ? completionMonth <= monthsToTarget : false;

    return {
      goalId: g.id,
      goalName: g.name,
      currentAmount: Math.round(g.currentAmount * 100) / 100,
      targetAmount: g.targetAmount,
      monthlyContribution: g.monthlyContribution,
      targetDate: g.targetDate,
      projectedCompletionDate,
      onTrack,
      projectedBalance: Math.round(balance * 100) / 100,
      milestones,
    };
  });

  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalProjected = goals.reduce((s, g) => s + g.projectedBalance, 0);
  const overallCompletion = totalTarget > 0 ? (totalProjected / totalTarget) * 100 : 0;
  const completionDates = goals
    .map((g) => g.projectedCompletionDate)
    .filter((d): d is string => d !== null)
    .sort();
  const projectedCompletionDate = completionDates.length > 0
    ? completionDates[completionDates.length - 1]!
    : null;

  return {
    goals,
    totalCurrentSaved: Math.round(totalCurrent * 100) / 100,
    totalTargetSaved: Math.round(totalTarget * 100) / 100,
    totalProjectedSaved: Math.round(totalProjected * 100) / 100,
    overallCompletionPercent: Math.round(overallCompletion * 100) / 100,
    projectedCompletionDate,
  };
}
