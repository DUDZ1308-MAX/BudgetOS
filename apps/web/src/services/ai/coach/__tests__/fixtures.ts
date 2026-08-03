import type { CoachSnapshotData } from '../types';
import type { DashboardData } from '@/services/FinancialEngine';
import type { CashFlowForecast } from '@/lib/forecast/types';

const EMPTY_DASHBOARD: DashboardData = {
  netWorth: { netWorth: 25000, totalAssets: 65000, totalLiabilities: 40000, accounts: [] },
  cashFlow: { monthlyIncome: 5000, monthlyExpenses: 3500, cashFlow: 1500, income: 5000, expenses: 3500 },
  budgetHealth: {
    categories: [],
    totalBudgeted: 3000,
    totalSpent: 2800,
    remaining: 200,
    adherencePercent: 93.3,
    overallStatus: 'healthy',
  },
  financialHealth: { overallScore: 72, tier: 'healthy', components: {}, recommendations: [] },
  savingsGoals: [],
  mortgages: [],
  upcomingActivity: [],
  topSpendingCategories: [],
  recentTransactions: [],
  availableCash: 4500,
  savingsSnapshot: { totalSaved: 2000, activeGoals: 0, goalCompletionPct: 0, nearestGoal: null, nearestGoalProgress: 0, nextMilestone: null, nextMilestoneAmount: 0 },
  budgetSnapshot: { onTrack: 3, over: 1, monthlyUsagePct: 90, topCategory: 'Food', topCategoryAmount: 700, remainingBudget: 200 },
  accountSummary: { totalCash: 4500, chequing: 2500, savings: 2000, creditCards: 1200, investments: 0, netLiquidAssets: 3300 },
  savingsRate: 30,
  upcoming: [],
  insights: [],
  errors: [],
};

const EMPTY_FORECAST: CashFlowForecast = {
  asOfDate: '2026-08-03',
  availableCash: 4500,
  daily: [],
  ranges: {},
  warnings: [],
  eventCount: 0,
  recurringCount: 0,
  mortgageCount: 0,
  savingsCount: 0,
};

export function makeSnapshot(overrides?: Partial<CoachSnapshotData>): CoachSnapshotData {
  return {
    asOfDate: '2026-08-03',
    dashboard: EMPTY_DASHBOARD,
    forecast: EMPTY_FORECAST,
    currentMonth: {
      label: '2026-08',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      income: 5000,
      expenses: 3500,
      byCategory: [],
    },
    previousMonth: {
      label: '2026-07',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      income: 5000,
      expenses: 3500,
      byCategory: [],
    },
    historical: [],
    rawMortgages: [],
    rawSavings: [],
    unavailableSources: [],
    ...overrides,
  };
}

export { EMPTY_DASHBOARD, EMPTY_FORECAST };
