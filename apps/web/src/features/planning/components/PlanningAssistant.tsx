"use client";

import { useState, useMemo } from 'react';
import { FinancialEngine } from '@/services/FinancialEngine';
import { IconSparkles } from '@/components/ui/Icons';
import type { Account, Transaction, RecurringTransaction, SavingsGoal, Mortgage, Budget, Category } from '@budgetos/database';

interface PlanningAssistantProps {
  accounts: Account[];
  transactions: Transaction[];
  recurrings: RecurringTransaction[];
  savings: SavingsGoal[];
  mortgages: Mortgage[];
  budgets: Budget[];
  categories: Category[];
}

interface PlanningInsight {
  id: string;
  type: 'scenario' | 'forecast' | 'goal' | 'retirement' | 'mortgage' | 'warning' | 'tip';
  title: string;
  description: string;
  severity: 'positive' | 'neutral' | 'negative' | 'info';
  metric?: string;
  value?: string;
  action?: string;
}

export function PlanningAssistant({
  accounts,
  transactions,
  recurrings,
  savings,
  mortgages,
  budgets,
  categories,
}: PlanningAssistantProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    return { start: now.toISOString().slice(0, 10), end: new Date(now.getFullYear() + 5, now.getMonth(), now.getDate()).toISOString().slice(0, 10) };
  }, []);

  const insights = useMemo(() => {
    const result: PlanningInsight[] = [];

    const netWorth = FinancialEngine.getNetWorth(accounts);
    const cashFlow = FinancialEngine.getCashFlow(transactions, recurrings, dateRange);
    const savingsSnapshot = FinancialEngine.getSavingsSnapshot(savings);
    const budgetHealth = FinancialEngine.getBudgetHealth(budgets, transactions, categories, cashFlow.monthlyIncome);
    const healthScore = FinancialEngine.getHealthScoreV2(
      cashFlow, netWorth, budgetHealth,
      cashFlow.monthlyIncome / Math.max(cashFlow.monthlyExpenses, 1) * 100,
      cashFlow.monthlyExpenses, savings
    );

    const monthlySavings = savings.reduce((s, g) => s + Number(g.monthly_contribution || 0), 0);
    const totalDebt = netWorth.totalLiabilities;
    const savingsRate = cashFlow.monthlyIncome > 0 ? (monthlySavings / cashFlow.monthlyIncome) * 100 : 0;

    if (cashFlow.cashFlow > 0) {
      result.push({
        id: 'positive-cashflow',
        type: 'tip',
        title: 'Positive Cash Flow',
        description: `You have $${cashFlow.cashFlow.toLocaleString()}/month surplus. Consider allocating this to savings goals or debt reduction.`,
        severity: 'positive',
        metric: 'Monthly Surplus',
        value: `$${cashFlow.cashFlow.toLocaleString()}`,
        action: 'Visit Goals tab to optimize allocation',
      });
    } else {
      result.push({
        id: 'negative-cashflow',
        type: 'warning',
        title: 'Cash Flow Deficit',
        description: `You're spending $${Math.abs(cashFlow.cashFlow).toLocaleString()}/month more than you earn. This needs immediate attention.`,
        severity: 'negative',
        metric: 'Monthly Deficit',
        value: `-$${Math.abs(cashFlow.cashFlow).toLocaleString()}`,
        action: 'Review expenses and consider increasing income',
      });
    }

    if (savingsRate < 20) {
      result.push({
        id: 'low-savings-rate',
        type: 'tip',
        title: 'Increase Savings Rate',
        description: `Your savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend 20%+. Consider the 50/30/20 rule.`,
        severity: 'info',
        metric: 'Savings Rate',
        value: `${savingsRate.toFixed(1)}%`,
        action: 'Use Scenario Planner to model increased savings',
      });
    } else {
      result.push({
        id: 'good-savings-rate',
        type: 'tip',
        title: 'Strong Savings Rate',
        description: `Your ${savingsRate.toFixed(1)}% savings rate is above the recommended 20%. Great job building wealth!`,
        severity: 'positive',
        metric: 'Savings Rate',
        value: `${savingsRate.toFixed(1)}%`,
      });
    }

    savings.forEach((goal) => {
      const current = Number(goal.current_amount || 0);
      const target = Number(goal.target_amount || 0);
      const monthly = Number(goal.monthly_contribution || 0);
      const progress = target > 0 ? (current / target) * 100 : 0;
      const remaining = target - current;
      const monthsToGoal = monthly > 0 ? remaining / monthly : Infinity;
      const targetDate = goal.target_date ? new Date(goal.target_date) : null;
      const projectedDate = monthsToGoal < Infinity ? new Date(Date.now() + monthsToGoal * 30 * 24 * 60 * 60 * 1000) : null;

      if (targetDate && projectedDate && projectedDate > targetDate) {
        result.push({
          id: `goal-behind-${goal.id}`,
          type: 'goal',
          title: `Behind on "${goal.name}"`,
          description: `Current pace projects completion ${Math.round(monthsToGoal / 12)} years after your target date. Consider increasing monthly contributions.`,
          severity: 'negative',
          metric: 'Projected Delay',
          value: `${Math.round((monthsToGoal - (targetDate.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)) / 12)} years`,
          action: `Increase monthly contribution by $${Math.ceil(remaining / Math.max(1, (targetDate.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)))} to meet deadline`,
        });
      } else if (progress >= 50) {
        result.push({
          id: `goal-progress-${goal.id}`,
          type: 'goal',
          title: `"${goal.name}" Halfway There`,
          description: `You've reached ${progress.toFixed(0)}% of your $${target.toLocaleString()} goal. Keep it up!`,
          severity: 'positive',
          metric: 'Progress',
          value: `${progress.toFixed(0)}%`,
        });
      }
    });

    mortgages.forEach((m) => {
      const principal = m.principal - m.down_payment;
      const monthlyRate = m.annual_rate / 100 / 12;
      const numPayments = m.term_years * 12;
      const payment = monthlyRate > 0
        ? principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
        : principal / numPayments;
      const totalInterest = (payment + m.extra_payment) * numPayments - principal;

      if (m.extra_payment > 0) {
        const savingsMonths = Math.round(numPayments - (Math.log((payment + m.extra_payment) / ((payment + m.extra_payment) - principal * monthlyRate)) / Math.log(1 + monthlyRate)));
        const interestSaved = totalInterest - (payment + m.extra_payment) * savingsMonths;
        result.push({
          id: `mortgage-extra-${m.id}`,
          type: 'mortgage',
          title: `Extra Payment on "${m.name}"`,
          description: `Your $${m.extra_payment}/mo extra payment saves ~${Math.round((numPayments - savingsMonths) / 12)} years and $${Math.round(interestSaved).toLocaleString()} in interest.`,
          severity: 'positive',
          metric: 'Interest Saved',
          value: `$${Math.round(interestSaved).toLocaleString()}`,
        });
      }
    });

    if (totalDebt > 0) {
      const debtToIncome = cashFlow.monthlyIncome > 0 ? (totalDebt / (cashFlow.monthlyIncome * 12)) * 100 : 0;
      if (debtToIncome > 40) {
        result.push({
          id: 'high-debt-ratio',
          type: 'warning',
          title: 'High Debt-to-Income Ratio',
          description: `Your debt is ${debtToIncome.toFixed(0)}% of annual income. Consider the avalanche or snowball method to reduce debt faster.`,
          severity: 'negative',
          metric: 'Debt-to-Income',
          value: `${debtToIncome.toFixed(0)}%`,
          action: 'Use Scenario Planner to model debt payoff strategies',
        });
      }
    }

    const healthScoreValue = healthScore.overall?.score ?? 0;
    if (healthScoreValue >= 80) {
      result.push({
        id: 'excellent-health',
        type: 'tip',
        title: 'Excellent Financial Health',
        description: `Your financial health score of ${healthScoreValue}/100 is excellent. You're on track for a strong financial future.`,
        severity: 'positive',
        metric: 'Health Score',
        value: `${healthScoreValue}/100`,
      });
    } else if (healthScoreValue < 50) {
      result.push({
        id: 'poor-health',
        type: 'warning',
        title: 'Financial Health Needs Attention',
        description: `Your score of ${healthScoreValue}/100 indicates areas for improvement. Focus on building emergency savings and reducing high-interest debt.`,
        severity: 'negative',
        metric: 'Health Score',
        value: `${healthScoreValue}/100`,
        action: 'Review each planning tab for specific improvement areas',
      });
    }

    result.push({
      id: 'scenario-tip',
      type: 'tip',
      title: 'Try Scenario Planning',
      description: 'Use the Scenarios tab to model "what if" situations. Compare adding $200/month to savings vs. extra mortgage payments.',
      severity: 'info',
    });

    result.push({
      id: 'forecast-tip',
      type: 'tip',
      title: 'View Your Future',
      description: 'Check the Forecasting tab to see projected net worth, savings growth, and debt payoff timelines over 1-10 years.',
      severity: 'info',
    });

    return result;
  }, [accounts, transactions, recurrings, savings, mortgages, budgets, categories, dateRange]);

  const getSeverityStyle = (severity: PlanningInsight['severity']) => {
    switch (severity) {
      case 'positive': return 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20';
      case 'negative': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'info': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default: return 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800';
    }
  };

  const getSeverityIcon = (severity: PlanningInsight['severity']) => {
    switch (severity) {
      case 'positive': return '✓';
      case 'negative': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
          <IconSparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Planning Assistant</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered insights for your financial plan</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-xl border p-4 transition-all ${getSeverityStyle(insight.severity)} cursor-pointer hover:shadow-sm`}
            onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg">{getSeverityIcon(insight.severity)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">{insight.title}</h4>
                  {insight.metric && (
                    <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
                      {insight.metric}: {insight.value}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{insight.description}</p>
                {expandedInsight === insight.id && insight.action && (
                  <div className="mt-3 rounded-lg bg-white/50 p-3 dark:bg-slate-800/50">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Recommended Action: {insight.action}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
