import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { computeDashboard } from '@/lib/dashboard/computeDashboard';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTransactionsCard } from './components/RecentTransactionsCard';
import { AccountsCard } from './components/AccountsCard';
import { BudgetChart } from './components/BudgetChart';
import { CashFlowChart } from './components/CashFlowChart';
import { CategoryChart } from './components/CategoryChart';
import { InsightsPanel } from './components/InsightsPanel';
import { UpcomingBillsWidget, UpcomingIncomeWidget } from './components/UpcomingBillsWidget';
import { SetupChecklist } from '@/components/ui/SetupChecklist';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

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

  return (
    <div className="space-y-6">
      {/* Top Row: 4 metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Financial overview">
        <StatCard
          label="Net Worth"
          value={d.netWorth}
          isLoading={isLoading}
          accent={d.netWorth >= 0 ? 'positive' : 'negative'}
          tooltip="Total assets minus total liabilities across all accounts"
        />
        <StatCard
          label="Monthly Income"
          value={d.monthlyIncome}
          isLoading={isLoading}
          accent="positive"
          tooltip="Total income received this month from all sources"
        />
        <StatCard
          label="Monthly Expenses"
          value={d.monthlyExpenses}
          isLoading={isLoading}
          accent="negative"
          tooltip="Total money spent this month across all categories"
        />
        <StatCard
          label="Cash Flow"
          value={d.cashFlow}
          isLoading={isLoading}
          accent={d.cashFlow >= 0 ? 'positive' : 'negative'}
          tooltip="Income minus expenses — positive means you're saving money"
        />
      </div>

      {/* Setup Checklist for new users */}
      <SetupChecklist />

      {/* Second Row: Budget Overview + Cash Flow Trend + Insights */}
      <div className="grid gap-6 lg:grid-cols-3" aria-label="Budget and trends">
        <BudgetChart budgets={d.budgetUtilization} isLoading={isLoading} />
        <CashFlowChart />
        <InsightsPanel />
      </div>

      {/* Fourth Row: Recurring widgets */}
      <div className="grid gap-6 lg:grid-cols-2" aria-label="Upcoming recurring transactions">
        <UpcomingBillsWidget />
        <UpcomingIncomeWidget />
      </div>

      {/* Third Row: Top Categories + Accounts + Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-3" aria-label="Detailed breakdown">
        <CategoryChart categories={d.topSpendingCategories} isLoading={isLoading} />
        <AccountsCard />
        <RecentTransactionsCard transactions={d.recentTransactions} isLoading={isLoading} />
      </div>
    </div>
  );
}
