"use client";

import { useState, useMemo } from 'react';
import { FinancialEngine } from '@/services/FinancialEngine';
import { IconTrendingUp } from '@/components/ui/Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Account, Transaction, RecurringTransaction, SavingsGoal, Mortgage, Budget, Category } from '@budgetos/database';

interface ForecastingViewProps {
  accounts: Account[];
  transactions: Transaction[];
  recurrings: RecurringTransaction[];
  savings: SavingsGoal[];
  mortgages: Mortgage[];
  budgets: Budget[];
  categories: Category[];
}

type ForecastPeriod = '1y' | '3y' | '5y' | '10y';

const PERIODS: { key: ForecastPeriod; label: string; years: number }[] = [
  { key: '1y', label: '1 Year', years: 1 },
  { key: '3y', label: '3 Years', years: 3 },
  { key: '5y', label: '5 Years', years: 5 },
  { key: '10y', label: '10 Years', years: 10 },
];

export function ForecastingView({
  accounts,
  transactions,
  recurrings,
  savings,
  mortgages,
  budgets,
  categories,
}: ForecastingViewProps) {
  const [period, setPeriod] = useState<ForecastPeriod>('5y');
  const [chartType, setChartType] = useState<'networth' | 'cashflow' | 'savings'>('networth');

  const selectedYears = PERIODS.find((p) => p.key === period)?.years ?? 5;

  const dateRange = useMemo(() => {
    const now = new Date();
    return { start: now.toISOString().slice(0, 10), end: new Date(now.getFullYear() + selectedYears, now.getMonth(), now.getDate()).toISOString().slice(0, 10) };
  }, [selectedYears]);

  const baselineData = useMemo(() => {
    const netWorth = FinancialEngine.getNetWorth(accounts);
    const cashFlow = FinancialEngine.getCashFlow(transactions, recurrings, dateRange);
    const savingsSnapshot = FinancialEngine.getSavingsSnapshot(savings);
    const budgetHealth = FinancialEngine.getBudgetHealth(budgets, transactions, categories, cashFlow.monthlyIncome);
    const monthlySavings = savings.reduce((s, g) => s + Number(g.monthly_contribution || 0), 0);
    const monthlyDebt = mortgages.reduce((s, m) => {
      const principal = m.principal - m.down_payment;
      const monthlyRate = m.annual_rate / 100 / 12;
      const numPayments = m.term_years * 12;
      const payment = monthlyRate > 0
        ? principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
        : principal / numPayments;
      return s + payment + (m.extra_payment || 0);
    }, 0);
    return { netWorth, cashFlow, savingsSnapshot, budgetHealth, monthlySavings, monthlyDebt };
  }, [accounts, transactions, recurrings, savings, mortgages, budgets, categories, dateRange]);

  const projections = useMemo(() => {
    const data = [];
    let currentNetWorth = baselineData.netWorth.netWorth;
    let currentSavings = baselineData.savingsSnapshot.totalSaved;
    let currentDebt = baselineData.netWorth.totalLiabilities;

    const monthlySavingsRate = baselineData.cashFlow.monthlyIncome > 0
      ? baselineData.monthlySavings / baselineData.cashFlow.monthlyIncome
      : 0;

    for (let year = 0; year <= selectedYears; year++) {
      const date = new Date();
      date.setFullYear(date.getFullYear() + year);

      data.push({
        year: date.getFullYear(),
        label: year === 0 ? 'Now' : `Year ${year}`,
        netWorth: Math.round(currentNetWorth),
        savings: Math.round(currentSavings),
        debt: Math.round(Math.max(0, currentDebt)),
        cashFlow: Math.round(baselineData.cashFlow.cashFlow),
        monthlyIncome: Math.round(baselineData.cashFlow.monthlyIncome),
        monthlyExpenses: Math.round(baselineData.cashFlow.monthlyExpenses),
      });

      if (year < selectedYears) {
        const annualSavings = baselineData.monthlySavings * 12;
        currentNetWorth += annualSavings + currentNetWorth * 0.07;
        currentSavings += annualSavings;
        currentDebt = Math.max(0, currentDebt - baselineData.monthlyDebt * 12);
      }
    }

    return data;
  }, [baselineData, selectedYears]);

  const chartData = useMemo(() => {
    return projections.map((p) => ({
      name: p.label,
      ...(chartType === 'networth' && { 'Net Worth': p.netWorth }),
      ...(chartType === 'cashflow' && { 'Monthly Income': p.monthlyIncome, 'Monthly Expenses': p.monthlyExpenses }),
      ...(chartType === 'savings' && { 'Savings': p.savings, 'Debt': p.debt }),
    }));
  }, [projections, chartType]);

  const finalProjection = projections[projections.length - 1];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Financial Forecast</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Project your financial future over time</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-md px-3 min-h-[44px] text-sm font-medium transition-all ${
                  period === p.key
                    ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">Projected Net Worth</div>
            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              ${finalProjection?.netWorth.toLocaleString() ?? 'N/A'}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">Projected Savings</div>
            <div className="mt-1 text-xl font-bold text-emerald-600">
              ${finalProjection?.savings.toLocaleString() ?? 'N/A'}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">Remaining Debt</div>
            <div className="mt-1 text-xl font-bold text-red-600">
              ${finalProjection?.debt.toLocaleString() ?? 'N/A'}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">Net Worth Growth</div>
            <div className="mt-1 text-xl font-bold text-brand-600">
              +{finalProjection ? ((finalProjection.netWorth / Math.max(baselineData.netWorth.netWorth, 1) - 1) * 100).toFixed(0) : '0'}%
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex gap-2 mb-6">
          {[
            { key: 'networth', label: 'Net Worth' },
            { key: 'cashflow', label: 'Cash Flow' },
            { key: 'savings', label: 'Savings vs Debt' },
          ].map((ct) => (
            <button
              key={ct.key}
              onClick={() => setChartType(ct.key as typeof chartType)}
              className={`rounded-lg px-3 min-h-[44px] text-sm font-medium transition-all ${
                chartType === ct.key
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>

        <div className="h-60 sm:h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString()}`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              {chartType === 'networth' && (
                <Line type="monotone" dataKey="Net Worth" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              )}
              {chartType === 'cashflow' && (
                <>
                  <Line type="monotone" dataKey="Monthly Income" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Monthly Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                </>
              )}
              {chartType === 'savings' && (
                <>
                  <Line type="monotone" dataKey="Savings" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Debt" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Projection Timeline</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="pb-3 text-left font-medium text-slate-500 dark:text-slate-400">Year</th>
                <th className="pb-3 text-right font-medium text-slate-500 dark:text-slate-400">Net Worth</th>
                <th className="pb-3 text-right font-medium text-slate-500 dark:text-slate-400">Savings</th>
                <th className="pb-3 text-right font-medium text-slate-500 dark:text-slate-400">Debt</th>
                <th className="pb-3 text-right font-medium text-slate-500 dark:text-slate-400">Cash Flow</th>
              </tr>
            </thead>
            <tbody>
              {projections.map((p) => (
                <tr key={p.year} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-3 font-medium text-slate-900 dark:text-slate-100">{p.label}</td>
                  <td className="py-3 text-right text-slate-900 dark:text-slate-100">${p.netWorth.toLocaleString()}</td>
                  <td className="py-3 text-right text-emerald-600">${p.savings.toLocaleString()}</td>
                  <td className="py-3 text-right text-red-600">${p.debt.toLocaleString()}</td>
                  <td className="py-3 text-right text-slate-900 dark:text-slate-100">${p.cashFlow.toLocaleString()}/mo</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
