"use client";

import { useState, useMemo, useCallback } from 'react';
import { FinancialEngine } from '@/services/FinancialEngine';
import { IconTarget, IconTrendingUp, IconTrendingDown } from '@/components/ui/Icons';
import { usePlanningScenarios, useCreatePlanningScenario, useDeletePlanningScenario } from '../hooks/usePlanningScenarios';
import type { Account, Transaction, RecurringTransaction, SavingsGoal, Mortgage, Budget, Category } from '@budgetos/database';

interface ScenarioManagerProps {
  accounts: Account[];
  transactions: Transaction[];
  recurrings: RecurringTransaction[];
  savings: SavingsGoal[];
  mortgages: Mortgage[];
  budgets: Budget[];
  categories: Category[];
}

interface ScenarioAdjustment {
  type: 'income' | 'expense' | 'savings' | 'debt' | 'investment';
  value: number;
  label: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  adjustments: ScenarioAdjustment[];
}

const PRESET_SCENARIOS: Scenario[] = [
  {
    id: 'current',
    name: 'Current Plan',
    description: 'No changes from current financial situation',
    adjustments: [],
  },
  {
    id: 'extra-savings',
    name: 'Extra Savings',
    description: 'Add $200/month to savings goals',
    adjustments: [{ type: 'savings', value: 200, label: 'Extra $200/month savings' }],
  },
  {
    id: 'reduce-expenses',
    name: 'Reduce Expenses',
    description: 'Cut monthly expenses by $300',
    adjustments: [{ type: 'expense', value: -300, label: 'Reduce expenses by $300' }],
  },
  {
    id: 'income-boost',
    name: 'Income Boost',
    description: 'Increase monthly income by $500',
    adjustments: [{ type: 'income', value: 500, label: 'Increase income by $500' }],
  },
  {
    id: 'accelerate-mortgage',
    name: 'Accelerate Mortgage',
    description: 'Add $500/month extra mortgage payment',
    adjustments: [{ type: 'debt', value: 500, label: 'Extra $500/month mortgage payment' }],
  },
];

export function ScenarioManager({
  accounts,
  transactions,
  recurrings,
  savings,
  mortgages,
  budgets,
  categories,
}: ScenarioManagerProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['current']);
  const [showNewScenario, setShowNewScenario] = useState(false);
  const [newScenario, setNewScenario] = useState<Partial<Scenario>>({});

  const { data: dbScenarios = [] } = usePlanningScenarios();
  const createScenario = useCreatePlanningScenario();
  const deleteScenario = useDeletePlanningScenario();

  const customScenarios: Scenario[] = useMemo(() =>
    dbScenarios.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description ?? '',
      adjustments: s.adjustments as ScenarioAdjustment[],
    })),
    [dbScenarios]
  );

  const allScenarios = useMemo(() => [...PRESET_SCENARIOS, ...customScenarios], [customScenarios]);

  const dateRange = useMemo(() => {
    const now = new Date();
    return { start: now.toISOString().slice(0, 10), end: new Date(now.getFullYear() + 5, now.getMonth(), now.getDate()).toISOString().slice(0, 10) };
  }, []);

  const baselineData = useMemo(() => {
    const netWorth = FinancialEngine.getNetWorth(accounts);
    const cashFlow = FinancialEngine.getCashFlow(transactions, recurrings, dateRange);
    const budgetHealth = FinancialEngine.getBudgetHealth(budgets, transactions, categories, cashFlow.monthlyIncome);
    return { netWorth, cashFlow, budgetHealth };
  }, [accounts, transactions, recurrings, budgets, categories, dateRange]);

  const scenarioResults = useMemo(() => {
    return selectedScenarios.map((scenarioId) => {
      const scenario = allScenarios.find((s) => s.id === scenarioId);
      if (!scenario) return null;

      let adjustedIncome = baselineData.cashFlow.monthlyIncome;
      let adjustedExpenses = baselineData.cashFlow.monthlyExpenses;
      let adjustedSavings = savings.reduce((s, g) => s + Number(g.monthly_contribution || 0), 0);
      let adjustedDebt = mortgages.reduce((s, m) => {
        const principal = m.principal - m.down_payment;
        const monthlyRate = m.annual_rate / 100 / 12;
        const numPayments = m.term_years * 12;
        const payment = monthlyRate > 0
          ? principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
          : principal / numPayments;
        return s + payment + (m.extra_payment || 0);
      }, 0);

      scenario.adjustments.forEach((adj) => {
        switch (adj.type) {
          case 'income':
            adjustedIncome += adj.value;
            break;
          case 'expense':
            adjustedExpenses += adj.value;
            break;
          case 'savings':
            adjustedSavings += adj.value;
            break;
          case 'debt':
            adjustedDebt += adj.value;
            break;
        }
      });

      const adjustedCashFlow = adjustedIncome - adjustedExpenses;
      const adjustedSavingsRate = adjustedIncome > 0 ? (adjustedSavings / adjustedIncome) * 100 : 0;

      const projections = [];
      let projectedNetWorth = baselineData.netWorth.netWorth;
      let projectedSavings = savings.reduce((s, g) => s + Number(g.current_amount || 0), 0);

      for (let year = 1; year <= 5; year++) {
        const annualSavings = adjustedCashFlow * 12;
        projectedSavings += annualSavings;
        projectedNetWorth += annualSavings + projectedNetWorth * 0.07;
        projections.push({
          year,
          netWorth: projectedNetWorth,
          savings: projectedSavings,
          debt: Math.max(0, baselineData.netWorth.totalLiabilities - adjustedDebt * 12 * year),
        });
      }

      return {
        ...scenario,
        metrics: {
          monthlyCashFlow: adjustedCashFlow,
          monthlySavings: adjustedSavings,
          savingsRate: adjustedSavingsRate,
          monthlyDebtPayment: adjustedDebt,
          projectedNetWorth5yr: projections[4]?.netWorth ?? baselineData.netWorth.netWorth,
        },
        projections,
      };
    }).filter(Boolean);
  }, [selectedScenarios, allScenarios, baselineData, savings, mortgages]);

  const toggleScenario = useCallback((id: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const addCustomScenario = useCallback(() => {
    if (!newScenario.name) return;
    createScenario.mutate({
      name: newScenario.name,
      description: newScenario.description || '',
      adjustments: newScenario.adjustments || [],
    });
    setNewScenario({});
    setShowNewScenario(false);
  }, [newScenario, createScenario]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Scenario Analysis</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Compare different financial scenarios</p>
          </div>
          <button
            onClick={() => setShowNewScenario(!showNewScenario)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + New Scenario
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {allScenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => toggleScenario(scenario.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                selectedScenarios.includes(scenario.id)
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {scenario.name}
            </button>
          ))}
        </div>

        {showNewScenario && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newScenario.name || ''}
                  onChange={(e) => setNewScenario((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Scenario name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={newScenario.description || ''}
                  onChange={(e) => setNewScenario((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Brief description"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={addCustomScenario}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Create Scenario
              </button>
              <button
                onClick={() => setShowNewScenario(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {scenarioResults.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Comparison Results</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 text-left font-medium text-slate-500 dark:text-slate-400">Scenario</th>
                  <th className="pb-3 text-right font-medium text-slate-500 dark:text-slate-400">Monthly Cash Flow</th>
                  <th className="pb-3 text-right font-medium text-slate-500 dark:text-slate-400">Savings Rate</th>
                  <th className="pb-3 text-right font-medium text-slate-500 dark:text-slate-400">5yr Net Worth</th>
                  <th className="pb-3 text-right font-medium text-slate-500 dark:text-slate-400">Impact</th>
                </tr>
              </thead>
              <tbody>
                {scenarioResults.map((result) => {
                  if (!result) return null;
                  const impact = result.metrics.projectedNetWorth5yr - baselineData.netWorth.netWorth;
                  return (
                    <tr key={result.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{result.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{result.description}</div>
                      </td>
                      <td className="py-3 text-right">
                        <span className={result.metrics.monthlyCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                          ${result.metrics.monthlyCashFlow.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-900 dark:text-slate-100">
                        {result.metrics.savingsRate.toFixed(1)}%
                      </td>
                      <td className="py-3 text-right text-slate-900 dark:text-slate-100">
                        ${result.metrics.projectedNetWorth5yr.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center gap-1 ${impact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {impact >= 0 ? <IconTrendingUp className="h-4 w-4" /> : <IconTrendingDown className="h-4 w-4" />}
                          {impact >= 0 ? '+' : ''}${impact.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {scenarioResults.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">5-Year Net Worth Projection</h3>
            <div className="space-y-3">
              {scenarioResults.map((result) => {
                if (!result) return null;
                return (
                  <div key={result.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{result.name}</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        ${result.projections[4]?.netWorth.toLocaleString() ?? 'N/A'}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-brand-500"
                        style={{
                          width: `${Math.min(100, (result.projections[4]?.netWorth ?? 0) / Math.max(...scenarioResults.map(r => r?.projections[4]?.netWorth ?? 0)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Monthly Budget Impact</h3>
            <div className="space-y-3">
              {scenarioResults.map((result) => {
                if (!result) return null;
                const baseline = baselineData.cashFlow.monthlyIncome;
                const change = result.metrics.monthlyCashFlow - baselineData.cashFlow.cashFlow;
                return (
                  <div key={result.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{result.name}</span>
                    <span className={`text-sm font-semibold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {change >= 0 ? '+' : ''}${change.toLocaleString()}/mo
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
