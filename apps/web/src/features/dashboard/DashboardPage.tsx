import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import { computeDashboard } from '@/lib/dashboard/computeDashboard';
import { FinancialEngine } from '@/services/FinancialEngine';
import { AnimatedCashFlow } from '@/components/dashboard/AnimatedCashFlow';
import { SavingsGoalProgress } from '@/components/dashboard/SavingsGoalProgress';
import { NetWorthCard } from './components/NetWorthCard';
import { CashFlowCard } from './components/CashFlowCard';
import { FinancialHealthCard } from './components/FinancialHealthCard';
import { BudgetHealthCard } from './components/BudgetHealthCard';
import { AIInsightCard } from './components/AIInsightCard';
import { QuickActionsCard } from './components/QuickActionsCard';
import { UpcomingActivityCard } from './components/UpcomingActivityCard';
import { MortgageSnapshotCard } from './components/MortgageSnapshotCard';
import { SetupChecklist } from '@/components/ui/SetupChecklist';
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
  const { data: savingsGoals = [], isLoading: savingsLoading } = useSavingsGoals();

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
    financialHealth: null,
    mortgages: [],
    topSpendingCategories: [],
    budgetUtilization: [],
    upcomingActivity: [],
    recentTransactions: [],
  };
  const queryErrors = result?.errors ?? [];

  const spendingBreakdown = useMemo(() => {
    return d.topSpendingCategories.map((c) => ({
      name: c.categoryName,
      value: c.amount,
    }));
  }, [d.topSpendingCategories]);

  const cashFlowData = useMemo(() => {
    if (cashFlowHistory.length > 0) return cashFlowHistory;
    if (!result) return [];
    return [
      { month: 'This Month', income: d.monthlyIncome, expenses: d.monthlyExpenses, net: d.cashFlow },
    ];
  }, [result, d, cashFlowHistory]);

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
        <div className="flex items-center gap-3">
          <div>
            <h1 className="page-title">{getGreeting()}, {displayName}</h1>
            <div className="flex items-center gap-3">
              <p className="page-subtitle">Your financial command center</p>
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

      {/* Partial data warning — only show for non-budget errors */}
      {queryErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-3 text-sm"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        >
          Some data could not be loaded ({queryErrors.filter((e) => e !== 'budgets').join(', ')}). Showing available data.
        </motion.div>
      )}

      {isError && !result && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          <p className="font-medium">Unable to load dashboard data</p>
          <p className="mt-1">Please try refreshing the page. If the problem persists, check your connection.</p>
        </motion.div>
      )}

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
        <FinancialHealthCard result={d.financialHealth} isLoading={isLoading} />
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
        <AIInsightCard dashboardData={result?.data} isLoading={isLoading} />
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
        <MortgageSnapshotCard mortgages={d.mortgages} isLoading={isLoading} />
        <UpcomingActivityCard activity={d.upcomingActivity} isLoading={isLoading} />
        <QuickActionsCard />
      </motion.div>
    </div>
  );
}
