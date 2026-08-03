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
  recommendationsList?: DashboardRecommendation[];
  letterGrade?: string;
  subscores?: Record<string, { score: number; grade: string; trend: string; explanation: string }>;
  trends?: {
    healthScore: { direction: string; change: number; changePercent: number };
    spending: { direction: string; change: number; changePercent: number };
    savings: { direction: string; change: number; changePercent: number };
    netWorth: { direction: string; change: number; changePercent: number };
  };
  insights?: Array<{
    id: string;
    category: string;
    title: string;
    message: string;
    type: string;
    date: string;
  }>;
  projections?: Array<{
    label: string;
    months: number;
    netWorth: number;
    savings: number;
    debt: number;
    cashFlow: number;
    emergencyFundMonths: number;
  }>;
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

export interface DashboardRecommendation {
  id: string;
  priority: string;
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
  estimatedSavings: number;
  estimatedTimeline: string;
}

export interface DashboardProjection {
  label: string;
  months: number;
  netWorth: number;
  savings: number;
  debt: number;
  cashFlow: number;
  emergencyFundMonths: number;
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
  status?: 'actual' | 'projected';
  isForecast?: boolean;
  sourceId?: string;
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

export interface DashboardForecast {
  cashFlowProjection: Array<{ label: string; balance: number }>;
  netWorthProjection: Array<{ label: string; netWorth: number }>;
  debtFreeDate: string | null;
  debtFreeMonths: number | null;
  mortgagePayoffDate: string | null;
  mortgagePayoffMonths: number | null;
  savingsGoalProjections: Array<{ name: string; projectedDate: string | null; onTrack: boolean }>;
  projectedEmergencyFundMonths: number;
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
  forecast?: DashboardForecast;
}
