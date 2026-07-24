import { FinancialEngine } from '@/services/FinancialEngine';
import { formatCurrency } from '@/services/transactionService';
import type { Account, Budget, Category, Transaction, SavingsGoal, Mortgage } from '@budgetos/database';
import type { TimeRange, ReportFilters, KpiMetric, ChartConfig, ChartSeries } from '../reportTypes';

export function computeTimeRange(timeRange: TimeRange): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);

  switch (timeRange) {
    case '30d': {
      const s = new Date(y, m, now.getDate() - 30);
      return { start: s.toISOString().slice(0, 10), end };
    }
    case '90d': {
      const s = new Date(y, m - 2, 1);
      return { start: s.toISOString().slice(0, 10), end };
    }
    case '6m': {
      const s = new Date(y, m - 5, 1);
      return { start: s.toISOString().slice(0, 10), end };
    }
    case '1y': {
      const s = new Date(y - 1, m, 1);
      return { start: s.toISOString().slice(0, 10), end };
    }
    case 'all':
    default:
      return { start: '2000-01-01', end };
  }
}

export function applyFilters(txns: Transaction[], filters: ReportFilters): Transaction[] {
  return txns.filter((t) => {
    if (t.is_archived) return false;
    if (filters.type === 'income' && Number(t.amount) < 0) return false;
    if (filters.type === 'expense' && Number(t.amount) >= 0) return false;
    if (filters.accountId && t.account_id !== filters.accountId) return false;
    if (filters.categoryId && t.category_id !== filters.categoryId) return false;
    if (t.date < filters.dateRange.start || t.date > filters.dateRange.end) return false;
    return true;
  });
}

export function computeMonthlyKpis(
  txns: Transaction[],
  recurrings: Array<{ amount: number; frequency: string; type: string; status: string }>,
  accounts: Account[],
  range: { start: string; end: string },
): KpiMetric[] {
  const cashFlow = FinancialEngine.getCashFlow(txns, recurrings, range);
  const netWorth = FinancialEngine.getNetWorth(accounts);
  const savingsRate = cashFlow.monthlyIncome > 0 ? ((cashFlow.cashFlow / cashFlow.monthlyIncome) * 100) : 0;

  return [
    { label: 'Income', value: formatCurrency(cashFlow.monthlyIncome), color: 'var(--status-success)' },
    { label: 'Expenses', value: formatCurrency(cashFlow.monthlyExpenses), color: 'var(--status-error)' },
    { label: 'Cash Flow', value: formatCurrency(cashFlow.cashFlow), color: cashFlow.cashFlow >= 0 ? 'var(--status-success)' : 'var(--status-error)' },
    { label: 'Net Worth', value: formatCurrency(netWorth.netWorth), color: netWorth.netWorth >= 0 ? 'var(--status-success)' : 'var(--status-error)' },
    { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? 'var(--status-success)' : 'var(--status-warning)' },
  ];
}

export function computeCashFlowChart(txns: Transaction[], _range: { start: string; end: string }): ChartConfig {
  const byMonth = new Map<string, { income: number; expenses: number }>();
  for (const t of txns) {
    const key = t.date.slice(0, 7);
    const e = byMonth.get(key) ?? { income: 0, expenses: 0 };
    const amt = Math.abs(Number(t.amount));
    if (Number(t.amount) >= 0) e.income += amt; else e.expenses += amt;
    byMonth.set(key, e);
  }
  const data = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([month, v]) => ({ month, income: v.income, expenses: v.expenses, net: v.income - v.expenses }));
  const series: ChartSeries[] = [
    { name: 'Income', dataKey: 'income', color: '#10b981', type: 'area' },
    { name: 'Expenses', dataKey: 'expenses', color: '#ef4444', type: 'area' },
    { name: 'Net', dataKey: 'net', color: '#6366f1', type: 'line' },
  ];
  return { title: 'Cash Flow Trend', type: 'area', data, series, xKey: 'month' };
}

export function computeCategoryPieChart(txns: Transaction[], categories: Category[]): ChartConfig {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const map = new Map<string, number>();
  for (const t of txns) {
    if (Number(t.amount) >= 0) continue;
    const cat = t.category_id || 'Uncategorized';
    map.set(cat, (map.get(cat) ?? 0) + Math.abs(Number(t.amount)));
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0) || 1;
  const data = Array.from(map.entries()).map(([id, value]) => ({ name: categoryMap.get(id) ?? (id === 'Uncategorized' ? 'Uncategorized' : id.slice(0, 12)), value, percent: Math.round((value / total) * 100) }))
    .sort((a, b) => b.value - a.value).slice(0, 8);
  const series: ChartSeries[] = [{ name: 'Spending', dataKey: 'value', color: '#6366f1' }];
  return { title: 'Spending Breakdown', type: 'pie', data, series, xKey: 'name' };
}

export function computeBudgetBarChart(
  budgets: Budget[],
  txns: Transaction[],
  categories: Category[],
  monthlyIncome: number,
): ChartConfig {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const categorySpending = new Map<string, number>();
  for (const t of txns) {
    if (!t.category_id || Number(t.amount) >= 0) continue;
    categorySpending.set(t.category_id, (categorySpending.get(t.category_id) ?? 0) + Math.abs(Number(t.amount)));
  }
  const budgetHealth = FinancialEngine.getBudgetHealth(budgets, txns, categories, monthlyIncome);
  const data = budgetHealth.categories.map((c) => ({
    category: categoryMap.get(c.categoryId) ?? c.categoryName,
    budgeted: c.budgeted,
    spent: c.spent,
    remaining: c.remaining,
  })).sort((a, b) => b.budgeted - a.budgeted);
  const series: ChartSeries[] = [
    { name: 'Budgeted', dataKey: 'budgeted', color: '#6366f1', type: 'bar' },
    { name: 'Spent', dataKey: 'spent', color: '#ef4444', type: 'bar' },
  ];
  return { title: 'Budget vs Actual', type: 'bar', data, series, xKey: 'category' };
}

export function computeSavingsBarChart(savingsGoals: SavingsGoal[]): ChartConfig {
  const data = savingsGoals.map((g) => ({
    name: g.name.slice(0, 14),
    saved: Number(g.current_amount ?? 0),
    target: Number(g.target_amount ?? 0),
    progress: Number(g.target_amount ?? 0) > 0 ? Math.round((Number(g.current_amount ?? 0) / Number(g.target_amount ?? 0)) * 100) : 0,
  }));
  const series: ChartSeries[] = [
    { name: 'Saved', dataKey: 'saved', color: '#10b981', type: 'bar' },
    { name: 'Target', dataKey: 'target', color: '#6366f1', type: 'bar' },
  ];
  return { title: 'Savings Goal Progress', type: 'bar', data, series, xKey: 'name' };
}

export function computeMortgageChart(mortgage: Mortgage): ChartConfig {
  const schedule = FinancialEngine.getMortgageSchedule(mortgage);
  if (!schedule.length) return { title: 'Mortgage Balance', type: 'line', data: [], series: [], xKey: 'year' };
  const data = schedule.filter((_, i) => i % 12 === 0 || i === schedule.length - 1).map((r) => ({
    year: `${Math.floor(r.month / 12) + 1}y`,
    balance: r.remainingBalance,
    equity: mortgage.principal ? Number(mortgage.principal) - r.remainingBalance : 0,
  }));
  const series: ChartSeries[] = [
    { name: 'Balance', dataKey: 'balance', color: '#6366f1', type: 'area' },
    { name: 'Equity', dataKey: 'equity', color: '#10b981', type: 'area' },
  ];
  return { title: 'Mortgage Balance Projection', type: 'area', data, series, xKey: 'year' };
}

export function computeNetWorthChart(txns: Transaction[], accounts: Account[]): ChartConfig {
  const byMonth = new Map<string, number>();
  const netWorth = FinancialEngine.getNetWorth(accounts);
  for (const t of txns) {
    const key = t.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, netWorth.netWorth);
  }
  if (byMonth.size === 0) {
    byMonth.set(new Date().toISOString().slice(0, 7), netWorth.netWorth);
  }
  const data = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month]) => ({ month, netWorth: netWorth.netWorth }));
  const series: ChartSeries[] = [{ name: 'Net Worth', dataKey: 'netWorth', color: '#6366f1', type: 'line' }];
  return { title: 'Net Worth Timeline', type: 'line', data, series, xKey: 'month' };
}

export function computeIncomeTrendChart(txns: Transaction[]): ChartConfig {
  const byMonth = new Map<string, number>();
  for (const t of txns) {
    if (Number(t.amount) < 0) continue;
    const key = t.date.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(t.amount));
  }
  const data = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([month, value]) => ({ month, income: value }));
  const series: ChartSeries[] = [{ name: 'Income', dataKey: 'income', color: '#10b981', type: 'area' }];
  return { title: 'Income Trend', type: 'area', data, series, xKey: 'month' };
}

export function computeExpenseTrendChart(txns: Transaction[]): ChartConfig {
  const byMonth = new Map<string, number>();
  for (const t of txns) {
    if (Number(t.amount) >= 0) continue;
    const key = t.date.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Math.abs(Number(t.amount)));
  }
  const data = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([month, value]) => ({ month, expenses: value }));
  const series: ChartSeries[] = [{ name: 'Expenses', dataKey: 'expenses', color: '#ef4444', type: 'area' }];
  return { title: 'Expense Trend', type: 'area', data, series, xKey: 'month' };
}

export function computeRecurringSummary(
  recurrings: Array<{ amount: number; type: string; frequency: string; status: string; name: string }>,
): ChartConfig {
  const active = recurrings.filter((r) => r.status === 'active');
  let recurringIncome = 0; let recurringExpenses = 0;
  for (const r of active) {
    if (r.type === 'income') recurringIncome += Math.abs(r.amount);
    else recurringExpenses += Math.abs(r.amount);
  }
  const data = [
    { name: 'Recurring Income', value: recurringIncome },
    { name: 'Recurring Expenses', value: recurringExpenses },
  ];
  const series: ChartSeries[] = [{ name: 'Amount', dataKey: 'value', color: '#6366f1' }];
  return { title: 'Recurring Summary', type: 'pie', data, series, xKey: 'name' };
}

export function computeForecastSummary(
  netWorth: number, savings: number, debt: number,
  monthlyIncome: number, monthlyExpenses: number,
): ChartConfig {
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  const projections = FinancialEngine.getProjections(netWorth, savings, debt, monthlyIncome, monthlyExpenses, savingsRate, 0, 0, 0.07, []);
  const periods = projections.projections.slice(0, 12);
  const data = periods.map((p) => ({ month: p.label, netWorth: p.netWorth, savings: p.savings }));
  const series: ChartSeries[] = [
    { name: 'Net Worth', dataKey: 'netWorth', color: '#6366f1', type: 'line' },
    { name: 'Savings', dataKey: 'savings', color: '#10b981', type: 'area' },
  ];
  return { title: 'Forecast Projection', type: 'line', data, series, xKey: 'month' };
}
