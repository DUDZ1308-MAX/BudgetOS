import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { savingsApi } from '@/lib/api/savings';
import { mortgageApi } from '@/lib/api/mortgage';
import { recurringApi } from '@/lib/api/recurring';
import { categoriesApi } from '@/lib/api/categories';
import { toMonthlyEquivalent } from '@budgetos/engine';
import type { RecurringFrequency } from '@budgetos/shared';
import { formatCurrency } from '@/services/transactionService';
import { computeBudgetSummary } from '@/engine/BudgetEngine';
import { computeCashFlowSummary } from '@/engine/CashFlowEngine';
import { computeSavingsDashboard } from '@/engine/SavingsEngine';
import { computeMortgage } from '@/engine/MortgageEngine';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { IconReports } from '@/components/ui/Icons';
import { InteractiveDonut } from '@/components/dashboard/InteractiveDonut';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

type ReportTab = 'monthly' | 'budget' | 'savings' | 'mortgage' | 'health' | 'recurring';

function dateRangeFromTab(tab: string): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  if (tab === 'last3') {
    const s = new Date(y, now.getMonth() - 2, 1);
    return { start: s.toISOString().slice(0, 10), end: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
  }
  if (tab === 'last12') {
    const s = new Date(y - 1, now.getMonth(), 1);
    return { start: s.toISOString().slice(0, 10), end: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
  }
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
}

function TooltipCard({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
}

export function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [tab, setTab] = useState<ReportTab>('monthly');
  const [rangeTab, setRangeTab] = useState('current');

  const range = useMemo(() => dateRangeFromTab(rangeTab), [rangeTab]);

  const { data: accounts = [] } = useQuery({ queryKey: ['accounts', user?.id], queryFn: () => accountsApi.list(user!.id), enabled: !!user });
  const { data: allTxns = [] } = useQuery({ queryKey: ['transactions-all', user?.id], queryFn: () => transactionsApi.list(user!.id), enabled: !!user });
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets', user?.id], queryFn: () => budgetsApi.list(user!.id), enabled: !!user });
  const { data: savingsGoals = [] } = useQuery({ queryKey: ['savings-goals', user?.id], queryFn: () => savingsApi.list(user!.id), enabled: !!user });
  const { data: mortgages = [] } = useQuery({ queryKey: ['mortgages', user?.id], queryFn: () => mortgageApi.list(user!.id), enabled: !!user });
  const { data: recurrings = [] } = useQuery({ queryKey: ['recurring-transactions', user?.id], queryFn: () => recurringApi.list(user!.id), enabled: !!user });
  const { data: categories = [] } = useQuery({ queryKey: ['categories', user?.id], queryFn: () => categoriesApi.list(user!.id), enabled: !!user });

  const hasData = accounts.length > 0 || allTxns.length > 0 || budgets.length > 0 || savingsGoals.length > 0 || mortgages.length > 0;

  const monthTxns = useMemo(() => allTxns.filter((t) => t.date >= range.start && t.date <= range.end), [allTxns, range]);
  const allCategories = [...new Set(allTxns.filter((t) => t.category_id).map((t) => t.category_id!))];

  const budgetSummary = useMemo(() => {
    if (!accounts.length && !monthTxns.length) return null;
    try {
      return computeBudgetSummary({
        transactions: monthTxns.map((t) => ({
          id: t.id, account_id: t.account_id ?? '', category_id: t.category_id ?? '',
          amount: Number(t.amount), date: t.date, merchant: t.merchant ?? '', note: t.note ?? '', is_archived: false,
        })),
        accounts: accounts.map((a) => ({
          id: a.id, name: a.name, type: a.type as any, balance: Number(a.balance), is_active: a.is_active ?? true,
        })),
        categories: [],
        budgets: [],
        dateRange: range,
      });
    } catch { return null; }
  }, [monthTxns, accounts, range]);

  const cashFlow = useMemo(() => {
    if (!accounts.length && !allTxns.length) return null;
    try {
      return computeCashFlowSummary({
        transactions: allTxns.map((t) => ({
          id: t.id, account_id: t.account_id ?? '', category_id: t.category_id ?? '',
          amount: Number(t.amount), date: t.date, merchant: t.merchant ?? '', note: t.note ?? '', is_archived: false,
        })),
        accounts: accounts.map((a) => ({
          id: a.id, name: a.name, type: a.type as any, balance: Number(a.balance), is_active: a.is_active ?? true,
        })),
      });
    } catch { return null; }
  }, [allTxns, accounts]);

  const savingsDash = useMemo(() => computeSavingsDashboard(savingsGoals), [savingsGoals]);

  const mortgageCalc = useMemo(() => {
    if (!mortgages.length) return null;
    const m = mortgages[0]!;
    return computeMortgage({
      principal: Number(m.principal),
      annualRate: Number(m.annual_rate),
      termYears: Number(m.term_years),
      startDate: m.start_date ?? new Date().toISOString().slice(0, 10),
    });
  }, [mortgages]);

  // Category spending breakdown for charts
  const categorySpending = useMemo(() => {
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const map = new Map<string, number>();
    for (const t of monthTxns) {
      const amt = Math.abs(Number(t.amount));
      const cat = t.category_id || 'Uncategorized';
      map.set(cat, (map.get(cat) ?? 0) + amt);
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([catId, value]) => ({
        id: catId,
        name: categoryMap.get(catId) ?? (catId === 'Uncategorized' ? 'Uncategorized' : catId.slice(0, 12)),
        value,
        percent: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [monthTxns, categories]);

  // Monthly spending trend
  const monthlyTrend = useMemo(() => {
    const months = new Map<string, { income: number; expenses: number }>();
    for (const t of allTxns) {
      const key = t.date.slice(0, 7);
      if (!months.has(key)) months.set(key, { income: 0, expenses: 0 });
      const d = months.get(key)!;
      const amt = Number(t.amount);
      if (amt >= 0) d.income += amt;
      else d.expenses += Math.abs(amt);
    }
    return Array.from(months.entries()).map(([month, v]) => ({ month, ...v })).slice(-12);
  }, [allTxns]);

  // Savings growth
  const savingsGrowth = useMemo(() => {
    return savingsGoals.map((g) => ({
      name: g.name.slice(0, 14),
      saved: Number(g.current_amount),
      target: Number(g.target_amount),
    }));
  }, [savingsGoals]);

  // Mortgage balance projection
  const mortgageBalanceData = useMemo(() => {
    if (!mortgageCalc?.schedule) return [];
    return mortgageCalc.schedule.filter((_, i) => i % 12 === 0 || i === mortgageCalc.schedule.length - 1).map((r) => ({
      year: `${Math.floor(r.month / 12) + 1}y`,
      balance: r.remainingBalance,
    }));
  }, [mortgageCalc]);

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'monthly', label: 'Monthly Summary' },
    { key: 'budget', label: 'Budget' },
    { key: 'savings', label: 'Savings' },
    { key: 'mortgage', label: 'Mortgage' },
    { key: 'health', label: 'Financial Health' },
    { key: 'recurring', label: 'Recurring vs Manual' },
  ];

  const recurringExpenses = useMemo(() => {
    const recurringTxnIds = new Set(recurrings.map((r) => r.id));
    const withRecurring = allTxns.filter((t) => t.recurring_id);
    const withoutRecurring = allTxns.filter((t) => !t.recurring_id && t.amount < 0);
    return {
      recurringTotal: withRecurring.reduce((s, t) => s + Math.abs(Number(t.amount)), 0),
      manualTotal: withoutRecurring.reduce((s, t) => s + Math.abs(Number(t.amount)), 0),
      recurringCount: withRecurring.length,
      manualCount: withoutRecurring.length,
    };
  }, [allTxns, recurrings]);

  const upcomingObligations = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return recurrings
      .filter((r) => r.type === 'expense' && r.status === 'active')
      .map((r) => ({
        name: r.name,
        amount: Math.abs(Number(r.amount)),
        monthlyAmount: toMonthlyEquivalent(Math.abs(Number(r.amount)), r.frequency as RecurringFrequency),
        nextRun: r.next_run,
        frequency: r.frequency,
      }))
      .sort((a, b) => a.nextRun.localeCompare(b.nextRun));
  }, [recurrings]);

  function exportCSV(data: Record<string, any>[], filename: string) {
    if (!data.length) return;
    const headers = Object.keys(data[0]!);
    const csv = [headers.join(','), ...data.map((r) => headers.map((h) => `"${r[h] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function categorySpendingCSV() {
    return categorySpending.map((c) => ({ Category: c.name, Spent: c.value }));
  }

  function exportCurrentCSV() { exportCSV(categorySpendingCSV(), `spending-${range.start}`); }
  function exportAllCSV() { exportCSV(monthlyTrend, `monthly-trend-${new Date().getFullYear()}`); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
        <div className="flex gap-2">
          {hasData && (
            <>
              <button onClick={exportCurrentCSV} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">CSV</button>
              <button onClick={exportAllCSV} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">Export All</button>
            </>
          )}
        </div>
      </div>

      {!hasData && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
            <IconReports className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No data to report on yet</h2>
          <p className="mt-1 max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
            Add accounts, transactions, and budgets to see detailed reports with cash flow trends, category breakdowns, and savings projections.
          </p>
          <div className="mt-5 flex gap-3">
            <button onClick={() => navigate('/accounts')} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
              Add Account
            </button>
            <button onClick={() => navigate('/transactions/add')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
              Add Transaction
            </button>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex gap-2">
        {['current', 'last3', 'last12'].map((r) => (
          <button key={r} onClick={() => setRangeTab(r)} className={`rounded-lg px-3 py-1 text-xs font-medium ${rangeTab === r ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
            {r === 'current' ? 'This Month' : r === 'last3' ? 'Last 3 Months' : 'Last 12 Months'}
          </button>
        ))}
      </div>

      {tab === 'monthly' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Income</p>
              <p className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(budgetSummary?.income.total ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Expenses</p>
              <p className="mt-1.5 text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(budgetSummary?.expenses.total ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cash Flow</p>
              <p className={`mt-1.5 text-2xl font-bold ${(budgetSummary?.cashFlow.netIncome ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(budgetSummary?.cashFlow.netIncome ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Savings Rate</p>
              <p className="mt-1.5 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {budgetSummary && budgetSummary.income.total > 0 ? `${((budgetSummary.cashFlow.netIncome / budgetSummary.income.total) * 100).toFixed(1)}%` : '-'}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Spending breakdown - Premium Interactive Donut */}
            <InteractiveDonut
              data={categorySpending.map((c) => ({ name: c.name, value: c.value, percent: c.percent / 100 }))}
              title="Spending Breakdown"
            />

            {/* Monthly trend */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Cash Flow Trend</h3>
              {monthlyTrend.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No trend data.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TooltipCard />} />
                      <Legend iconType="circle" formatter={(v: string) => <span className="text-xs text-slate-500">{v}</span>} />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'budget' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Budgeted</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(budgets.reduce((s, b) => s + Number(b.amount), 0))}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Spent</p>
              <p className="mt-1.5 text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(budgetSummary?.expenses.total ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Remaining</p>
              <p className={`mt-1.5 text-2xl font-bold ${budgets.reduce((s, b) => s + Number(b.amount), 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {formatCurrency(Math.max(0, budgets.reduce((s, b) => s + Number(b.amount), 0) - (budgetSummary?.expenses.total ?? 0)))}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Budget Health</p>
              <p className="mt-1.5 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {budgets.reduce((s, b) => s + Number(b.amount), 0) > 0
                  ? `${Math.round((1 - (budgetSummary?.expenses.total ?? 0) / budgets.reduce((s, b) => s + Number(b.amount), 0)) * 100)}%`
                  : '-'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Category Spending</h3>
            {categorySpending.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No budget data.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categorySpending} layout="vertical" margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<TooltipCard />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16}>
                      {categorySpending.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'savings' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Saved</p>
              <p className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(savingsDash.totalSaved)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Target</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(savingsDash.totalTarget)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Progress</p>
              <p className="mt-1.5 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {savingsDash.totalTarget > 0 ? `${((savingsDash.totalSaved / savingsDash.totalTarget) * 100).toFixed(1)}%` : '-'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed Goals</p>
              <p className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{savingsDash.completedGoals}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Goal Progress</h3>
            {savingsGrowth.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No savings goals yet.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingsGrowth} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TooltipCard />} />
                    <Legend iconType="circle" formatter={(v: string) => <span className="text-xs text-slate-500">{v}</span>} />
                    <Bar dataKey="saved" name="Saved" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    <Bar dataKey="target" name="Target" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'mortgage' && (
        <div className="space-y-6">
          {!mortgageCalc ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
              <p className="text-sm text-slate-400">No mortgage data. Add a mortgage to see reports.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Payment</p>
                  <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(mortgageCalc.paymentAmount)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Interest</p>
                  <p className="mt-1.5 text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(mortgageCalc.totalInterest)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Payoff Date</p>
                  <p className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{mortgageCalc.payoffDate ? new Date(mortgageCalc.payoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Cost</p>
                  <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(mortgageCalc.totalPrincipal + mortgageCalc.totalInterest)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Balance Projection</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mortgageBalanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<TooltipCard />} />
                      <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'recurring' && (
        <div className="space-y-6">
          {/* Recurring vs Manual */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Recurring Spending</p>
              <p className="mt-1.5 text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(recurringExpenses.recurringTotal)}</p>
              <p className="text-xs text-slate-400">{recurringExpenses.recurringCount} transactions</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Manual Spending</p>
              <p className="mt-1.5 text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(recurringExpenses.manualTotal)}</p>
              <p className="text-xs text-slate-400">{recurringExpenses.manualCount} transactions</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Obligations</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{upcomingObligations.length}</p>
              <p className="text-xs text-slate-400">active recurring</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Recurring Total</p>
              <p className="mt-1.5 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(upcomingObligations.reduce((s, o) => s + o.monthlyAmount, 0))}</p>
            </div>
          </div>

          {/* Upcoming Obligations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Upcoming Monthly Obligations</h3>
            {upcomingObligations.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No recurring expenses set up.</p>
            ) : (
              <div className="space-y-2">
                {upcomingObligations.map((ob) => (
                  <div key={ob.name} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{ob.name}</p>
                      <p className="text-xs text-slate-400">{ob.frequency} &middot; {new Date(ob.nextRun).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(ob.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'health' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Net Worth</p>
              <p className="mt-1.5 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(accounts.reduce((s, a) => s + Number(a.balance), 0))}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cash Flow</p>
              <p className={`mt-1.5 text-2xl font-bold ${(budgetSummary?.cashFlow.netIncome ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(budgetSummary?.cashFlow.netIncome ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Savings Rate</p>
              <p className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {budgetSummary && budgetSummary.income.total > 0 ? `${((budgetSummary.cashFlow.netIncome / budgetSummary.income.total) * 100).toFixed(1)}%` : '-'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Income</p>
              <p className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(budgetSummary?.income.total ?? 0)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
