import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import { computeDashboard } from '@/lib/dashboard/computeDashboard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { AnimatedCashFlow } from '@/components/dashboard/AnimatedCashFlow';
import { InteractiveDonut } from '@/components/dashboard/InteractiveDonut';
import { SavingsGoalProgress } from '@/components/dashboard/SavingsGoalProgress';
import { MortgagePayoffTimeline } from '@/components/dashboard/MortgagePayoffTimeline';
import { AccountsCard } from './components/AccountsCard';
import { CategoryChart } from './components/CategoryChart';
import { InsightsPanel } from './components/InsightsPanel';
import { NetWorthCard } from './components/NetWorthCard';
import { CashFlowCard } from './components/CashFlowCard';
import { FinancialHealthCard } from './components/FinancialHealthCard';
import { BudgetHealthCard } from './components/BudgetHealthCard';
import { AIInsightCard } from './components/AIInsightCard';
import { QuickActionsCard } from './components/QuickActionsCard';
import { UpcomingActivityCard } from './components/UpcomingActivityCard';
import { MortgageSnapshotCard } from './components/MortgageSnapshotCard';
import { RecentTransactionsCard } from './components/RecentTransactionsCard';
import { SetupChecklist } from '@/components/ui/SetupChecklist';
import { useHealthStore } from '@/stores/intelligence/healthStore';
import { useSavingsGoals } from '@/hooks/useSavings';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatLastUpdated(): string {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const healthResult = useHealthStore((s) => s.result);
  const { data: savingsGoals = [], isLoading: savingsLoading } = useSavingsGoals();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary', user?.id],
    queryFn: () => computeDashboard(user!.id),
    enabled: !!user,
  });

  const d = data ?? {
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    cashFlow: 0,
    topSpendingCategories: [],
    budgetUtilization: [],
    recentTransactions: [],
  };

  const spendingBreakdown = useMemo(() => {
    return d.topSpendingCategories.map((c) => ({
      name: c.categoryName,
      value: c.amount,
    }));
  }, [d.topSpendingCategories]);

  const cashFlowData = useMemo(() => {
    if (!data) return [];
    return [
      { month: 'This Month', income: d.monthlyIncome, expenses: d.monthlyExpenses, net: d.cashFlow },
    ];
  }, [data, d]);

  const displayName = (user as any)?.user_metadata?.full_name ?? (user as any)?.email?.split('@')[0] ?? 'there';

  return (
    <div className="page-container">
      {/* Greeting Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="page-header"
      >
        <div>
          <h1 className="page-title">{getGreeting()}, {displayName}</h1>
          <div className="flex items-center gap-3">
            <p className="page-subtitle">Your financial command center</p>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Updated {formatLastUpdated()}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Row 1: Executive Summary — 4 KPI cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Executive summary"
      >
        <NetWorthCard
          netWorth={d.netWorth}
          totalAssets={d.totalAssets}
          totalLiabilities={d.totalLiabilities}
          isLoading={isLoading}
        />
        <CashFlowCard
          income={d.monthlyIncome}
          expenses={d.monthlyExpenses}
          savings={d.cashFlow}
          isLoading={isLoading}
        />
        <FinancialHealthCard result={healthResult} isLoading={isLoading} />
        <BudgetHealthCard budgets={d.budgetUtilization} isLoading={isLoading} />
      </motion.div>

      {/* Setup Checklist for new users */}
      <SetupChecklist />

      {/* Row 2: Main Insights — Cash Flow Trend + AI Insights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.12 }}
        className="grid gap-6 lg:grid-cols-3"
        aria-label="Main insights"
      >
        <div className="lg:col-span-2">
          <AnimatedCashFlow data={cashFlowData} isLoading={isLoading} />
        </div>
        <AIInsightCard />
      </motion.div>

      {/* Row 3: Savings Goals — full width */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.18 }}
        aria-label="Savings goals overview"
      >
        <SavingsGoalProgress goals={savingsGoals} isLoading={savingsLoading} />
      </motion.div>

      {/* Row 4: Planning — Mortgage + Upcoming Activity + Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.24 }}
        className="grid gap-6 lg:grid-cols-3"
        aria-label="Planning section"
      >
        <MortgageSnapshotCard />
        <UpcomingActivityCard />
        <QuickActionsCard />
      </motion.div>
    </div>
  );
}
