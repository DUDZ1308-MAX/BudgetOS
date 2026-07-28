"use client";

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { savingsApi } from '@/lib/api/savings';
import { mortgageApi } from '@/lib/api/mortgage';
import { recurringApi } from '@/lib/api/recurring';
import { categoriesApi } from '@/lib/api/categories';
import { FinancialEngine } from '@/services/FinancialEngine';
import { IconPlanning, IconTarget, IconTrendingUp, IconChart, IconSparkles } from '@/components/ui/Icons';
import { ScenarioManager } from './components/ScenarioManager';
import { ForecastingView } from './components/ForecastingView';
import { GoalOptimizer } from './components/GoalOptimizer';
import { PlanningAssistant } from './components/PlanningAssistant';
import { FinancialTimeline } from './FinancialTimeline';
import { RetirementPlanner } from './RetirementPlanner';

type PlanningTab = 'overview' | 'scenarios' | 'forecasting' | 'goals' | 'timeline' | 'retirement' | 'assistant';

const tabs: { key: PlanningTab; label: string; icon: typeof IconPlanning }[] = [
  { key: 'overview', label: 'Overview', icon: IconPlanning },
  { key: 'scenarios', label: 'Scenarios', icon: IconTarget },
  { key: 'forecasting', label: 'Forecasting', icon: IconTrendingUp },
  { key: 'goals', label: 'Goals', icon: IconTarget },
  { key: 'timeline', label: 'Timeline', icon: IconChart },
  { key: 'retirement', label: 'Retirement', icon: IconTrendingUp },
  { key: 'assistant', label: 'AI Assistant', icon: IconSparkles },
];

export function PlanningPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<PlanningTab>('overview');

  const { data: accounts = [] } = useQuery({ queryKey: ['accounts', user?.id], queryFn: () => accountsApi.list(user!.id), enabled: !!user });
  const { data: allTxns = [] } = useQuery({ queryKey: ['transactions-all', user?.id], queryFn: () => transactionsApi.list(user!.id), enabled: !!user });
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets', user?.id], queryFn: () => budgetsApi.list(user!.id), enabled: !!user });
  const { data: savingsGoals = [] } = useQuery({ queryKey: ['savings-goals', user?.id], queryFn: () => savingsApi.list(user!.id), enabled: !!user });
  const { data: mortgages = [] } = useQuery({ queryKey: ['mortgages', user?.id], queryFn: () => mortgageApi.list(user!.id), enabled: !!user });
  const { data: recurrings = [] } = useQuery({ queryKey: ['recurring-transactions', user?.id], queryFn: () => recurringApi.list(user!.id), enabled: !!user });
  const { data: categories = [] } = useQuery({ queryKey: ['categories', user?.id], queryFn: () => categoriesApi.list(user!.id), enabled: !!user });

  const hasData = accounts.length > 0 || allTxns.length > 0;

  const overviewData = useMemo(() => {
    if (!hasData) return null;

    const dateRange = { start: '2025-01-01', end: '2025-12-31' };
    const netWorth = FinancialEngine.getNetWorth(accounts);
    const cashFlow = FinancialEngine.getCashFlow(allTxns, recurrings, dateRange);
    const savingsSnapshot = FinancialEngine.getSavingsSnapshot(savingsGoals);
    const healthScore = FinancialEngine.getHealthScoreV2(
      cashFlow,
      netWorth,
      FinancialEngine.getBudgetHealth(budgets, allTxns, categories, cashFlow.monthlyIncome),
      cashFlow.monthlyIncome / Math.max(cashFlow.monthlyExpenses, 1) * 100,
      cashFlow.monthlyExpenses,
      savingsGoals
    );

    const totalDebt = netWorth.totalLiabilities;
    const monthlySavings = savingsGoals.reduce((s, g) => s + Number(g.monthly_contribution || 0), 0);
    const savingsGoal = savingsGoals.reduce((s, g) => s + Number(g.target_amount || 0), 0);

    const projections = FinancialEngine.getProjections(
      netWorth.netWorth,
      savingsSnapshot.totalSaved,
      totalDebt,
      cashFlow.monthlyIncome,
      cashFlow.monthlyExpenses,
      cashFlow.cashFlow / Math.max(cashFlow.monthlyIncome, 1),
      FinancialEngine.getAvailableCash(accounts),
      totalDebt / 24,
      0.07,
      savingsGoals.map(g => ({ monthlyContribution: Number(g.monthly_contribution || 0), targetAmount: Number(g.target_amount || 0) }))
    );

    return {
      netWorth,
      cashFlow,
      savingsSnapshot,
      healthScore,
      totalDebt,
      monthlySavings,
      savingsGoal,
      projections,
    };
  }, [accounts, allTxns, budgets, savingsGoals, mortgages, recurrings, categories, hasData]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg">
          <IconPlanning className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Financial Planning</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Scenario planning, forecasting, and goal optimization</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {!hasData && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 sm:p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <IconPlanning className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No Financial Data</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Add accounts, transactions, and budgets to unlock planning features.
          </p>
        </div>
      )}

      {hasData && activeTab === 'overview' && overviewData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Net Worth</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                ${overviewData.netWorth.netWorth.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Cash Flow</div>
              <div className={`mt-1 text-2xl font-bold ${overviewData.cashFlow.cashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${overviewData.cashFlow.cashFlow.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Savings</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                ${overviewData.savingsSnapshot.totalSaved.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Health Score</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {overviewData.healthScore.overall?.score ?? 'N/A'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Debt</div>
              <div className="mt-1 text-xl font-bold text-red-600">${overviewData.totalDebt.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Savings</div>
              <div className="mt-1 text-xl font-bold text-emerald-600">${overviewData.monthlySavings.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Savings Goals Target</div>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                ${overviewData.savingsGoal.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">5-Year Projection</h3>
              <div className="space-y-2">
                {(overviewData.projections.projections ?? []).slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{p.label}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">${p.netWorth.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => setActiveTab('scenarios')} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Run Scenario Analysis</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Compare financial scenarios</div>
                </button>
                <button onClick={() => setActiveTab('forecasting')} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">View Projections</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Cash flow and net worth forecasts</div>
                </button>
                <button onClick={() => setActiveTab('retirement')} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Retirement Planner</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Plan for retirement readiness</div>
                </button>
                <button onClick={() => setActiveTab('assistant')} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">AI Planning Assistant</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Get personalized financial insights</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasData && activeTab === 'scenarios' && (
        <ScenarioManager
          accounts={accounts}
          transactions={allTxns}
          recurrings={recurrings}
          savings={savingsGoals}
          mortgages={mortgages}
          budgets={budgets}
          categories={categories}
        />
      )}

      {hasData && activeTab === 'forecasting' && (
        <ForecastingView
          accounts={accounts}
          transactions={allTxns}
          recurrings={recurrings}
          savings={savingsGoals}
          mortgages={mortgages}
          budgets={budgets}
          categories={categories}
        />
      )}

      {hasData && activeTab === 'goals' && (
        <GoalOptimizer
          accounts={accounts}
          transactions={allTxns}
          recurrings={recurrings}
          savings={savingsGoals}
          mortgages={mortgages}
          budgets={budgets}
          categories={categories}
        />
      )}

      {hasData && activeTab === 'timeline' && user && (
        <FinancialTimeline userId={user.id} />
      )}

      {hasData && activeTab === 'retirement' && user && (
        <RetirementPlanner userId={user.id} />
      )}

      {hasData && activeTab === 'assistant' && (
        <PlanningAssistant
          accounts={accounts}
          transactions={allTxns}
          recurrings={recurrings}
          savings={savingsGoals}
          mortgages={mortgages}
          budgets={budgets}
          categories={categories}
        />
      )}
    </div>
  );
}
