export interface CategoryBudgetStatus {
  categoryId: string | null;
  categoryName: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface DashboardFinancialHealth {
  overallScore: number;
  tier: string;
  components: Record<string, { maxPoints: number; earnedPoints: number; percentage: number; details: string }>;
  recommendations: string[];
}

export interface DashboardMortgage {
  id: string;
  name: string;
  monthlyPayment: number;
  remainingBalance: number;
  totalInterest: number;
  totalCost: number;
  interestSaved: number;
  payoffDate: string;
  payoffMonths: number;
  progressPct: number;
  principalPaidPct: number;
  paymentFrequency: string;
  yearsRemaining: number;
}

export interface DashboardSavingsSnapshot {
  totalSaved: number;
  activeGoals: number;
  goalCompletionPct: number;
  nearestGoal: string | null;
  nearestGoalProgress: number;
  nextMilestone: string | null;
  nextMilestoneAmount: number;
}

export interface DashboardBudgetSnapshot {
  onTrack: number;
  over: number;
  monthlyUsagePct: number;
  topCategory: string | null;
  topCategoryAmount: number;
  remainingBudget: number;
}

export interface DashboardAccountSummary {
  totalCash: number;
  chequing: number;
  savings: number;
  creditCards: number;
  investments: number;
  netLiquidAssets: number;
}

export interface DashboardInsight {
  type: 'positive' | 'neutral' | 'warning';
  icon: string;
  title: string;
  description: string;
}

export interface DashboardUpcomingItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  type: 'income' | 'expense' | 'mortgage' | 'contribution';
  category: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: 'income' | 'expense' | 'mortgage' | 'contribution' | 'transfer' | 'bill' | 'payment';
  category: string;
  source: 'recurring' | 'mortgage' | 'savings' | 'transaction' | 'manual';
  frequency?: string;
  notes?: string;
  accountName?: string;
  accountId?: string;
  categoryId?: string;
  goalId?: string;
  mortgageId?: string;
}

export interface DailyForecast {
  date: string;
  openingBalance: number;
  moneyIn: number;
  moneyOut: number;
  endingBalance: number;
  events: CalendarEvent[];
}

export interface MonthlyForecast {
  year: number;
  month: number;
  income: number;
  expenses: number;
  savings: number;
  debtPayments: number;
  mortgage: number;
  budgetRemaining: number;
  projectedNetWorthChange: number;
  lowestBalance: number;
  highestBalance: number;
  netCashFlow: number;
}

export interface DashboardSummaryData {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  cashFlow: number;
  savingsRate: number;
  availableCash: number;
  financialHealth: DashboardFinancialHealth | null;
  mortgages: DashboardMortgage[];
  savingsSnapshot: DashboardSavingsSnapshot;
  budgetSnapshot: DashboardBudgetSnapshot;
  accountSummary: DashboardAccountSummary;
  topSpendingCategories: { categoryName: string; amount: number }[];
  budgetUtilization: CategoryBudgetStatus[];
  upcomingActivity: {
    id: string;
    name: string;
    amount: number;
    nextRun: string;
    type: 'income' | 'expense';
    frequency: string;
  }[];
  upcoming: DashboardUpcomingItem[];
  recentTransactions: {
    id: string;
    amount: number;
    date: string;
    merchant: string | null;
    categoryName: string | null;
    accountName: string | null;
  }[];
  insights: DashboardInsight[];
}
