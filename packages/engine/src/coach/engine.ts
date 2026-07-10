import type { CoachContext, CoachMessageOutput } from './types';
import { evaluateBudgetAlerts } from './rules/budget-alerts';
import { evaluateSpendingTips } from './rules/spending-tips';
import { evaluateSavingsWins } from './rules/savings-wins';
import { evaluateHealthInsights } from './rules/health-insights';

export function evaluateCoachRules(ctx: CoachContext): CoachMessageOutput[] {
  const allMessages: CoachMessageOutput[] = [
    ...evaluateBudgetAlerts(ctx),
    ...evaluateSpendingTips(ctx),
    ...evaluateSavingsWins(ctx),
    ...evaluateHealthInsights(ctx),
  ];

  const seen = new Set<string>();
  const deduplicated: CoachMessageOutput[] = [];

  for (const msg of allMessages) {
    if (seen.has(msg.deduplicationKey)) continue;
    seen.add(msg.deduplicationKey);

    const alreadyShown = ctx.existingMessages.some(
      (existing) => existing.deduplicationKey === msg.deduplicationKey,
    );
    if (alreadyShown) continue;

    deduplicated.push(msg);
  }

  return deduplicated
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
}
