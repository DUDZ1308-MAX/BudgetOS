import { computeCategoryStatus, computeWeightedAdherence } from './percentage';
import type { BudgetInput } from './types';
import type { BudgetSummaryResult, CategoryBudgetResult, OverallBudgetSummary } from '@budgetos/shared';

export function computeBudgetSummary(input: BudgetInput): BudgetSummaryResult {
  const categories: CategoryBudgetResult[] = [];
  let totalBudgeted = 0;
  let totalSpent = 0;

  for (const budget of input.budgets) {
    const resolvedAmount = resolveBudgetAmount(budget, input.totalIncome);
    const spent = findSpentForCategory(budget.categoryId, input.transactions);
    const rolloverAmount = findRolloverForCategory(budget.categoryId, input.previousMonthRollovers, budget.rolloverEnabled);

    const available = resolvedAmount + rolloverAmount - spent;
    const percentUsed = resolvedAmount > 0 ? (spent / resolvedAmount) * 100 : spent > 0 ? 100 : 0;

    categories.push({
      categoryId: budget.categoryId,
      budgeted: resolvedAmount,
      spent,
      rolloverApplied: rolloverAmount,
      available,
      percentUsed: Math.round(percentUsed * 100) / 100,
      status: computeCategoryStatus(percentUsed),
    });

    totalBudgeted += resolvedAmount;
    totalSpent += spent;
  }

  const remaining = totalBudgeted - totalSpent;
  const adherencePercent = computeWeightedAdherence(categories);
  const overallStatus = adherencePercent >= 100 ? 'over' : adherencePercent >= 80 ? 'on_track' : 'under';

  const overall: OverallBudgetSummary = {
    totalBudgeted,
    totalSpent,
    remaining,
    adherencePercent: Math.round(adherencePercent * 100) / 100,
    status: overallStatus,
  };

  return { categories, overall };
}

function resolveBudgetAmount(
  budget: { categoryId: string; amount: number | null; percentage: number | null; rolloverEnabled: boolean },
  totalIncome: number,
): number {
  if (budget.amount !== null) {
    return budget.amount;
  }
  if (budget.percentage !== null && totalIncome > 0) {
    return Math.round(totalIncome * budget.percentage);
  }
  return 0;
}

function findSpentForCategory(
  categoryId: string,
  transactions: { categoryId: string; totalAmount: number }[],
): number {
  const found = transactions.find((t) => t.categoryId === categoryId);
  return found ? Math.abs(found.totalAmount) : 0;
}

function findRolloverForCategory(
  categoryId: string,
  rollovers: { categoryId: string; unspentAmount: number }[],
  rolloverEnabled: boolean,
): number {
  if (!rolloverEnabled) return 0;
  const found = rollovers.find((r) => r.categoryId === categoryId);
  return found ? Math.max(0, found.unspentAmount) : 0;
}
