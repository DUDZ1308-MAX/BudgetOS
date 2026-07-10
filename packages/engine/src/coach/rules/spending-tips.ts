import type { CoachRule, CoachContext, CoachMessageOutput } from '../types';
import { createTemplate, interpolateTemplate } from '../templates';

const RULES: CoachRule[] = [
  {
    id: 'total-spending-high',
    condition: (ctx: CoachContext): boolean => {
      if (ctx.eventType !== 'transaction_added') return false;
      const { cashFlow } = ctx.userState;
      if (cashFlow.income <= 0) return false;
      const spendPercent = (cashFlow.expenses / cashFlow.income) * 100;
      return spendPercent > 80;
    },
    template: createTemplate(
      'alert', 'spending',
      'Spending Alert',
      'Your total spending this month is {spendPercent}% of your income. Consider reducing non-essential expenses.',
      1,
    ),
  },
  {
    id: 'subscription-audit',
    condition: (ctx: CoachContext): boolean => {
      return ctx.eventType === 'transaction_added' || ctx.eventType === 'monthly_rollover';
    },
    template: createTemplate(
      'tip', 'spending',
      'Subscription Audit',
      'You have {count} subscriptions totaling {total}/mo. Are they all active?',
      3,
    ),
  },
];

export function evaluateSpendingTips(ctx: CoachContext): CoachMessageOutput[] {
  const messages: CoachMessageOutput[] = [];

  for (const rule of RULES) {
    if (!rule.condition(ctx)) continue;

    const spendPercent = ctx.userState.cashFlow.income > 0
      ? ((ctx.userState.cashFlow.expenses / ctx.userState.cashFlow.income) * 100).toFixed(0)
      : '0';

    const vars: Record<string, string | number> = {
      spendPercent: Number(spendPercent),
      category: String(ctx.eventPayload.categoryName ?? ''),
      percent: '0',
      count: 0,
      total: '$0',
    };

    const message = interpolateTemplate(rule.template.messageTemplate, vars);

    messages.push({
      type: rule.template.type,
      category: rule.template.category,
      title: interpolateTemplate(rule.template.title, vars),
      message,
      priority: rule.template.priority,
      deduplicationKey: rule.id,
    });
  }

  return messages;
}
