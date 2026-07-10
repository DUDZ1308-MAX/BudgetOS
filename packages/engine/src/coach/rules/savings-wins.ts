import type { CoachContext, CoachMessageOutput } from '../types';
import { createTemplate, interpolateTemplate } from '../templates';

export function evaluateSavingsWins(ctx: CoachContext): CoachMessageOutput[] {
  const messages: CoachMessageOutput[] = [];

  if (ctx.eventType === 'goal_milestone') {
    const goal = ctx.userState.savingsGoals.find(
      (g) => g.id === String(ctx.eventPayload.goalId ?? ''),
    );

    if (goal) {
      const vars: Record<string, string | number> = {
        name: goal.name,
        percent: Math.round(goal.percentComplete),
        status: goal.percentComplete >= 100 ? 'ahead' : 'behind',
        delta: Math.abs(Math.round(goal.percentComplete - 100)),
      };

      const template = createTemplate(
        'win', 'savings',
        'Goal Progress: {name}',
        "Savings goal '{name}' is {percent}% complete. You're {status} schedule by {delta}%.",
        4,
      );

      messages.push({
        type: template.type,
        category: template.category,
        title: interpolateTemplate(template.title, vars),
        message: interpolateTemplate(template.messageTemplate, vars),
        priority: template.priority,
        deduplicationKey: `goal-milestone:${goal.id}`,
      });
    }
  }

  if (ctx.eventType === 'monthly_rollover') {
    const allUnderBudget = ctx.userState.currentMonthBudgets.every(
      (b) => b.percentUsed <= 100,
    );

    if (allUnderBudget && ctx.userState.currentMonthBudgets.length > 0) {
      const template = createTemplate(
        'win', 'savings',
        'Budget Win',
        "You've stayed under budget in all categories this month! Keep it up!",
        4,
      );

      messages.push({
        type: template.type,
        category: template.category,
        title: template.title,
        message: template.messageTemplate,
        priority: template.priority,
        deduplicationKey: 'budget-win:monthly',
      });
    }
  }

  return messages;
}
