"use client";

import { useMemo } from 'react';
import { FinancialEngine } from '@/services/FinancialEngine';
import { IconTarget } from '@/components/ui/Icons';
import type { Account, Transaction, RecurringTransaction, SavingsGoal, Mortgage, Budget, Category } from '@budgetos/database';

interface GoalOptimizerProps {
  accounts: Account[];
  transactions: Transaction[];
  recurrings: RecurringTransaction[];
  savings: SavingsGoal[];
  mortgages: Mortgage[];
  budgets: Budget[];
  categories: Category[];
}

export function GoalOptimizer({
  accounts,
  transactions,
  recurrings,
  savings,
  mortgages,
  budgets,
  categories,
}: GoalOptimizerProps) {
  const dateRange = useMemo(() => {
    const now = new Date();
    return { start: now.toISOString().slice(0, 10), end: new Date(now.getFullYear() + 5, now.getMonth(), now.getDate()).toISOString().slice(0, 10) };
  }, []);

  const analysis = useMemo(() => {
    const cashFlow = FinancialEngine.getCashFlow(transactions, recurrings, dateRange);
    const netWorth = FinancialEngine.getNetWorth(accounts);
    const savingsSnapshot = FinancialEngine.getSavingsSnapshot(savings);
    const monthlySavings = savings.reduce((s, g) => s + Number(g.monthly_contribution || 0), 0);
    const availableForGoals = cashFlow.cashFlow;

    const goals = savings.map((goal) => {
      const current = Number(goal.current_amount || 0);
      const target = Number(goal.target_amount || 0);
      const monthly = Number(goal.monthly_contribution || 0);
      const progress = target > 0 ? (current / target) * 100 : 0;
      const remaining = target - current;
      const monthsToGoal = monthly > 0 ? remaining / monthly : Infinity;
      const targetDate = goal.target_date ? new Date(goal.target_date) : null;
      const projectedDate = monthsToGoal < Infinity
        ? new Date(Date.now() + monthsToGoal * 30 * 24 * 60 * 60 * 1000)
        : null;

      const isOnTrack = targetDate && projectedDate
        ? projectedDate <= targetDate
        : true;

      return {
        id: goal.id,
        name: goal.name,
        current,
        target,
        monthly,
        progress,
        remaining,
        monthsToGoal,
        targetDate: targetDate?.toISOString().slice(0, 10),
        projectedDate: projectedDate?.toISOString().slice(0, 10),
        isOnTrack,
        priority: target > 0 ? current / target : 0,
      };
    }).sort((a, b) => b.priority - a.priority);

    const totalMonthlyContributions = goals.reduce((s, g) => s + g.monthly, 0);
    const surplusAfterGoals = availableForGoals - totalMonthlyContributions;

    const optimizedAllocation = goals.map((goal) => {
      const shareOfTotal = goal.target > 0 ? goal.target / goals.reduce((s, g) => s + g.target, 0) : 0;
      const optimalMonthly = surplusAfterGoals > 0 ? surplusAfterGoals * shareOfTotal : 0;
      const adjustedMonthly = goal.monthly + optimalMonthly;
      const adjustedMonthsToGoal = adjustedMonthly > 0 ? goal.remaining / adjustedMonthly : Infinity;

      return {
        ...goal,
        optimalMonthly: Math.round(optimalMonthly),
        adjustedMonthly: Math.round(adjustedMonthly),
        adjustedMonthsToGoal: Math.round(adjustedMonthsToGoal),
      };
    });

    return {
      goals,
      totalMonthlyContributions,
      surplusAfterGoals,
      availableForGoals,
      optimizedAllocation,
      netWorth,
      savingsSnapshot,
    };
  }, [accounts, transactions, recurrings, savings, mortgages, budgets, categories, dateRange]);

  const formatMonths = (months: number) => {
    if (months === Infinity) return 'N/A';
    if (months < 12) return `${Math.round(months)} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
            <IconTarget className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Goal Optimization</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Optimize your savings goal allocation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">Available for Goals</div>
            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              ${analysis.availableForGoals.toLocaleString()}/mo
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">Current Contributions</div>
            <div className="mt-1 text-xl font-bold text-emerald-600">
              ${analysis.totalMonthlyContributions.toLocaleString()}/mo
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">Surplus After Goals</div>
            <div className={`mt-1 text-xl font-bold ${analysis.surplusAfterGoals >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ${analysis.surplusAfterGoals.toLocaleString()}/mo
            </div>
          </div>
        </div>
      </div>

      {analysis.goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <IconTarget className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No Savings Goals</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Create savings goals to see optimization recommendations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {analysis.optimizedAllocation.map((goal) => (
            <div
              key={goal.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{goal.name}</h3>
                    {goal.isOnTrack ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        On Track
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Behind Schedule
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Target: ${goal.target.toLocaleString()} by {goal.targetDate || 'No date set'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ${goal.current.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    of ${goal.target.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Progress</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{goal.progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${Math.min(100, goal.progress)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-sm">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Current Monthly</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">${goal.monthly}/mo</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Optimal Monthly</div>
                  <div className="font-medium text-brand-600">${goal.adjustedMonthly}/mo</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Current Timeline</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{formatMonths(goal.monthsToGoal)}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Optimized Timeline</div>
                  <div className="font-medium text-emerald-600">{formatMonths(goal.adjustedMonthsToGoal)}</div>
                </div>
              </div>

              {goal.optimalMonthly > 0 && (
                <div className="mt-4 rounded-lg bg-brand-50 p-3 dark:bg-brand-900/20">
                  <p className="text-sm text-brand-700 dark:text-brand-300">
                    <strong>Recommendation:</strong> Increase monthly contribution by ${goal.optimalMonthly} to reach this goal {formatMonths(goal.monthsToGoal - goal.adjustedMonthsToGoal)} faster.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
