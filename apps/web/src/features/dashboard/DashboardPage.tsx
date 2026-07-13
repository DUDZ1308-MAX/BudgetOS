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
        />
        <StatCard
          label="Monthly Income"
          value={d.monthlyIncome}
          isLoading={isLoading}
          accent="positive"
        />
        <StatCard
          label="Monthly Expenses"
          value={d.monthlyExpenses}
          isLoading={isLoading}
          accent="negative"
        />
        <StatCard
          label="Cash Flow"
          value={d.cashFlow}
          isLoading={isLoading}
          accent={d.cashFlow >= 0 ? 'positive' : 'negative'}
        />
      </div>

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
