import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';
import { computeDashboard } from '@/lib/dashboard/computeDashboard';
import { FinancialEngine } from '@/services/FinancialEngine';
import { useRecurringWidgetData } from './useRecurringWidgetData';
import { generateRecurringNotifications } from '@/services/notifications/recurringNotificationGenerator';
import { HeroSummary } from './components/HeroSummary';
import { MortgageSummary } from './components/MortgageSummary';
import { SavingsSnapshotCard } from './components/SavingsSnapshotCard';
import { BudgetSnapshotCard } from './components/BudgetSnapshotCard';
import { AccountSummaryCard } from './components/AccountSummaryCard';
import { ChartsGrid } from './components/ChartsGrid';
import { UpcomingSection } from './components/UpcomingSection';
import { QuickActionsPanel } from './components/QuickActionsPanel';
import { InsightsCards } from './components/InsightsCards';
import { RecurringWidgets } from './components/RecurringWidgets';
import { SetupChecklist } from '@/components/ui/SetupChecklist';
import { PremiumHealthScoreCard } from './components/PremiumHealthScoreCard';
import { PremiumTrendCard } from './components/PremiumTrendCard';
import { PremiumRecommendationsCard } from './components/PremiumRecommendationsCard';
import { PremiumProjectionsCard } from './components/PremiumProjectionsCard';
import { PremiumInsightsCard } from './components/PremiumInsightsCard';
import { RecentTransactionsCard } from './components/RecentTransactionsCard';
import { AiCoachCard } from '@/features/ai-coach/components/AiCoachCard';
import type { DashboardInsight, DashboardUpcomingItem } from '@/lib/dashboard/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDisplayName(profile: { display_name?: string | null; full_name?: string | null } | null, email?: string): string {
  if (profile?.display_name) return profile.display_name.split(' ')[0] ?? profile.display_name;
  if (profile?.full_name) return profile.full_name.split(' ')[0] ?? profile.full_name;
  if (email) return email.split('@')[0] ?? email;
  return 'there';
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

const upcomingTypeRoute: Record<string, string> = {
  income: '/transactions',
  expense: '/transactions',
  mortgage: '/mortgage',
  contribution: '/savings',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
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

  const { data: recurringWidgetData } = useRecurringWidgetData(user?.id);

  const d = result?.data ?? {
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    cashFlow: 0,
    savingsRate: 0,
    availableCash: 0,
    financialHealth: {
      overallScore: 0,
      tier: 'fair',
      components: {},
      recommendations: [],
      letterGrade: 'F',
      subscores: {},
      trends: { healthScore: { direction: 'stable', change: 0, changePercent: 0 }, spending: { direction: 'stable', change: 0, changePercent: 0 }, savings: { direction: 'stable', change: 0, changePercent: 0 }, netWorth: { direction: 'stable', change: 0, changePercent: 0 } },
      insights: [],
      projections: [],
      recommendationsList: [],
    },
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
    forecast: undefined,
  };
  const queryErrors = result?.errors ?? [];

  const displayName = getDisplayName(profile, user?.email);

  const metricNavigation = {
    netWorth: () => navigate('/accounts'),
    availableCash: () => navigate('/accounts'),
    monthlyIncome: () => navigate('/transactions'),
    monthlyExpenses: () => navigate('/transactions'),
    cashFlow: () => navigate('/reports'),
    savingsRate: () => navigate('/savings'),
    healthScore: () => navigate('/health'),
  };

  const handleInsightClick = (_insight: DashboardInsight) => {
    navigate('/reports');
  };

  const handleUpcomingItemClick = (item: DashboardUpcomingItem) => {
    const route = upcomingTypeRoute[item.type] ?? '/calendar';
    navigate(route);
  };

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
            <div className="flex flex-wrap items-center gap-3">
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
          onMetricClick={metricNavigation}
        />
      </motion.div>

      {/* Section 1b: Premium Health Score Grid */}
      <motion.div
        variants={section}
        className="dashboard-grid"
        aria-label="Premium financial health"
      >
        <div className="col-span-2">
          <PremiumHealthScoreCard
            overallScore={d.financialHealth?.overallScore ?? 0}
            letterGrade={d.financialHealth?.letterGrade}
            tier={d.financialHealth?.tier}
            subscores={d.financialHealth?.subscores}
            isLoading={isLoading}
            href="/health"
          />
        </div>
        {d.financialHealth?.trends?.healthScore && (
          <PremiumTrendCard
            title="Health Score Trend"
            trend={d.financialHealth.trends.healthScore}
            format="percent"
            isLoading={isLoading}
            href="/reports"
          />
        )}
        <PremiumRecommendationsCard
          recommendations={d.financialHealth?.recommendationsList ?? []}
          isLoading={isLoading}
          href="/health"
        />
        <PremiumProjectionsCard
          projections={d.financialHealth?.projections ?? []}
          isLoading={isLoading}
          href="/reports"
        />
        <AiCoachCard />
      </motion.div>

      {/* Section 1c: Insights */}
      {d.financialHealth?.insights && d.financialHealth.insights.length > 0 && (
        <motion.div variants={section} aria-label="Financial health insights">
          <PremiumInsightsCard insights={d.financialHealth.insights} isLoading={isLoading} href="/health" />
        </motion.div>
      )}

      {/* Setup Checklist for new users */}
      <motion.div variants={section}>
        <SetupChecklist />
      </motion.div>

      {/* Section 2: Snapshot Cards — Mortgage, Savings, Budget, Accounts */}
      <motion.div
        variants={section}
        className="dashboard-grid"
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

      {/* Section 4: Upcoming Activity + Quick Actions + Recent Transactions */}
      <motion.div
        variants={section}
        className="grid gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6"
        aria-label="Planning section"
      >
        <div className="lg:col-span-2">
          <UpcomingSection items={d.upcoming} isLoading={isLoading} onItemClick={handleUpcomingItemClick} />
        </div>
        <QuickActionsPanel />
      </motion.div>

      {/* Section 4b: Recent Transactions */}
      {d.recentTransactions.length > 0 && (
        <motion.div variants={section} aria-label="Recent transactions">
          <RecentTransactionsCard transactions={d.recentTransactions} isLoading={isLoading} />
        </motion.div>
      )}

      {/* Section 5: Recurring Widgets */}
      <motion.div variants={section} aria-label="Recurring transactions overview">
        <RecurringWidgets
          billsDueToday={recurringWidgetData?.billsDueToday ?? []}
          upcomingBills={recurringWidgetData?.upcomingBills ?? []}
          upcomingIncome={recurringWidgetData?.upcomingIncome ?? []}
          nextPaycheck={recurringWidgetData?.nextPaycheck ?? null}
          upcomingSavingsTransfers={recurringWidgetData?.upcomingSavingsTransfers ?? []}
          cashFlowForecast={recurringWidgetData?.cashFlowForecast ?? []}
        />
      </motion.div>

      {/* Section 6: Financial Insights */}
      <motion.div variants={section} aria-label="Financial insights">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Financial Insights</h2>
        <InsightsCards insights={d.insights} isLoading={isLoading} onInsightClick={handleInsightClick} />
      </motion.div>
    </motion.div>
  );
}
