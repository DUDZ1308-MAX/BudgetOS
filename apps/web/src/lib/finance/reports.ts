import { sumIncome, sumExpenses, sumByCategory, sumByMerchant, sumByMonth, filterRecurring, filterManual, type TransactionInput } from './transactions';
import { calculateNetWorth, type AccountInput } from './accounts';

export interface IncomeVsExpenseReport {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  incomeVsExpenseRatio: number;
}

export interface CategoryBreakdownReport {
  categoryId: string | null;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MerchantTotalReport {
  merchant: string;
  total: number;
  transactionCount: number;
}

export interface MonthlyComparisonReport {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface YearOverYearReport {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

export interface RecurringVsManualReport {
  recurringTotal: number;
  manualTotal: number;
  recurringCount: number;
  manualCount: number;
}

export function computeIncomeVsExpense(
  transactions: TransactionInput[],
): IncomeVsExpenseReport {
  const totalIncome = sumIncome(transactions);
  const totalExpenses = sumExpenses(transactions);
  const netIncome = totalIncome - totalExpenses;
  const incomeVsExpenseRatio = totalExpenses > 0
    ? Math.round((totalIncome / totalExpenses) * 100) / 100
    : totalIncome > 0 ? Infinity : 0;

  return { totalIncome, totalExpenses, netIncome, incomeVsExpenseRatio };
}

export function computeCategoryBreakdown(
  transactions: TransactionInput[],
): CategoryBreakdownReport[] {
  const byCategory = sumByCategory(transactions);
  const total = Object.values(byCategory).reduce((s, v) => s + v, 0) || 1;

  return Object.entries(byCategory).map(([categoryId, amount]) => ({
    categoryId: categoryId === '__uncategorized__' ? null : categoryId,
    amount,
    percentage: Math.round((amount / total) * 100 * 100) / 100,
    transactionCount: transactions.filter(
      (t) => (t.category_id ?? '__uncategorized__') === categoryId,
    ).length,
  }));
}

export function computeMerchantTotals(
  transactions: TransactionInput[],
): MerchantTotalReport[] {
  const byMerchant = sumByMerchant(transactions);

  return Object.entries(byMerchant)
    .filter(([name]) => name !== '__unknown__')
    .map(([merchant, total]) => ({
      merchant,
      total,
      transactionCount: transactions.filter(
        (t) => (t.merchant ?? '__unknown__') === merchant,
      ).length,
    }))
    .sort((a, b) => b.total - a.total);
}

export function computeMonthlyComparison(
  transactions: TransactionInput[],
): MonthlyComparisonReport[] {
  const byMonth = new Map<string, { income: number; expenses: number }>();

  for (const t of transactions) {
    if (t.is_archived) continue;
    const monthKey = t.date.slice(0, 7);
    const entry = byMonth.get(monthKey) ?? { income: 0, expenses: 0 };
    if (t.amount > 0 || t.type === 'income') {
      entry.income += Math.abs(t.amount);
    } else if (t.amount < 0 || t.type === 'expense') {
      entry.expenses += Math.abs(t.amount);
    }
    byMonth.set(monthKey, entry);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expenses }]) => ({
      month,
      income,
      expenses,
      net: income - expenses,
    }));
}

export function computeYearOverYearComparison(
  transactions: TransactionInput[],
): YearOverYearReport[] {
  const byYear = new Map<number, { income: number; expenses: number }>();

  for (const t of transactions) {
    if (t.is_archived) continue;
    const year = parseInt(t.date.slice(0, 4), 10);
    const entry = byYear.get(year) ?? { income: 0, expenses: 0 };
    if (t.amount > 0 || t.type === 'income') {
      entry.income += Math.abs(t.amount);
    } else if (t.amount < 0 || t.type === 'expense') {
      entry.expenses += Math.abs(t.amount);
    }
    byYear.set(year, entry);
  }

  return Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, { income, expenses }]) => ({
      year,
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
    }));
}

export function computeNetWorthTrend(
  accounts: AccountInput[],
  transactions: TransactionInput[],
): { netWorth: number; trend: 'up' | 'down' | 'stable' } {
  const netWorth = calculateNetWorth(accounts);
  const netIncome = sumIncome(transactions) - sumExpenses(transactions);

  let trend: 'up' | 'down' | 'stable';
  if (netIncome > 0) trend = 'up';
  else if (netIncome < 0) trend = 'down';
  else trend = 'stable';

  return { netWorth, trend };
}

export function computeRecurringVsManual(
  transactions: TransactionInput[],
): RecurringVsManualReport {
  const recurring = filterRecurring(transactions);
  const manual = filterManual(transactions);

  return {
    recurringTotal: recurring.reduce((s, t) => s + Math.abs(t.amount), 0),
    manualTotal: manual.reduce((s, t) => s + Math.abs(t.amount), 0),
    recurringCount: recurring.length,
    manualCount: manual.length,
  };
}
