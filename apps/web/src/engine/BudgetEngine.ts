import { computeCategoryStatus } from '@budgetos/engine';
import type { EngineTransaction, EngineAccount, EngineBudget, BudgetSummary, CategoryBreakdown, Alert } from './types';

function sumByCategory(transactions: { category_id?: string | null; amount: number; type?: string }[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'income') continue;
    const catId = t.category_id || '__uncategorized__';
    result[catId] = (result[catId] ?? 0) + Math.abs(t.amount);
  }
  return result;
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = e.getTime() - s.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
}

export function computeBudgetSummary(input: {
  transactions: EngineTransaction[];
  accounts: EngineAccount[];
  categories: any[];
  budgets: EngineBudget[];
  dateRange: { start: string; end: string };
}): BudgetSummary {
  const { start, end } = input.dateRange;

  const activeTransactions: EngineTransaction[] = (input.transactions ?? []).filter(
    (t) => !t.is_archived && t.date >= start && t.date <= end,
  );

  const totalIncome = activeTransactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpenses = activeTransactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const netFlow = totalIncome - totalExpenses;
  const rangeDays = end && start ? daysBetween(start, end) : 1;
  const avgDaily = totalIncome / rangeDays;

  // Expense breakdown by category
  const categoryMap = new Map((input.categories ?? []).map((c: any) => [c.id, c.name]));
  const expenseByCategoryMap = new Map<string, { amount: number; count: number }>();
  for (const t of activeTransactions) {
    if (t.amount >= 0) continue;
    const catId = t.category_id || 'uncategorized';
    const existing = expenseByCategoryMap.get(catId) || { amount: 0, count: 0 };
    existing.amount += Math.abs(t.amount);
    existing.count += 1;
    expenseByCategoryMap.set(catId, existing);
  }
  const expenseTotal = Array.from(expenseByCategoryMap.values()).reduce((s, c) => s + c.amount, 0);
  const expenseBreakdown: CategoryBreakdown[] = Array.from(expenseByCategoryMap.entries()).map(([catId, { amount, count }]) => ({
    categoryId: catId,
    categoryName: categoryMap.get(catId) || '',
    amount,
    percentage: expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0,
    transactionCount: count,
  }));

  // Budget calculations
  const expenseTxns = activeTransactions.filter((t) => t.amount < 0);
  const sumByCatMap = sumByCategory(expenseTxns);
  const categoryBudgetBreakdowns = (input.budgets ?? []).map((b) => {
    const catTotal = sumByCatMap[b.category_id] || 0;
    const remaining = b.amount - catTotal;
    const percentUsed = b.amount > 0 ? (catTotal / b.amount) * 100 : (catTotal > 0 ? 100 : 0);
    const engineStatus = computeCategoryStatus(percentUsed);
    const statusMap: Record<string, 'under' | 'on_track' | 'at_limit' | 'over'> = {
      on_track: 'on_track', at_limit: 'at_limit', over: 'over', under: 'under',
    };
    const status = statusMap[engineStatus] || 'under';
    const catName = categoryMap.get(b.category_id) || '';
    return { categoryId: b.category_id, categoryName: catName, budgeted: b.amount, spent: catTotal, remaining, percentUsed, status };
  });

  const totalBudgeted = (input.budgets ?? []).reduce((s, b) => s + b.amount, 0);
  const totalSpent = (input.budgets ?? []).reduce((s, b) => s + (sumByCatMap[b.category_id] || 0), 0);
  const totalRemaining = (input.budgets ?? []).reduce((s, b) => s + (b.amount - (sumByCatMap[b.category_id] || 0)), 0);

  // Account metrics
  const activeAccounts = (input.accounts ?? []).filter((a) => a.is_active);
  const totalAssets = activeAccounts
    .filter((a) => a.balance > 0)
    .reduce((s, a) => s + Math.abs(a.balance), 0);
  const totalLiabilities = activeAccounts
    .filter((a) => a.balance < 0)
    .reduce((s, a) => s + a.balance, 0);
  const netWorth = activeAccounts.reduce((s, a) => s + a.balance, 0);

  // Savings capacity
  const surplus = netFlow > 0 ? Math.min(netFlow, Math.round(totalIncome * 0.2)) : 0;
  const savingsRate = totalIncome > 0 ? Math.round((surplus / totalIncome) * 100) : 0;

  // Alerts
  const alerts: Alert[] = [];
  for (const oc of categoryBudgetBreakdowns.filter((c) => c.status === 'over')) {
    alerts.push({
      type: 'overspend',
      severity: 'high',
      message: `Category "${oc.categoryName || oc.categoryId}" is over budget by $${Math.abs(oc.remaining).toFixed(2)}`,
      category: oc.categoryId,
    });
  }

  const totalBalance = activeAccounts.reduce((s, a) => s + a.balance, 0);
  if (totalBalance < 0) {
    alerts.push({
      type: 'low_balance',
      severity: 'high',
      message: 'Your total account balance is negative',
    });
  }

  const avgTransaction = activeTransactions.length > 0
    ? activeTransactions.reduce((s, t) => s + Math.abs(t.amount), 0) / activeTransactions.length
    : 0;
  for (const t of activeTransactions) {
    if (t.amount < 0 && avgTransaction > 0 && Math.abs(t.amount) > avgTransaction * 3) {
      const merchant = t.merchant || t.note || '';
      if (merchant) {
        alerts.push({
          type: 'unusual_spending',
          severity: 'medium',
          message: `Unusually high expense at ${merchant}: $${Math.abs(t.amount).toFixed(2)}`,
          category: t.category_id ?? undefined,
        });
      }
    }
  }

  const safeToSpend = rangeDays > 0 ? totalRemaining / rangeDays : 0;

  return {
    income: { total: totalIncome, averageDaily: avgDaily },
    expenses: { total: expenseTotal, byCategory: expenseBreakdown },
    cashFlow: {
      netIncome: netFlow,
      dailySpendingAllowance: safeToSpend,
      safeToSpendToday: safeToSpend,
      projectedEndBalance: 0,
    },
    budgetStatus: {
      categories: categoryBudgetBreakdowns,
      overBudget: categoryBudgetBreakdowns.filter((c) => c.status === 'over'),
      underBudget: categoryBudgetBreakdowns.filter((c) => c.status !== 'over'),
      totalBudgeted,
      totalSpent,
      totalRemaining,
    },
    accounts: {
      netWorth,
      remainingCash: netWorth,
      totalAssets,
      totalLiabilities,
      accountCount: activeAccounts.length,
    },
    savingsCapacity: {
      recommendedAmount: surplus,
      savingsRate,
      surplus,
    },
    alerts,
  };
}

export function createEmptyBudgetSummary(): BudgetSummary {
  return {
    income: { total: 0, averageDaily: 0 },
    expenses: { total: 0, byCategory: [] },
    cashFlow: { netIncome: 0, dailySpendingAllowance: 0, safeToSpendToday: 0, projectedEndBalance: 0 },
    budgetStatus: {
      categories: [], overBudget: [], underBudget: [],
      totalBudgeted: 0, totalSpent: 0, totalRemaining: 0,
    },
    accounts: { netWorth: 0, remainingCash: 0, totalAssets: 0, totalLiabilities: 0, accountCount: 0 },
    savingsCapacity: { recommendedAmount: 0, savingsRate: 0, surplus: 0 },
    alerts: [],
  };
}
