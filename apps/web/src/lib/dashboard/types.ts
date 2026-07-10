export interface CategoryBudgetStatus {
  categoryId: string | null;
  categoryName: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface DashboardSummaryData {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  cashFlow: number;
  topSpendingCategories: { categoryName: string; amount: number }[];
  budgetUtilization: CategoryBudgetStatus[];
  recentTransactions: {
    id: string;
    amount: number;
    date: string;
    merchant: string | null;
    categoryName: string | null;
    accountName: string | null;
  }[];
}
