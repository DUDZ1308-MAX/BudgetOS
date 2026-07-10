export interface EngineTransaction {
  id: string;
  account_id: string | null;
  category_id: string | null;
  amount: number;
  date: string;
  merchant: string | null;
  note: string | null;
  is_archived: boolean;
}

export interface EngineAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  is_active: boolean;
}

export interface EngineCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  is_archived: boolean;
}

export interface EngineBudget {
  id?: string;
  category_id: string;
  year: number;
  month: number;
  amount: number;
  rollover: boolean;
}

export interface BudgetSummary {
  income: {
    total: number;
    averageDaily: number;
  };
  expenses: {
    total: number;
    byCategory: CategoryBreakdown[];
  };
  cashFlow: {
    netIncome: number;
    dailySpendingAllowance: number;
    safeToSpendToday: number;
    projectedEndBalance: number;
  };
  budgetStatus: {
    categories: CategoryBudgetStatus[];
    overBudget: CategoryBudgetStatus[];
    underBudget: CategoryBudgetStatus[];
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
  };
  accounts: {
    netWorth: number;
    remainingCash: number;
    totalAssets: number;
    totalLiabilities: number;
    accountCount: number;
  };
  savingsCapacity: {
    recommendedAmount: number;
    savingsRate: number;
    surplus: number;
  };
  alerts: Alert[];
}

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface CategoryBudgetStatus {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'under' | 'on_track' | 'at_limit' | 'over';
}

export interface Alert {
  type: 'overspend' | 'low_balance' | 'unusual_spending';
  severity: 'low' | 'medium' | 'high';
  message: string;
  category?: string;
  amount?: number;
}

export interface CashFlowSummary {
  dailyBalances: DailyBalance[];
  sevenDayTrend: number;
  thirtyDayTrend: number;
  incomeVsExpenseRatio: number;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
}

export interface DailyBalance {
  date: string;
  income: number;
  expenses: number;
  net: number;
  runningBalance: number;
}

export interface BudgetEngineInput {
  transactions: EngineTransaction[];
  accounts: EngineAccount[];
  categories: EngineCategory[];
  budgets: EngineBudget[];
  dateRange: {
    start: string;
    end: string;
  };
}

export interface CashFlowEngineInput {
  transactions: EngineTransaction[];
  accounts: EngineAccount[];
}

// ============================================================
// Insight types
// ============================================================

export type InsightType = 'warning' | 'info' | 'success' | 'critical';

export type InsightCategory = 'budget' | 'cashflow' | 'savings' | 'spending';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  category: InsightCategory;
}

export interface InsightEngineInput {
  budgetSummary: BudgetSummary;
  cashFlowSummary: CashFlowSummary;
  dateRange: { start: string; end: string };
  previousMonthSpending?: Record<string, number>;
}

// ============================================================
// Safe-to-Spend types
// ============================================================

export interface SafeToSpendInput {
  remainingBudget: number;
  monthlyIncome: number;
  daysRemaining: number;
  upcomingFixedExpenses?: number;
}

export interface SafeToSpendResult {
  safeToSpendToday: number;
  riskLevel: 'low' | 'medium' | 'high';
  explanation: string;
}
