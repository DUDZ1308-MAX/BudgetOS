import type { CoachTemplate, CoachMessageType, CoachCategory } from './types';

export function createTemplate(
  type: CoachMessageType,
  category: CoachCategory,
  title: string,
  messageTemplate: string,
  priority: number,
): CoachTemplate {
  return { type, category, title, messageTemplate, priority };
}

export function interpolateTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

export const DEFAULT_TEMPLATES: CoachTemplate[] = [
  createTemplate('alert', 'budget', 'Budget Alert: {category}', "You've used {percentUsed}% of your {category} budget. You have {remaining} left for the rest of the month.", 1),
  createTemplate('alert', 'spending', 'Spending Alert', "Your total spending this month is {spendPercent}% of your income. Consider reducing non-essential expenses.", 1),
  createTemplate('alert', 'budget', 'Account Low Balance', "Your {account} balance is {balance}. This is below your minimum threshold.", 1),
  createTemplate('tip', 'spending', 'Potential Savings', "Based on your spending patterns, you could save {amount}/mo by reducing {category} spending.", 3),
  createTemplate('tip', 'savings', 'Round-Up Savings', "You could save approximately {potentialSavings}/year by rounding up your purchases.", 3),
  createTemplate('tip', 'spending', 'Subscription Audit', "You have {count} subscriptions totaling {total}/mo. Are they all active?", 3),
  createTemplate('win', 'savings', 'Budget Win', "You've stayed under budget in all categories this month! Keep it up!", 4),
  createTemplate('win', 'health', 'Net Worth Milestone', "Your net worth is up {amount} ({percent}%) this month. Great progress!", 4),
  createTemplate('win', 'savings', 'Goal Progress', "Savings goal '{name}' is {percent}% complete. You're {status} schedule by {delta}.", 4),
  createTemplate('insight', 'health', 'Spending Insight', "Your biggest expense category this month was {category} ({percent}% of total).", 2),
  createTemplate('insight', 'health', 'Income Insight', "Your income was {direction} than average by {amount}.", 2),
  createTemplate('insight', 'health', 'Health Score Trend', "You've been a BudgetOS user for {days} days. Your Financial Health Score has {trend} by {delta} points.", 2),
];
