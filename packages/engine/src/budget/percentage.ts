import { FINANCIAL_THRESHOLDS } from '@budgetos/shared';
import type { CategoryBudgetResult } from './types';

export function computeCategoryStatus(percentUsed: number): string {
  if (percentUsed >= FINANCIAL_THRESHOLDS.BUDGET_OVER_MAX_PERCENT) return 'over';
  if (percentUsed >= FINANCIAL_THRESHOLDS.BUDGET_CRITICAL_PERCENT) return 'at_limit';
  if (percentUsed >= FINANCIAL_THRESHOLDS.BUDGET_ALERT_PERCENT) return 'on_track';
  return 'under';
}

export function computeWeightedAdherence(categories: CategoryBudgetResult[]): number {
  const totalBudgeted = categories.reduce((sum, c) => sum + c.budgeted, 0);
  if (totalBudgeted === 0) return 100;

  let weightedSum = 0;
  for (const cat of categories) {
    if (cat.budgeted === 0) continue;
    const adherence = Math.min(1, cat.budgeted > 0 ? (cat.budgeted - Math.max(0, cat.spent - cat.budgeted)) / cat.budgeted : 0);
    const weight = cat.budgeted / totalBudgeted;
    weightedSum += adherence * weight;
  }

  return weightedSum * 100;
}
