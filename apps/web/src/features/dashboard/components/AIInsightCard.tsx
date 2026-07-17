import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { formatCurrency } from '@/services/transactionService';
import type { DashboardSummaryData } from '@/lib/dashboard/types';

interface Insight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'positive' | 'warning';
  icon: string;
}

interface Props {
  dashboardData?: DashboardSummaryData | null;
  isLoading?: boolean;
}

function generateInsights(data: DashboardSummaryData): Insight[] {
  const insights: Insight[] = [];

  // 1. Savings Rate
  if (data.monthlyIncome > 0) {
    const savingsRate = ((data.monthlyIncome - data.monthlyExpenses) / data.monthlyIncome) * 100;
    if (savingsRate >= 20) {
      insights.push({
        id: 'savings-rate-excellent',
        title: 'Excellent Savings Rate',
        description: `You're saving ${savingsRate.toFixed(1)}% of your income — well above the 20% target. Keep it up!`,
        severity: 'positive',
        icon: '💰',
      });
    } else if (savingsRate >= 10) {
      insights.push({
        id: 'savings-rate-good',
        title: 'Good Savings Rate',
        description: `You're saving ${savingsRate.toFixed(1)}% of your income. Try to reach 20% for financial independence.`,
        severity: 'info',
        icon: '💡',
      });
    } else if (savingsRate > 0) {
      insights.push({
        id: 'savings-rate-low',
        title: 'Savings Rate Below Target',
        description: `You're saving ${savingsRate.toFixed(1)}%. Consider reducing expenses to save at least 20% of income.`,
        severity: 'warning',
        icon: '⚠️',
      });
    }
  }

  // 2. Budget Health
  const overBudget = data.budgetUtilization.filter((b) => b.budgeted > 0 && b.spent > b.budgeted);
  if (overBudget.length > 0) {
    const worst = overBudget.reduce((a, b) => (a.spent / a.budgeted > b.spent / b.budgeted ? a : b));
    insights.push({
      id: 'budget-over',
      title: 'Over Budget',
      description: `${worst.categoryName} is ${((worst.spent / worst.budgeted - 1) * 100).toFixed(0)}% over budget (${formatCurrency(worst.spent)} of ${formatCurrency(worst.budgeted)}).`,
      severity: 'warning',
      icon: '📊',
    });
  } else if (data.budgetUtilization.length > 0) {
    const nearLimit = data.budgetUtilization.filter((b) => b.budgeted > 0 && b.percentUsed > 80);
    if (nearLimit.length > 0) {
      insights.push({
        id: 'budget-near-limit',
        title: 'Budget Approaching Limit',
        description: `${nearLimit.length} categor${nearLimit.length === 1 ? 'y is' : 'ies are'} above 80% of budget. Watch spending to stay on track.`,
        severity: 'info',
        icon: '📈',
      });
    }
  }

  // 3. Emergency Fund (months of expenses covered)
  if (data.monthlyExpenses > 0 && data.totalAssets > 0) {
    const monthsCovered = data.totalAssets / data.monthlyExpenses;
    if (monthsCovered >= 6) {
      insights.push({
        id: 'emergency-fund-strong',
        title: 'Strong Emergency Fund',
        description: `Your assets cover ${monthsCovered.toFixed(1)} months of expenses — above the 6-month target.`,
        severity: 'positive',
        icon: '🛡️',
      });
    } else if (monthsCovered >= 3) {
      insights.push({
        id: 'emergency-fund-growing',
        title: 'Emergency Fund Growing',
        description: `Your assets cover ${monthsCovered.toFixed(1)} months of expenses. Aim for 6 months for full security.`,
        severity: 'info',
        icon: '🛡️',
      });
    } else if (monthsCovered > 0) {
      insights.push({
        id: 'emergency-fund-low',
        title: 'Emergency Fund Needs Attention',
        description: `Your assets only cover ${monthsCovered.toFixed(1)} months of expenses. Build toward 3-6 months.`,
        severity: 'warning',
        icon: '⚠️',
      });
    }
  }

  // 4. Largest expense category
  if (data.topSpendingCategories.length > 0) {
    const top = data.topSpendingCategories[0]!;
    insights.push({
      id: 'top-expense',
      title: 'Largest Expense Category',
      description: `${top.categoryName} is your biggest expense this month at ${formatCurrency(top.amount)}.`,
      severity: 'info',
      icon: '🏷️',
    });
  }

  // 5. Upcoming bills
  // (handled by dashboard data if available)

  // 6. Net worth
  if (data.netWorth > 0 && data.totalAssets > 0) {
    const netWorthPct = (data.netWorth / data.totalAssets) * 100;
    insights.push({
      id: 'net-worth-positive',
      title: 'Positive Net Worth',
      description: `Your net worth is ${formatCurrency(data.netWorth)}, representing ${netWorthPct.toFixed(0)}% of total assets.`,
      severity: 'positive',
      icon: '📈',
    });
  } else if (data.netWorth < 0) {
    insights.push({
      id: 'net-worth-negative',
      title: 'Net Worth Below Zero',
      description: `Your liabilities exceed assets by ${formatCurrency(Math.abs(data.netWorth))}. Focus on debt reduction.`,
      severity: 'warning',
      icon: '📉',
    });
  }

  // 7. Cash flow
  if (data.cashFlow > 0) {
    insights.push({
      id: 'cash-flow-positive',
      title: 'Positive Cash Flow',
      description: `You have ${formatCurrency(data.cashFlow)} net cash flow this month. Consider directing excess to savings or investments.`,
      severity: 'positive',
      icon: '💵',
    });
  } else if (data.cashFlow < 0) {
    insights.push({
      id: 'cash-flow-negative',
      title: 'Negative Cash Flow',
      description: `You're spending ${formatCurrency(Math.abs(data.cashFlow))} more than income this month. Review discretionary spending.`,
      severity: 'warning',
      icon: '⚠️',
    });
  }

  // 8. Mortgage payoff progress
  if (data.mortgages.length > 0) {
    const m = data.mortgages[0]!;
    if (m.progressPct > 50) {
      insights.push({
        id: 'mortgage-halfway',
        title: 'Mortgage Milestone',
        description: `You've paid off ${m.progressPct.toFixed(0)}% of your mortgage. You're past the halfway mark!`,
        severity: 'positive',
        icon: '🏠',
      });
    }
  }

  // Return top 5 most impactful insights
  return insights.slice(0, 5);
}

export const AIInsightCard = memo(function AIInsightCard({ dashboardData, isLoading }: Props) {
  const insights = useMemo(() => {
    if (!dashboardData) return [];
    return generateInsights(dashboardData);
  }, [dashboardData]);

  if (isLoading) {
    return (
      <DashboardCard title="AI Insights" delay={0.3}>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (insights.length === 0) {
    return (
      <DashboardCard title="AI Insights" delay={0.3}>
        <div className="flex h-32 items-center justify-center">
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No insights yet</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Add accounts and transactions to see personalized insights.</p>
          </div>
        </div>
      </DashboardCard>
    );
  }

  const severityConfig = {
    positive: { bg: 'color-mix(in srgb, var(--status-success) 12%, transparent)', text: 'var(--status-success)' },
    info: { bg: 'var(--accent-muted)', text: 'var(--accent-text)' },
    warning: { bg: 'color-mix(in srgb, var(--status-warning) 12%, transparent)', text: 'var(--status-warning)' },
  };

  return (
    <DashboardCard title="AI Insights" subtitle={`${insights.length} personalized`} delay={0.3}>
      <div className="space-y-2">
        {insights.map((insight, i) => {
          const style = severityConfig[insight.severity];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + i * 0.08 }}
              className="rounded-xl p-3"
              style={{ background: style.bg }}
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-sm">{insight.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold" style={{ color: style.text }}>{insight.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardCard>
  );
});
