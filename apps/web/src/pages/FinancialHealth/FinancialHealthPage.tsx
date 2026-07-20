import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useHealthStore } from '@/stores/intelligence/healthStore';
import { computeFinancialHealth } from '@/intelligence/FinancialHealthEngine';
import { analyzeTrends } from '@/intelligence/TrendAnalyzer';
import { generateIntelligence } from '@/intelligence/RecommendationScheduler';
import { FinancialEngine } from '@/services/FinancialEngine';
import { accountsApi } from '@/lib/api/accounts';
import { savingsApi } from '@/lib/api/savings';
import { useSubscriptionStore } from '@/stores/subscription';
import { FeatureGate } from '@/billing/billingGuard';
import type { IntelligenceInput } from '@/intelligence/types';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-brand-500';
  if (score >= 40) return 'text-amber-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-500';
}

function getHealthBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-brand-500';
  if (score >= 40) return 'bg-amber-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function getFactorColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-brand-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

export function FinancialHealthPage() {
  const { user } = useAuthStore();
  const { result, loading, setResult, setLoading, setError } = useHealthStore();
  const tier = useSubscriptionStore((s) => s.tier);
  const [trendData, setTrendData] = useState<number[]>([]);

  const compute = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [savingsGoalsRaw] = await Promise.all([
        savingsApi.list(user.id),
      ]);

      const dashboardData = await FinancialEngine.getDashboardData(user.id);

      const input: IntelligenceInput = {
        budgetSummary: {
          income: { total: dashboardData.cashFlow.monthlyIncome, averageDaily: dashboardData.cashFlow.monthlyIncome / 30 },
          expenses: { total: dashboardData.cashFlow.monthlyExpenses, byCategory: dashboardData.budgetHealth.categories.map((c) => ({
            categoryId: c.categoryId, categoryName: c.categoryName, amount: c.spent,
            percentage: c.percentUsed, transactionCount: 0,
          }))},
          cashFlow: { netIncome: dashboardData.cashFlow.cashFlow, dailySpendingAllowance: 0, safeToSpendToday: 0, projectedEndBalance: 0 },
          budgetStatus: {
            categories: dashboardData.budgetHealth.categories.map((c) => ({
              categoryId: c.categoryId, categoryName: c.categoryName, budgeted: c.budgeted,
              spent: c.spent, remaining: c.remaining, percentUsed: c.percentUsed, status: c.status as any,
            })),
            overBudget: dashboardData.budgetHealth.categories.filter((c) => c.percentUsed > 100).map((c) => ({
              categoryId: c.categoryId, categoryName: c.categoryName, budgeted: c.budgeted,
              spent: c.spent, remaining: c.remaining, percentUsed: c.percentUsed, status: 'over' as const,
            })),
            underBudget: dashboardData.budgetHealth.categories.filter((c) => c.percentUsed <= 100).map((c) => ({
              categoryId: c.categoryId, categoryName: c.categoryName, budgeted: c.budgeted,
              spent: c.spent, remaining: c.remaining, percentUsed: c.percentUsed, status: c.status as any,
            })),
            totalBudgeted: dashboardData.budgetHealth.totalBudgeted,
            totalSpent: dashboardData.budgetHealth.totalSpent,
            totalRemaining: dashboardData.budgetHealth.remaining,
          },
          accounts: { netWorth: dashboardData.netWorth.netWorth, remainingCash: 0, totalAssets: dashboardData.netWorth.totalAssets, totalLiabilities: dashboardData.netWorth.totalLiabilities, accountCount: dashboardData.netWorth.accounts.length },
          savingsCapacity: { recommendedAmount: 0, savingsRate: 0, surplus: dashboardData.cashFlow.cashFlow },
          alerts: [],
        },
        cashFlowSummary: {
          totalIncome: dashboardData.cashFlow.monthlyIncome,
          totalExpenses: dashboardData.cashFlow.monthlyExpenses,
          netFlow: dashboardData.cashFlow.cashFlow,
          dailyBalances: [],
          sevenDayTrend: 0,
          thirtyDayTrend: 0,
          incomeVsExpenseRatio: dashboardData.cashFlow.monthlyExpenses > 0 ? dashboardData.cashFlow.monthlyIncome / dashboardData.cashFlow.monthlyExpenses : 0,
        },
        savingsGoals: savingsGoalsRaw,
        mortgageData: dashboardData.mortgages[0] ? {
          remainingBalance: dashboardData.mortgages[0].remainingBalance,
          monthlyPayment: dashboardData.mortgages[0].monthlyPayment,
          progressPct: dashboardData.mortgages[0].progressPct,
          payoffDate: dashboardData.mortgages[0].payoffDate,
          totalInterest: dashboardData.mortgages[0].totalInterest,
          principalPaid: dashboardData.mortgages[0].remainingBalance > 0
            ? dashboardData.mortgages[0].totalCost - dashboardData.mortgages[0].totalInterest - dashboardData.mortgages[0].remainingBalance
            : dashboardData.mortgages[0].totalCost - dashboardData.mortgages[0].totalInterest,
        } : undefined,
        transactions: dashboardData.recentTransactions.map((t) => ({
          id: t.id, amount: t.amount, date: t.date,
          category: t.categoryName ?? 'Uncategorized',
          merchant: t.merchant,
        })),
      };

      const health = computeFinancialHealth(input);
      const trends = analyzeTrends(input);
      generateIntelligence(input);

      setResult(health);
      setTrendData(trends.dailyBalances);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compute financial health');
    }
  }, [user, setResult, setLoading, setError]);

  useEffect(() => {
    if (!result) compute();
  }, [compute, result]);

  if (loading && !result) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-slate-500">Analyzing your financial health...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-64 items-center justify-center">
        <button onClick={compute} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
          Analyze Financial Health
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Health</h1>
        <button
          onClick={compute}
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900" aria-label="Financial health score">
        <div className="mb-1 flex items-center justify-center gap-1.5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">Overall Score</h2>
          <InfoTooltip content="A composite score from 0-100 based on cash flow, savings rate, budget adherence, debt levels, and emergency fund coverage" />
        </div>
        <div className={`text-6xl font-bold ${getHealthColor(result.overallScore)}`}>
          {result.overallScore}
        </div>
        <p className="mt-2 text-xs text-slate-500">out of 100</p>
        <div className="mx-auto mt-4 h-2 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all ${getHealthBg(result.overallScore)}`}
            style={{ width: `${result.overallScore}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{result.breakdown}</p>
      </div>

      <h2 className="sr-only text-sm font-semibold text-slate-900 dark:text-white">Health Factors</h2>
      <div className="grid gap-4 md:grid-cols-2" role="list">
        {result.factors.map((factor) => (
          <div key={factor.factor} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900 dark:text-white">{factor.label}</span>
              <span className={`text-sm font-bold ${getHealthColor(factor.score)}`}>{factor.score}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${getFactorColor(factor.score)}`}
                style={{ width: `${factor.score}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">{factor.description}</p>
          </div>
        ))}
      </div>

      <FeatureGate feature="advanced_reports">
        {result.improvementSuggestions.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Improvement Suggestions</h2>
            <div className="space-y-3">
              {result.improvementSuggestions.map((s) => (
                <div key={s.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
                    s.impact === 'high' ? 'bg-red-500' : s.impact === 'medium' ? 'bg-amber-500' : 'bg-brand-500'
                  }`}>
                    {s.impact === 'high' ? '!' : s.impact === 'medium' ? '•' : 'i'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{s.message}</p>
                    {s.actionLabel && (
                      <button className="mt-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                        {s.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </FeatureGate>
    </div>
  );
}
