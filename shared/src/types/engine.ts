import type { CoachMessageType, CoachCategory, FHSTier } from './enums';

export interface MortgageCalculationRequest {
  principal: number;
  annualRate: number;
  termYears: number;
  startDate: string;
  extraPayments: ExtraPayment[];
}

export interface ExtraPayment {
  type: 'monthly_fixed' | 'annual_lump' | 'one_time' | 'biweekly';
  amount: number;
  startMonth?: number;
  endMonth?: number;
}

export interface MortgageCalculationResult {
  scenarios: ScenarioResult[];
  generatedAt: string;
  engineVersion: string;
}

export interface ScenarioResult {
  label: string;
  monthlyPayment: number;
  totalPayments: number;
  totalPrincipal: number;
  totalInterest: number;
  payoffDate: string;
  interestSaved: number;
  amortizationSchedule: AmortizationRow[];
}

export interface AmortizationRow {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  totalInterestToDate: number;
  remainingBalance: number;
  extraPayment: number;
}

export interface InvestVsPayResult {
  extraPaymentAmount: number;
  assumedROI: number;
  mortgagePayoffMonths: number;
  totalInterestSaved: number;
  investmentValueAtPayoff: number;
  netWorthDelta: number;
  recommendation: string;
}

export interface BudgetSummaryRequest {
  budgets: CategoryBudget[];
  transactions: TransactionSummary[];
  previousMonthRollovers: Rollover[];
  totalIncome: number;
}

export interface CategoryBudget {
  categoryId: string;
  amount: number | null;
  percentage: number | null;
  rolloverEnabled: boolean;
}

export interface TransactionSummary {
  categoryId: string;
  totalAmount: number;
}

export interface Rollover {
  categoryId: string;
  unspentAmount: number;
}

export interface BudgetSummaryResult {
  categories: CategoryBudgetResult[];
  overall: OverallBudgetSummary;
}

export interface CategoryBudgetResult {
  categoryId: string;
  budgeted: number;
  spent: number;
  rolloverApplied: number;
  available: number;
  percentUsed: number;
  status: string;
}

export interface OverallBudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  adherencePercent: number;
  status: string;
}

export interface AllocationRequest {
  monthlySurplus: number;
  currentState: AllocationCurrentState;
  customPriorities?: PriorityOverride[];
}

export interface AllocationCurrentState {
  highInterestDebtBalance: number;
  emergencyFundBalance: number;
  monthlyExpenses: number;
  employerMatchPercent: number;
  salary: number;
  iraContributionsYTD: number;
  extraMortgageEnabled: boolean;
  mortgageExtraDesired: number;
  highInterestDebtApr: number;
}

export interface PriorityOverride {
  bucketName: string;
  order: number;
  splitPercent: number;
}

export interface AllocationResult {
  totalSurplus: number;
  remainingSurplus: number;
  steps: AllocationStep[];
  isFullyAllocated: boolean;
  summary: string;
}

export interface AllocationStep {
  priority: number;
  bucketName: string;
  targetAmount: number;
  currentProgress: number;
  recommendedAllocation: number;
  cumulativeAllocated: number;
  isComplete: boolean;
  estimatedCompletionDate: string | null;
}

export interface FHSRequest {
  totalIncomeMonthly: number;
  totalSavingsMonthly: number;
  totalDebtPaymentsMonthly: number;
  emergencyFundBalance: number;
  monthlyExpenses: number;
  budgets: FHSCategoryBudget[];
  actualSpending: FHSCategoryActual[];
  currentNetWorth: number;
  netWorthThreeMonthsAgo: number;
}

export interface FHSCategoryBudget {
  categoryId: string;
  budgeted: number;
}

export interface FHSCategoryActual {
  categoryId: string;
  spent: number;
}

export interface FHSResult {
  overallScore: number;
  tier: FHSTier;
  components: Record<string, FHSComponentScore>;
  recommendations: string[];
}

export interface FHSComponentScore {
  maxPoints: number;
  earnedPoints: number;
  percentage: number;
  details: string;
}

export interface CoachContext {
  eventType: CoachEventType;
  eventPayload: Record<string, unknown>;
  userState: UserFinancialState;
  existingMessages: CoachEvaluatedMessage[];
}

export type CoachEventType =
  | 'transaction_added'
  | 'budget_period_closed'
  | 'goal_milestone'
  | 'monthly_rollover'
  | 'score_changed'
  | 'account_low_balance';

export interface UserFinancialState {
  currentMonthBudgets: UserCategoryBudget[];
  recentTransactions: UserRecentTransaction[];
  savingsGoals: UserGoalSummary[];
  healthScore: number | null;
  netWorth: number;
  cashFlow: { income: number; expenses: number };
}

export interface UserCategoryBudget {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  spent: number;
  percentUsed: number;
}

export interface UserRecentTransaction {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  date: string;
  merchant: string | null;
}

export interface UserGoalSummary {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  percentComplete: number;
}

export interface CoachEvaluatedMessage {
  type: CoachMessageType;
  category: CoachCategory;
  deduplicationKey: string;
}

export interface CoachMessageOutput {
  type: CoachMessageType;
  category: CoachCategory;
  title: string;
  message: string;
  priority: number;
  deduplicationKey: string;
}

export interface CoachRule {
  id: string;
  condition: (ctx: CoachContext) => boolean;
  template: CoachTemplate;
}

export interface CoachTemplate {
  type: CoachMessageType;
  category: CoachCategory;
  title: string;
  messageTemplate: string;
  priority: number;
}
