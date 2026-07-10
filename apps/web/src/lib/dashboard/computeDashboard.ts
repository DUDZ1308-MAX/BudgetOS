import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { categoriesApi } from '@/lib/api/categories';
import { budgetsApi } from '@/lib/api/budgets';
import type { CategoryBudgetStatus, DashboardSummaryData } from './types';

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[dashboard] ${method}`, ...args);
}

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return { start: `${year}-${month}-01`, end: `${year}-${month}-${String(lastDay).padStart(2, '0')}` };
}

export async function computeDashboard(userId: string): Promise<DashboardSummaryData> {
  const range = currentMonthRange();

  debug('fetching data for', userId, range);

  const [accounts, categories, budgets, transactions] = await Promise.all([
    accountsApi.list(userId),
    categoriesApi.list(userId),
    budgetsApi.list(userId, new Date().getFullYear(), new Date().getMonth() + 1),
    transactionsApi.list(userId, { dateFrom: range.start, dateTo: range.end }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Net Worth = sum of all account balances
  const netWorth = accounts.reduce((sum, a) => sum + Number(a.balance ?? 0), 0);

  // Monthly income / expenses (from current month transactions)
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  const categorySpending: Map<string, { name: string; amount: number }> = new Map();

  for (const txn of transactions) {
    const amount = Number(txn.amount ?? 0);
    const cat = txn.category_id ? categoryMap.get(txn.category_id) : null;
    if (cat?.type === 'income') {
      monthlyIncome += Math.abs(amount);
    } else {
      monthlyExpenses += Math.abs(amount);
    }

    if (cat && txn.category_id) {
      const existing = categorySpending.get(txn.category_id);
      if (existing) {
        existing.amount += Math.abs(amount);
      } else {
        categorySpending.set(txn.category_id, { name: cat.name, amount: Math.abs(amount) });
      }
    }
  }

  // Cash flow
  const cashFlow = monthlyIncome - monthlyExpenses;

  // Top 5 spending categories
  const sortedCategories = [...categorySpending.values()].sort((a, b) => b.amount - a.amount);
  const topSpendingCategories = sortedCategories.slice(0, 5).map((cat) => ({
    categoryName: cat.name,
    amount: cat.amount,
  }));

  // Budget vs Actual per category
  const budgetUtilization: CategoryBudgetStatus[] = budgets.map((b) => {
    const cat = b.category_id ? categoryMap.get(b.category_id) : null;
    const spent = b.category_id ? Math.abs(categorySpending.get(b.category_id)?.amount ?? 0) : 0;
    const budgeted = Number(b.amount ?? 0);
    const remaining = budgeted - spent;
    const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;
    return {
      categoryId: b.category_id,
      categoryName: cat?.name ?? 'Unknown',
      budgeted,
      spent,
      remaining,
      percentUsed,
    };
  });

  // Recent transactions (last 5)
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const recentTransactions = transactions.slice(0, 5).map((txn) => {
    const cat = txn.category_id ? categoryMap.get(txn.category_id) : null;
    return {
      id: txn.id,
      amount: Number(txn.amount ?? 0),
      date: txn.date,
      merchant: txn.merchant,
      categoryName: cat?.name ?? null,
      accountName: txn.account_id ? accountMap.get(txn.account_id) ?? null : null,
    };
  });

  const result: DashboardSummaryData = {
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    cashFlow,
    topSpendingCategories,
    budgetUtilization,
    recentTransactions,
  };

  debug('result', result);
  return result;
}
