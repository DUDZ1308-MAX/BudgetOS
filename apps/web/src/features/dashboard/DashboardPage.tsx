import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import { computeDashboard } from '@/lib/dashboard/computeDashboard';
import { FinancialEngine } from '@/services/FinancialEngine';
import { HeroSummary } from './components/HeroSummary';
import { MortgageSummary } from './components/MortgageSummary';
import { SavingsSnapshotCard } from './components/SavingsSnapshotCard';
import { BudgetSnapshotCard } from './components/BudgetSnapshotCard';
import { AccountSummaryCard } from './components/AccountSummaryCard';
import { ChartsGrid } from './components/ChartsGrid';
import { UpcomingSection } from './components/UpcomingSection';
import { QuickActionsPanel } from './components/QuickActionsPanel';
import { InsightsCards } from './components/InsightsCards';
import { SetupChecklist } from '@/components/ui/SetupChecklist';

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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const section = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary', user?.id],
    queryFn: () => computeDashboard(user!.id),
    enabled: !!user,
  });

  const { data: cashFlowHistory = [], isLoading: cashFlowHistoryLoading } = useQuery({
    queryKey: ['cash-flow-history', user?.id],
    queryFn: () => FinancialEngine.getHistoricalCashFlow(user!.id, 6),
    enabled: !!user,
  });

  const d = result?.data ?? {
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    cashFlow: 0,
    savingsRate: 0,
    availableCash: 0,
    financialHealth: null,
    mortgages: [],
    savingsSnapshot: { totalSaved: 0, activeGoals: 0, goalCompletionPct: 0, nearestGoal: null, nearestGoalProgress: 0, nextMilestone: null, nextMilestoneAmount: 0 },
    budgetSnapshot: { onTrack: 0, over: 0, monthlyUsagePct: 0, topCategory: null, topCategoryAmount: 0, remainingBudget: 0 },
    accountSummary: { totalCash: 0, chequing: 0, savings: 0, creditCards: 0, investments: 0, netLiquidAssets: 0 },
    topSpendingCategories: [],
    budgetUtilization: [],
    upcomingActivity: [],
    upcoming: [],
    recentTransactions: [],
    insights: [],
  };
  const queryErrors = result?.errors ?? [];

  const displayName = (user as any)?.user_metadata?.full_name ?? (user as any)?.email?.split('@')[0] ?? 'there';

  return (
    <motion.div
      className="page-container"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={section} className="page-header">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="page-title">{getGreeting()}, {displayName}</h1>
            <div className="flex items-center gap-3">
              <p className="page-subtitle">Financial Command Center</p>
              <span className="premium-badge premium-badge-info">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(52, 211, 153, 0.5)' }} />
                Live
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Updated {formatLastUpdated()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Partial data warning */}
      {queryErrors.length > 0 && (
        <motion.div variants={section}>
          <div
            className="rounded-xl border p-3 text-sm"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            Some data could not be loaded ({queryErrors.filter((e) => e !== 'budgets').join(', ')}). Showing available data.
          </div>
        </motion.div>
      )}

      {isError && !result && (
        <motion.div variants={section}>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <p className="font-medium">Unable to load dashboard data</p>
            <p className="mt-1">Please try refreshing the page. If the problem persists, check your connection.</p>
          </div>
        </motion.div>
      )}

      {/* Section 1: Hero Financial Summary */}
      <motion.div variants={section} aria-label="Financial summary">
        <HeroSummary
          netWorth={d.netWorth}
          availableCash={d.availableCash}
          monthlyIncome={d.monthlyIncome}
          monthlyExpenses={d.monthlyExpenses}
          cashFlow={d.cashFlow}
          savingsRate={d.savingsRate}
          healthScore={d.financialHealth?.overallScore ?? null}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Setup Checklist for new users */}
      <motion.div variants={section}>
        <SetupChecklist />
      </motion.div>

      {/* Section 2: Snapshot Cards — Mortgage, Savings, Budget, Accounts */}
      <motion.div
        variants={section}
        className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Financial snapshots"
      >
        <MortgageSummary mortgages={d.mortgages} isLoading={isLoading} />
        <SavingsSnapshotCard snapshot={d.savingsSnapshot} isLoading={isLoading} />
        <BudgetSnapshotCard snapshot={d.budgetSnapshot} isLoading={isLoading} />
        <AccountSummaryCard summary={d.accountSummary} isLoading={isLoading} />
      </motion.div>

      {/* Section 3: Charts */}
      <motion.div variants={section} aria-label="Charts and trends">
        <ChartsGrid
          cashFlowHistory={cashFlowHistory}
          currentIncome={d.monthlyIncome}
          currentExpenses={d.monthlyExpenses}
          currentCashFlow={d.cashFlow}
          topSpending={d.topSpendingCategories}
          isLoading={isLoading || cashFlowHistoryLoading}
        />
      </motion.div>

      {/* Section 4: Upcoming Activity + Quick Actions */}
      <motion.div
        variants={section}
        className="grid gap-6 lg:grid-cols-3"
        aria-label="Planning section"
      >
        <div className="lg:col-span-2">
          <UpcomingSection items={d.upcoming} isLoading={isLoading} />
        </div>
        <QuickActionsPanel />
      </motion.div>

      {/* Section 5: Financial Insights */}
      <motion.div variants={section} aria-label="Financial insights">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Financial Insights</h2>
        <InsightsCards insights={d.insights} isLoading={isLoading} />
      </motion.div>
    </motion.div>
  );
}
