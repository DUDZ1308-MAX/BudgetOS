import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { savingsApi } from '@/lib/api/savings';
import { mortgageApi } from '@/lib/api/mortgage';
import { recurringApi } from '@/lib/api/recurring';
import { categoriesApi } from '@/lib/api/categories';
import { FinancialEngine } from '@/services/FinancialEngine';
import { IconReports } from '@/components/ui/Icons';
import { useReportFilters } from './useReportFilters';
import { applyFilters } from './utils/reportCalculator';
import {
  computeMonthlyKpis, computeCashFlowChart, computeCategoryPieChart,
  computeBudgetBarChart, computeSavingsBarChart, computeMortgageChart,
  computeNetWorthChart, computeIncomeTrendChart, computeExpenseTrendChart,
  computeRecurringSummary, computeForecastSummary,
} from './utils/reportCalculator';
import {
  generateCashFlowInsights, generateSpendingInsights, generateBudgetInsights,
  generateSavingsInsights, generateNetWorthInsights, generateMortgageInsights,
  generateRecurringInsights,
} from './utils/reportInsights';
import { exportReportCSV, exportReportExcel, exportReportPDF, buildCategoryExport, buildMonthlyTrendExport, buildBudgetExport } from './utils/reportExporter';
import { ReportChart } from './components/ReportChart';
import { ReportMetricsRow } from './components/ReportMetricsRow';
import { ReportInsightsPanel } from './components/ReportInsightsPanel';
import { ReportExporter } from './components/ReportExporter';
import type { ReportTab, TimeRange } from './reportTypes';

const timeRanges: { key: TimeRange; label: string }[] = [
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: '6m', label: '6 Months' },
  { key: '1y', label: '1 Year' },
  { key: 'all', label: 'All Time' },
];

export function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { state: filterState, filters, tabs, setTab, setTimeRange, setType } = useReportFilters();

  const { data: accounts = [] } = useQuery({ queryKey: ['accounts', user?.id], queryFn: () => accountsApi.list(user!.id), enabled: !!user });
  const { data: allTxns = [] } = useQuery({ queryKey: ['transactions-all', user?.id], queryFn: () => transactionsApi.list(user!.id), enabled: !!user });
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets', user?.id], queryFn: () => budgetsApi.list(user!.id), enabled: !!user });
  const { data: savingsGoals = [] } = useQuery({ queryKey: ['savings-goals', user?.id], queryFn: () => savingsApi.list(user!.id), enabled: !!user });
  const { data: mortgages = [] } = useQuery({ queryKey: ['mortgages', user?.id], queryFn: () => mortgageApi.list(user!.id), enabled: !!user });
  const { data: recurrings = [] } = useQuery({ queryKey: ['recurring-transactions', user?.id], queryFn: () => recurringApi.list(user!.id), enabled: !!user });
  const { data: categories = [] } = useQuery({ queryKey: ['categories', user?.id], queryFn: () => categoriesApi.list(user!.id), enabled: !!user });

  const hasData = accounts.length > 0 || allTxns.length > 0 || budgets.length > 0;

  const filteredTxns = useMemo(() => applyFilters(allTxns, filters), [allTxns, filters]);

  const netWorth = useMemo(() => FinancialEngine.getNetWorth(accounts), [accounts]);
  const cashFlow = useMemo(() => FinancialEngine.getCashFlow(filteredTxns, recurrings, filters.dateRange), [filteredTxns, recurrings, filters.dateRange]);

  const tabContent = useMemo(() => {
    if (!hasData) return null;
    const tab = filterState.tab;

    switch (tab) {
      case 'monthly': {
        const kpis = computeMonthlyKpis(filteredTxns, recurrings, accounts, filters.dateRange);
        const cashFlowChart = computeCashFlowChart(filteredTxns, filters.dateRange);
        const categoryChart = computeCategoryPieChart(filteredTxns, categories);
        const insights = [
          ...generateCashFlowInsights(cashFlow.monthlyIncome, cashFlow.monthlyExpenses, cashFlow.cashFlow),
          ...generateNetWorthInsights(netWorth.netWorth),
        ];
        return { kpis, charts: [cashFlowChart, categoryChart], insights };
      }

      case 'income': {
        const incomeTxns = filteredTxns.filter((t) => Number(t.amount) > 0);
        const totalIncome = incomeTxns.reduce((s, t) => s + Number(t.amount), 0);
        const chart = computeIncomeTrendChart(filteredTxns);
        const kpis = [
          { label: 'Total Income', value: `$${totalIncome.toLocaleString()}`, color: 'var(--status-success)' },
          { label: 'Monthly Avg', value: `$${(totalIncome / Math.max(1, incomeTxns.length || 1)).toLocaleString()}`, color: 'var(--text-primary)' },
          { label: 'Transactions', value: incomeTxns.length.toLocaleString(), color: 'var(--text-primary)' },
        ];
        return { kpis, charts: [chart], insights: [] };
      }

      case 'expenses': {
        const expenseTxns = filteredTxns.filter((t) => Number(t.amount) < 0);
        const totalExpenses = expenseTxns.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
        const chart = computeExpenseTrendChart(filteredTxns);
        const kpis = [
          { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}`, color: 'var(--status-error)' },
          { label: 'Monthly Avg', value: `$${(totalExpenses / Math.max(1, expenseTxns.length || 1)).toLocaleString()}`, color: 'var(--text-primary)' },
          { label: 'Transactions', value: expenseTxns.length.toLocaleString(), color: 'var(--text-primary)' },
        ];
        return { kpis, charts: [chart, computeCategoryPieChart(filteredTxns, categories)], insights: [] };
      }

      case 'category': {
        const expenseTxns = filteredTxns.filter((t) => Number(t.amount) < 0);
        const totalExpenses = expenseTxns.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
        const categoryChart = computeCategoryPieChart(filteredTxns, categories);
        const catData = (categoryChart.data as Array<{ name: string; value: number; share: number }>);
        const kpis = [
          { label: 'Total Categories', value: catData.length.toLocaleString(), color: 'var(--text-primary)' },
          { label: 'Total Spending', value: `$${totalExpenses.toLocaleString()}`, color: 'var(--status-error)' },
        ];
        const insights = generateSpendingInsights(catData, totalExpenses);
        return { kpis, charts: [categoryChart], insights };
      }

      case 'cashflow': {
        const chart = computeCashFlowChart(filteredTxns, filters.dateRange);
        const kpis = computeMonthlyKpis(filteredTxns, recurrings, accounts, filters.dateRange);
        const insights = generateCashFlowInsights(cashFlow.monthlyIncome, cashFlow.monthlyExpenses, cashFlow.cashFlow);
        return { kpis, charts: [chart], insights };
      }

      case 'budget': {
        const budgetChart = computeBudgetBarChart(budgets, filteredTxns, categories, cashFlow.monthlyIncome);
        const budgetHealth = FinancialEngine.getBudgetHealth(budgets, filteredTxns, categories, cashFlow.monthlyIncome);
        const kpis = [
          { label: 'Total Budgeted', value: `$${budgetHealth.totalBudgeted.toLocaleString()}`, color: 'var(--text-primary)' },
          { label: 'Total Spent', value: `$${budgetHealth.totalSpent.toLocaleString()}`, color: 'var(--status-error)' },
          { label: 'Remaining', value: `$${budgetHealth.remaining.toLocaleString()}`, color: 'var(--status-success)' },
          { label: 'Adherence', value: `${budgetHealth.adherencePercent.toFixed(0)}%`, color: budgetHealth.adherencePercent >= 80 ? 'var(--status-success)' : 'var(--status-warning)' },
        ];
        const onTrack = budgetHealth.categories.filter((c) => c.status === 'under' || c.status === 'on_track').length;
        const over = budgetHealth.categories.filter((c) => c.status === 'over').length;
        const insights = generateBudgetInsights(onTrack, over, budgetHealth.categories.length, budgetHealth.adherencePercent);
        return { kpis, charts: [budgetChart], insights };
      }

      case 'savings': {
        const savingsResults = FinancialEngine.getSavingsGoals(savingsGoals);
        const totalSaved = savingsResults.reduce((s, g) => s + g.currentAmount, 0);
        const totalTarget = savingsResults.reduce((s, g) => s + g.targetAmount, 0);
        const completedGoals = savingsResults.filter((g) => g.percentComplete >= 100).length;
        const chart = computeSavingsBarChart(savingsGoals);
        const kpis = [
          { label: 'Total Saved', value: `$${totalSaved.toLocaleString()}`, color: 'var(--status-success)' },
          { label: 'Total Target', value: `$${totalTarget.toLocaleString()}`, color: 'var(--text-primary)' },
          { label: 'Progress', value: totalTarget > 0 ? `${((totalSaved / totalTarget) * 100).toFixed(0)}%` : '-', color: 'var(--accent-primary)' },
          { label: 'Completed', value: completedGoals.toLocaleString(), color: 'var(--status-success)' },
        ];
        const insights = generateSavingsInsights(totalSaved, totalTarget, completedGoals, savingsResults.length);
        return { kpis, charts: [chart], insights };
      }

      case 'mortgage': {
        if (mortgages.length === 0) return null;
        const mortgage = mortgages[0]!;
        const mortgageResult = FinancialEngine.getMortgages(mortgages);
        const mr = mortgageResult[0];
        const chart = computeMortgageChart(mortgage);
        const kpis = mr ? [
          { label: 'Monthly Payment', value: `$${mr.monthlyPayment.toLocaleString()}`, color: 'var(--text-primary)' },
          { label: 'Remaining Balance', value: `$${mr.remainingBalance.toLocaleString()}`, color: 'var(--status-error)' },
          { label: 'Payoff Date', value: mr.payoffDate ? new Date(mr.payoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-', color: 'var(--status-success)' },
          { label: 'Interest Saved', value: `$${mr.interestSaved.toLocaleString()}`, color: 'var(--status-success)' },
        ] : [];
        const insights = mr ? generateMortgageInsights(mr.progressPct, mr.interestSaved, mr.remainingBalance) : [];
        return { kpis, charts: [chart], insights };
      }

      case 'networth': {
        const chart = computeNetWorthChart(filteredTxns, accounts);
        const kpis = [
          { label: 'Net Worth', value: `$${netWorth.netWorth.toLocaleString()}`, color: netWorth.netWorth >= 0 ? 'var(--status-success)' : 'var(--status-error)' },
          { label: 'Total Assets', value: `$${netWorth.totalAssets.toLocaleString()}`, color: 'var(--status-success)' },
          { label: 'Total Liabilities', value: `$${netWorth.totalLiabilities.toLocaleString()}`, color: 'var(--status-error)' },
        ];
        const insights = generateNetWorthInsights(netWorth.netWorth);
        return { kpis, charts: [chart], insights };
      }

      case 'recurring': {
        const chart = computeRecurringSummary(recurrings);
        const activeRecurrings = recurrings.filter((r: any) => r.status === 'active');
        const monthlyTotal = activeRecurrings
          .filter((r: any) => r.type === 'expense')
          .reduce((s: number, r: any) => s + Math.abs(Number(r.amount)), 0);
        const kpis = [
          { label: 'Active Recurring', value: activeRecurrings.length.toLocaleString(), color: 'var(--text-primary)' },
          { label: 'Monthly Total', value: `$${monthlyTotal.toLocaleString()}`, color: 'var(--status-error)' },
          { label: 'Recurring Income', value: `$${activeRecurrings.filter((r: any) => r.type === 'income').reduce((s: number, r: any) => s + Math.abs(Number(r.amount)), 0).toLocaleString()}`, color: 'var(--status-success)' },
        ];
        const insights = generateRecurringInsights(activeRecurrings.length, monthlyTotal);
        return { kpis, charts: [chart], insights };
      }

      case 'forecast': {
        const savingsResults = FinancialEngine.getSavingsGoals(savingsGoals);
        const totalSaved = savingsResults.reduce((s, g) => s + g.currentAmount, 0);
        const totalDebt = netWorth.totalLiabilities;
        const savingsRate = cashFlow.monthlyIncome > 0 ? ((cashFlow.cashFlow / cashFlow.monthlyIncome) * 100) : 0;
        const chart = computeForecastSummary(netWorth.netWorth, totalSaved, totalDebt, cashFlow.monthlyIncome, cashFlow.monthlyExpenses);
        const kpis = [
          { label: 'Current Net Worth', value: `$${netWorth.netWorth.toLocaleString()}`, color: 'var(--text-primary)' },
          { label: 'Monthly Cash Flow', value: `$${cashFlow.cashFlow.toLocaleString()}`, color: cashFlow.cashFlow >= 0 ? 'var(--status-success)' : 'var(--status-error)' },
          { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? 'var(--status-success)' : 'var(--status-warning)' },
        ];
        return { kpis, charts: [chart], insights: [] };
      }

      default:
        return null;
    }
  }, [filterState.tab, filteredTxns, filters, accounts, categories, budgets, savingsGoals, mortgages, recurrings, hasData, cashFlow, netWorth]);

  const budgetHealth = useMemo(
    () => FinancialEngine.getBudgetHealth(budgets, filteredTxns, categories, cashFlow.monthlyIncome),
    [budgets, filteredTxns, categories, cashFlow.monthlyIncome],
  );

  const handleExportCSV = useCallback(() => {
    if (!tabContent) return;
    const tab = filterState.tab;
    if (tab === 'category' || tab === 'expenses') {
      const catChart = tabContent.charts.find((c) => c.title === 'Spending Breakdown');
      if (catChart) {
        exportReportCSV(buildCategoryExport(catChart.data as Array<{ name: string; value: number; share: number }>));
      }
    } else {
      const monthlyChart = tabContent.charts.find((c) => c.title === 'Cash Flow Trend');
      if (monthlyChart) {
        exportReportCSV(buildMonthlyTrendExport(monthlyChart.data as Array<{ month: string; income: number; expenses: number; net: number }>));
      }
    }
  }, [tabContent, filterState.tab]);

  const handleExportExcel = useCallback(async () => {
    const exports = [];
    if (tabContent) {
      for (const chart of tabContent.charts) {
        if (chart.type === 'pie') {
          exports.push(buildCategoryExport(chart.data as Array<{ name: string; value: number; share: number }>));
        } else {
          exports.push(buildMonthlyTrendExport(chart.data as Array<{ month: string; income: number; expenses: number; net: number }>));
        }
      }
    }
    if (filterState.tab === 'budget') {
      const bd = budgetHealth.categories.map((c) => ({ category: c.categoryName, budgeted: c.budgeted, spent: c.spent, remaining: c.remaining }));
      exports.push(buildBudgetExport(bd));
    }
    if (exports.length > 0) {
      await exportReportExcel('BudgetOS Report', exports);
    }
  }, [tabContent, filterState.tab, budgetHealth]);

  const handleExportPDF = useCallback(async () => {
    const exports = [];
    if (tabContent) {
      for (const chart of tabContent.charts) {
        if (chart.type === 'pie') {
          exports.push(buildCategoryExport(chart.data as Array<{ name: string; value: number; share: number }>));
        } else {
          exports.push(buildMonthlyTrendExport(chart.data as Array<{ month: string; income: number; expenses: number; net: number }>));
        }
      }
    }
    if (filterState.tab === 'budget') {
      const bd = budgetHealth.categories.map((c) => ({ category: c.categoryName, budgeted: c.budgeted, spent: c.spent, remaining: c.remaining }));
      exports.push(buildBudgetExport(bd));
    }
    if (exports.length > 0) {
      await exportReportPDF('BudgetOS Report', exports);
    }
  }, [tabContent, filterState.tab, budgetHealth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold sm:text-xl" style={{ color: 'var(--text-primary)' }}>Reports & Analytics</h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>Comprehensive financial analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <ReportExporter onExportCSV={handleExportCSV} onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} disabled={!hasData} />
        </div>
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 sm:py-16" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'var(--accent-subtle)' }}>
            <IconReports className="h-6 w-6" style={{ color: 'var(--accent-text)' }} />
          </div>
          <h2 className="mt-4 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No data to report on yet</h2>
          <p className="mt-1 max-w-sm text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Add accounts, transactions, and budgets to see detailed reports with cash flow trends, category breakdowns, and savings projections.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('/accounts')} className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ background: 'var(--accent-primary)' }}>
              Add Account
            </button>
            <button onClick={() => navigate('/transactions/add')} className="rounded-xl border px-4 py-2 text-sm font-medium transition-colors" style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Add Transaction
            </button>
          </div>
        </div>
      )}

      {/* Tab bar */}
      {hasData && (
        <>
          <div className="flex gap-1 overflow-x-auto rounded-xl border p-1 scrollbar-none" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)', WebkitOverflowScrolling: 'touch' }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center rounded-lg px-3 min-h-[44px] text-xs font-medium whitespace-nowrap transition-colors ${
                  filterState.tab === t.key
                    ? 'text-white'
                    : ''
                }`}
                style={{
                  background: filterState.tab === t.key ? 'var(--accent-primary)' : 'transparent',
                  color: filterState.tab === t.key ? 'white' : 'var(--text-secondary)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Time Range + Type Filter */}
          <div className="flex flex-wrap gap-2 items-center">
            {timeRanges.map((r) => (
              <button
                key={r.key}
                onClick={() => setTimeRange(r.key)}
                className="flex items-center rounded-lg px-3 min-h-[44px] text-xs font-medium transition-colors"
                style={{
                  background: filterState.timeRange === r.key ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: filterState.timeRange === r.key ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${filterState.timeRange === r.key ? 'transparent' : 'var(--border-default)'}`,
                }}
              >
                {r.label}
              </button>
            ))}
            <div className="hidden sm:block w-px h-5" style={{ background: 'var(--border-default)' }} />
            {(['all', 'income', 'expense'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="flex items-center rounded-lg px-3 min-h-[44px] text-xs font-medium transition-colors"
                style={{
                  background: filterState.type === t ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: filterState.type === t ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${filterState.type === t ? 'transparent' : 'var(--border-default)'}`,
                }}
              >
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tabContent && (
    <div className="space-y-4 sm:space-y-5 md:space-y-5 lg:space-y-6">
              <ReportMetricsRow metrics={tabContent.kpis} />
              <div className="grid gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
                {tabContent.charts.slice(0, 2).map((chart, i) => (
                  <ReportChart key={i} config={chart} />
                ))}
              </div>
              {tabContent.charts.length > 2 && (
                <div className="grid gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
                  {tabContent.charts.slice(2).map((chart, i) => (
                    <ReportChart key={i + 2} config={chart} />
                  ))}
                </div>
              )}
              <ReportInsightsPanel insights={tabContent.insights} />
            </div>
          )}

          {/* No data for this tab */}
          {!tabContent && filterState.tab === 'mortgage' && (
            <div className="rounded-xl border-2 border-dashed p-6 sm:p-12 text-center" style={{ borderColor: 'var(--border-default)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No mortgage data. Add a mortgage to see reports.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
