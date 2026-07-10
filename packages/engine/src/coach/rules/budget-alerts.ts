import type { CoachRule, CoachContext } from '../types';
import { createTemplate, interpolateTemplate } from '../templates';
import type { CoachMessageOutput } from '../types';

const RULES: CoachRule[] = [
  {
    id: 'budget-overspend-80',
    condition: (ctx: CoachContext): boolean => {
      if (ctx.eventType !== 'transaction_added') return false;
      return ctx.userState.currentMonthBudgets.some(
        (b) => b.percentUsed >= 80 && b.categoryId === String(ctx.eventPayload.categoryId ?? ''),
      );
    },
    template: createTemplate(
      'alert', 'budget',
      'Budget Alert: {category}',
      "You've used {percentUsed}% of your {category} budget. You have {remaining} left for the rest of the month.",
      1,
    ),
  },
  {
    id: 'budget-overspend-100',
    condition: (ctx: CoachContext): boolean => {
      if (ctx.eventType !== 'transaction_added') return false;
      return ctx.userState.currentMonthBudgets.some(
        (b) => b.percentUsed >= 100 && b.categoryId === String(ctx.eventPayload.categoryId ?? ''),
      );
    },
    template: createTemplate(
      'alert', 'budget',
      'Budget Exceeded: {category}',
      "You've exceeded your {category} budget! You've spent {spent} against a budget of {budgeted}.",
      1,
    ),
  },
];

export function evaluateBudgetAlerts(ctx: CoachContext): CoachMessageOutput[] {
  const messages: CoachMessageOutput[] = [];

  for (const rule of RULES) {
    if (!rule.condition(ctx)) continue;

    const matchingBudget = ctx.userState.currentMonthBudgets.find(
      (b) => b.categoryId === String(ctx.eventPayload.categoryId ?? ''),
    );

    const vars: Record<string, string | number> = {
      category: matchingBudget?.categoryName ?? 'Unknown',
      percentUsed: Math.round(matchingBudget?.percentUsed ?? 0),
      remaining: matchingBudget ? `$${(((matchingBudget.budgeted - matchingBudget.spent) / 100).toFixed(2))}` : '$0',
      spent: matchingBudget ? `$${(matchingBudget.spent / 100).toFixed(2)}` : '$0',
      budgeted: matchingBudget ? `$${(matchingBudget.budgeted / 100).toFixed(2)}` : '$0',
    };

    const message = interpolateTemplate(rule.template.messageTemplate, vars);

    messages.push({
      type: rule.template.type,
      category: rule.template.category,
      title: interpolateTemplate(rule.template.title, vars),
      message,
      priority: rule.template.priority,
      deduplicationKey: `${rule.id}:${ctx.eventPayload.categoryId ?? ''}`,
    });
  }

  return messages;
}
