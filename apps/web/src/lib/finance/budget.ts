import { sumExpenses, sumByCategory, type TransactionInput } from './transactions';
import { daysBetween, currentMonthRange, daysRemainingInMonth } from './dates';

export interface BudgetInput {
  id?: string;
  category_id: string;
  year: number;
  month: number;
  amount: number;
  rollover: boolean;
}

export interface CategoryBudgetBreakdown {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'under' | 'on_track' | 'at_limit' | 'over';
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  categories: CategoryBudgetBreakdown[];
  overBudget: CategoryBudgetBreakdown[];
  underBudget: CategoryBudgetBreakdown[];
}

export function calculateBudgetRemaining(budgeted: number, spent: number): number {
  return Math.max(0, budgeted - spent);
}

export function calculateBudgetUsage(budgeted: number, spent: number): number {
  if (budgeted <= 0) return spent > 0 ? 100 : 0;
  return (spent / budgeted) * 100;
}

export function calculateBudgetVariance(budgeted: number, spent: number): number {
  return spent - budgeted;
}

export function calculateBudgetStatus(percentUsed: number): CategoryBudgetBreakdown['status'] {
  if (percentUsed > 100) return 'over';
  if (percentUsed >= 90) return 'at_limit';
  if (percentUsed >= 75) return 'on_track';
  return 'under';
}

export function calculateCategoryTotals(
  transactions: TransactionInput[],
  budgets: BudgetInput[],
): CategoryBudgetBreakdown[] {
  const spendingByCategory = sumByCategory(transactions);

  return budgets.map((budget) => {
    const spent = spendingByCategory[budget.category_id] ?? 0;
    const percentUsed = calculateBudgetUsage(budget.amount, spent);

    return {
      categoryId: budget.category_id,
      categoryName: '',
      budgeted: budget.amount,
      spent,
      remaining: calculateBudgetRemaining(budget.amount, spent),
      percentUsed,
      status: calculateBudgetStatus(percentUsed),
    };
  });
}

export function calculatePercentBudget(
  categoryAmount: number,
  totalAmount: number,
): number {
  if (totalAmount <= 0) return 0;
  return (categoryAmount / totalAmount) * 100;
}

export function calculateRollover(
  remaining: number,
  previousRollover: number,
  rolloverEnabled: boolean,
): number {
  if (!rolloverEnabled) return 0;
  return Math.max(0, remaining) + previousRollover;
}

export function calculateMonthlyTotals(
  transactions: TransactionInput[],
  budgets: BudgetInput[],
): BudgetSummary {
  const categories = calculateCategoryTotals(transactions, budgets);
  const totalBudgeted = categories.reduce((s, c) => s + c.budgeted, 0);
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
  const totalRemaining = categories.reduce((s, c) => s + c.remaining, 0);
  const enriched = categories.map((c) => ({
    ...c,
    status: calculateBudgetStatus(c.percentUsed),
  }));

  return {
    totalBudgeted,
    totalSpent,
    totalRemaining,
    categories: enriched,
    overBudget: enriched.filter((c) => c.status === 'over'),
    underBudget: enriched.filter((c) => c.status === 'under' || c.status === 'on_track'),
  };
}

export function computeBudgetSummary(input: {
  transactions: TransactionInput[];
  budgets: BudgetInput[];
}): BudgetSummary {
  return calculateMonthlyTotals(input.transactions, input.budgets);
}

export function calculateBudgetAdherence(budgets: CategoryBudgetBreakdown[]): number {
  if (budgets.length === 0) return 100;
  const overCount = budgets.filter((b) => b.status === 'over').length;
  const ratio = overCount / budgets.length;
  return Math.max(0, 100 - ratio * 100);
}
