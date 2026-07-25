// Planning event types for Timeline
export type PlanningEventType = 
  | 'payday' 
  | 'bill' 
  | 'credit_card_payment' 
  | 'mortgage' 
  | 'mortgage_payoff' 
  | 'savings_milestone' 
  | 'investment_milestone' 
  | 'retirement_target' 
  | 'emergency_fund' 
  | 'debt_payoff' 
  | 'budget_boundary' 
  | 'large_expense' 
  | 'user_milestone' 
  | 'ai_recommendation' 
  | 'health_score_milestone' 
  | 'forecast_checkpoint';

export interface PlanningEvent {
  id: string;
  type: PlanningEventType;
  date: string;
  title: string;
  description?: string;
  amount?: number;
  icon: string;
  category: PlanningEventCategory;
  status: EventStatus;
  color: string;
  linkedFeature?: string;
  linkedPage?: string;
  data?: Record<string, unknown>;
  isForecast: boolean;
  forecastConfidence?: number;
  source: 'deterministic' | 'ai' | 'user';
  parentEventId?: string;
  dependentEventIds?: string[];
}

export type PlanningEventCategory = 
  | 'income' 
  | 'expense' 
  | 'debt' 
  | 'savings' 
  | 'investment' 
  | 'retirement' 
  | 'mortgage' 
  | 'bill' 
  | 'goal' 
  | 'milestone' 
  | 'forecast' 
  | 'recommendation' 
  | 'health';

export type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'missed';

export interface TimelineView {
  id: string;
  name: string;
  type: 'monthly' | 'quarterly' | 'yearly' | '5year' | 'lifetime';
  startDate: string;
  endDate: string;
  zoomLevel: number;
  visibleFilters: PlanningEventCategory[];
}

export interface PlanningScenario {
  id: string;
  name: string;
  description?: string;
  adjustments: ScenarioAdjustment[];
  isActive: boolean;
  createdAt: string;
  lastUpdated: string;
}

export interface ScenarioAdjustment {
  type: 'income' | 'expense' | 'savings' | 'debt' | 'retirement' | 'investment' | 'mortgage' | 'interest_rate' | 'inflation';
  value: number;
  path: string;
}

export interface LifeEvent {
  id: string;
  type: 'marry' | 'divorce' | 'birth' | 'graduation' | 'retirement' | 'house_purchase' | 'house_sale' | 'vehicle_purchase' | 'vehicle_sale' | 'business_start' | 'business_exit' | 'vacation' | 'renovation' | 'custom';
  name: string;
  description: string;
  date: string;
  impact: LifeEventImpact;
  isEnabled: boolean;
}

export interface LifeEventImpact {
  incomeAdjustment: number;
  expenseAdjustment: number;
  savingsAdjustment: number;
  debtAdjustment: number;
  retirementAdjustment: number;
  investmentAdjustment: number;
  mortgageAdjustment: number;
}

export interface ForecastEvent extends PlanningEvent {
  eventType: 'mortgage_payoff' | 'savings_completion' | 'retirement_readiness' | 'debt_freedom' | 'net_worth_milestone' | 'emergency_fund_completion' | 'investment_milestone';
  projectedDate?: string;
  confidence: number;
  data: Record<string, unknown>;
}

export interface AIInsightEvent extends PlanningEvent {
  insightType: 'budget_deficit' | 'early_goal_achievement' | 'recommendation' | 'warning' | 'opportunity';
  reasoning: string;
  suggestedAction?: string;
  impactScore: number;
}

export interface PlanningDashboard {
  retirement: RetirementReadiness;
  investments: InvestmentProgress;
  debt: DebtProgress;
  timelinePreview: PlanningEvent[];
  scenarioSummary: ScenarioSummary;
  goalProgress: GoalProgress[];
  forecastSnapshot: ForecastSnapshot;
  quickActions: PlanningAction[];
}

export interface RetirementReadiness {
  ageToRetire: number;
  currentSavings: number;
  targetSavings: number;
  annualContribution: number;
  expectedReturnRate: number;
  inflationRate: number;
  retirementIncomeTarget: number;
  readinessScore: number;
  yearsToRetire: number;
}

export interface InvestmentProgress {
  allocation: AssetAllocation;
  historicalReturns: ReturnData[];
  targetReturns: number;
  currentValue: number;
  totalInvested: number;
  growthRate: number;
}

export interface AssetAllocation {
  stocks: number;
  etfs: number;
  mutualFunds: number;
  bonds: number;
  cash: number;
  crypto: number;
}

export interface ReturnData {
  year: number;
  returnRate: number;
  contribution: number;
  finalValue: number;
}

export interface DebtProgress {
  totalDebt: number;
  totalPaid: number;
  remainingBalance: number;
  payoffDate: string;
  strategies: DebtStrategy[];
  currentStrategy: DebtStrategyType;
}

export interface DebtStrategy {
  type: DebtStrategyType;
  monthlyPayment: number;
  interestRate: number;
  payoffMonths: number;
  interestPaid: number;
  isOptimal: boolean;
}

export type DebtStrategyType = 'snowball' | 'avalanche' | 'custom';

export interface ScenarioSummary {
  activeScenarios: number;
  scenarioComparisons: number;
  bestPerformingScenario: string;
  worstPerformingScenario: string;
}

export interface GoalProgress {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  deadline: string;
  progress: number;
  category: PlanningEventCategory;
}

export interface ForecastSnapshot {
  netWorthProjection: ProjectionPoint[];
  cashFlowProjection: ProjectionPoint[];
  debtPayoffProjection: ProjectionPoint[];
  savingsGoalProjection: ProjectionPoint[];
}

export interface ProjectionPoint {
  date: string;
  value: number;
  cumulativeValue: number;
}

export interface PlanningAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  category: 'retirement' | 'investment' | 'debt' | 'savings' | 'planning';
  requiresConfirmation: boolean;
}

export interface PlanningSettings {
  preferredRetirementAge: number;
  forecastHorizon: number;
  expectedInvestmentReturn: number;
  inflationRate: number;
  debtStrategy: DebtStrategyType;
  timelineDefaultView: TimelineViewType;
  timelineVisibleFilters: PlanningEventCategory[];
  enableLifeEvents: boolean;
}

export type TimelineViewType = 'monthly' | 'quarterly' | 'yearly' | '5year' | 'lifetime';