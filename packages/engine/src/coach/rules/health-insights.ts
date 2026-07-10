import type { CoachContext, CoachMessageOutput } from '../types';
import { createTemplate, interpolateTemplate } from '../templates';

export function evaluateHealthInsights(ctx: CoachContext): CoachMessageOutput[] {
  const messages: CoachMessageOutput[] = [];

  if (ctx.eventType === 'score_changed' && ctx.eventPayload) {
    const delta = Number(ctx.eventPayload.delta ?? 0);

    if (delta !== 0) {
      const vars: Record<string, string | number> = {
        days: 30,
        trend: delta > 0 ? 'improved' : 'declined',
        delta: Math.abs(delta),
      };

      const template = createTemplate(
        'insight', 'health',
        'Health Score Update',
        "Your Financial Health Score has {trend} by {delta} points.",
        2,
      );

      messages.push({
        type: template.type,
        category: template.category,
        title: interpolateTemplate(template.title, vars),
        message: interpolateTemplate(template.messageTemplate, vars),
        priority: template.priority,
        deduplicationKey: `health-score-change:${String(ctx.eventPayload.period ?? '')}`,
      });
    }
  }

  if (ctx.userState.currentMonthBudgets.length > 0) {
    const sorted = [...ctx.userState.currentMonthBudgets].sort(
      (a, b) => b.spent - a.spent,
    );
    const topCategory = sorted[0];

    if (topCategory && topCategory.spent > 0) {
      const totalSpent = ctx.userState.currentMonthBudgets.reduce((s, b) => s + b.spent, 0);
      const percentOfTotal = totalSpent > 0 ? (topCategory.spent / totalSpent) * 100 : 0;

      if (percentOfTotal > 30) {
        const vars: Record<string, string | number> = {
          category: topCategory.categoryName,
          percent: Math.round(percentOfTotal),
        };

        const template = createTemplate(
          'insight', 'health',
          'Spending Insight',
          "Your biggest expense category this month was {category} ({percent}% of total).",
          2,
        );

        messages.push({
          type: template.type,
          category: template.category,
          title: interpolateTemplate(template.title, vars),
          message: interpolateTemplate(template.messageTemplate, vars),
          priority: template.priority,
          deduplicationKey: 'top-category-insight',
        });
      }
    }
  }

  return messages;
}
