export interface GoalProgressInput {
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  monthlyContribution: number;
}

export interface GoalProgressResult {
  percentComplete: number;
  monthsRemaining: number;
  onTrack: boolean;
  estimatedCompletionDate: string;
}

export function computeGoalProgress(input: GoalProgressInput): GoalProgressResult {
  const percentComplete = input.targetAmount > 0
    ? Math.min(100, (input.currentAmount / input.targetAmount) * 100)
    : 0;

  const now = new Date();
  const target = new Date(input.targetDate);
  const monthsRemaining = Math.max(0, (target.getFullYear() - now.getFullYear()) * 12
    + (target.getMonth() - now.getMonth()));

  const remainingAmount = input.targetAmount - input.currentAmount;
  const monthsToComplete = input.monthlyContribution > 0
    ? Math.ceil(remainingAmount / input.monthlyContribution)
    : Infinity;

  const onTrack = monthsToComplete <= monthsRemaining;

  const estimatedCompletionDate =
    !isFinite(monthsToComplete)
      ? 'N/A'
      : (() => {
          const estimatedDate = new Date(now);
          estimatedDate.setMonth(estimatedDate.getMonth() + monthsToComplete);
          return estimatedDate.toISOString().split('T')[0] ?? '';
        })();

  return {
    percentComplete: Math.round(percentComplete * 100) / 100,
    monthsRemaining,
    onTrack,
    estimatedCompletionDate,
  };
}
