import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import { computeDashboard } from '@/lib/dashboard/computeDashboard';
import { StatCard } from '@/components/dashboard/StatCard';
import { FinancialHealthScore } from '@/components/dashboard/FinancialHealthScore';
import { AnimatedCashFlow } from '@/components/dashboard/AnimatedCashFlow';
import { InteractiveDonut } from '@/components/dashboard/InteractiveDonut';
import { SavingsGoalProgress } from '@/components/dashboard/SavingsGoalProgress';
import { RecentTransactionsCard } from './components/RecentTransactionsCard';
import { AccountsCard } from './components/AccountsCard';
import { BudgetChart } from './components/BudgetChart';
import { CategoryChart } from './components/CategoryChart';
import { InsightsPanel } from './components/InsightsPanel';
import { UpcomingBillsWidget, UpcomingIncomeWidget } from './components/UpcomingBillsWidget';
import { MortgageSnapshotCard } from './components/MortgageSnapshotCard';
import { AIInsightCard } from './components/AIInsightCard';
import { QuickActionsCard } from './components/QuickActionsCard';
import { SetupChecklist } from '@/components/ui/SetupChecklist';
import { useHealthStore } from '@/stores/intelligence/healthStore';
import { useSavingsGoals } from '@/hooks/useSavings';

function WalletIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m3-2.818l-.879.659c-1.171.879-3.07.879-4.242 0-1.172-.879-1.172-2.303 0-3.182C10.464 12.219 11.232 12 12 12c.725 0 1.45-.22 2.003-.659 1.106-.879 1.106-2.303 0-3.182s-2.9-.879-4.006 0l-.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

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

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

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

      {/* Top Row: 4 metric cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Financial overview"
      >
        <StatCard
          label="Net Worth"
          value={d.netWorth}
          isLoading={isLoading}
          accent={d.netWorth >= 0 ? 'positive' : 'negative'}
          tooltip="Total assets minus total liabilities across all accounts"
          icon={<WalletIcon />}
        />
        <StatCard
          label="Monthly Income"
          value={d.monthlyIncome}
          isLoading={isLoading}
          accent="positive"
          tooltip="Total income received this month from all sources"
          icon={<ArrowUpIcon />}
        />
        <StatCard
          label="Monthly Expenses"
          value={d.monthlyExpenses}
          isLoading={isLoading}
          accent="negative"
          tooltip="Total money spent this month across all categories"
          icon={<ArrowDownIcon />}
        />
        <StatCard
          label="Cash Flow"
          value={d.cashFlow}
          isLoading={isLoading}
          accent={d.cashFlow >= 0 ? 'positive' : 'negative'}
          tooltip="Income minus expenses — positive means you're saving money"
          icon={<TrendingIcon />}
        />
      </motion.div>

      {/* Setup Checklist for new users */}
      <SetupChecklist />

      {/* Row 2: Health Score + Savings Goals */}
      <div className="grid gap-6 lg:grid-cols-2" aria-label="Health and savings overview">
        <FinancialHealthScore result={healthResult} isLoading={isLoading} />
        <SavingsGoalProgress goals={savingsGoals} isLoading={savingsLoading} />
      </div>

      {/* Row 3: Cash Flow Trend + Spending Breakdown + AI Insights */}
      <div className="grid gap-6 lg:grid-cols-3" aria-label="Trends and insights">
        <AnimatedCashFlow data={cashFlowData} isLoading={isLoading} />
        {spendingBreakdown.length > 0 ? (
          <InteractiveDonut data={spendingBreakdown} isLoading={isLoading} />
        ) : (
          <BudgetChart budgets={d.budgetUtilization} isLoading={isLoading} />
        )}
        <AIInsightCard />
      </div>

      {/* Row 4: Mortgage + Quick Actions + Budget */}
      <div className="grid gap-6 lg:grid-cols-3" aria-label="Mortgage and actions">
        <MortgageSnapshotCard />
        <QuickActionsCard />
        <InsightsPanel />
      </div>

      {/* Row 5: Recurring widgets */}
      <div className="grid gap-6 lg:grid-cols-2" aria-label="Upcoming recurring transactions">
        <UpcomingBillsWidget />
        <UpcomingIncomeWidget />
      </div>

      {/* Row 6: Top Categories + Accounts + Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-3" aria-label="Detailed breakdown">
        <CategoryChart categories={d.topSpendingCategories} isLoading={isLoading} />
        <AccountsCard />
        <RecentTransactionsCard transactions={d.recentTransactions} isLoading={isLoading} />
      </div>
    </div>
  );
}
