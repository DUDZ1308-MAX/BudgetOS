export type InsightType = 'spending' | 'savings' | 'debt' | 'cash_flow' | 'budget' | 'mortgage' | 'achievement' | 'warning' | 'opportunity' | 'trend' | 'net_worth' | 'health';
export type InsightSeverity = 'positive' | 'neutral' | 'negative' | 'critical';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface AiInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  metric?: string;
  value?: string;
  trend?: 'improving' | 'stable' | 'declining';
  actionable: boolean;
  category: string;
  createdAt: string;
}

export interface AiRecommendation {
  id: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  category: string;
  estimatedImpact: string;
  confidence: number;
  actionLabel: string;
  reasoning: string;
  supportingData?: string;
  dismissed: boolean;
  applied: boolean;
  createdAt: string;
}

export interface AiAchievement {
  id: string;
  title: string;
  description: string;
  metric?: string;
  value?: string;
  icon: string;
  unlockedAt: string;
}

export interface AiWarning {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  category: string;
  suggestedAction?: string;
  createdAt: string;
}

export interface AiFinancialSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  cashFlow: number;
  savingsRate: number;
  netWorth: number;
  healthScore: number;
  healthGrade?: string;
  totalAssets: number;
  totalLiabilities: number;
  budgetUtilization: number;
  activeGoals: number;
  goalsOnTrack: number;
  totalSaved: number;
  totalTarget: number;
  mortgageProgress: number;
  upcomingBillsCount: number;
  upcomingBillsTotal: number;
}

export interface AiCoachState {
  summary: AiFinancialSummary | null;
  insights: AiInsight[];
  recommendations: AiRecommendation[];
  achievements: AiAchievement[];
  warnings: AiWarning[];
  savingsOpportunities: AiRecommendation[];
  debtOpportunities: AiRecommendation[];
  budgetOptimizations: AiRecommendation[];
  cashFlowForecast: Array<{ month: string; projected: number; trend: 'positive' | 'negative' | 'stable' }>;
  recentTrends: AiInsight[];
  isLoading: boolean;
  error: string | null;
  lastAnalyzed: string | null;
}

export interface AiAnalysisResult {
  summary: AiFinancialSummary;
  insights: AiInsight[];
  recommendations: AiRecommendation[];
  achievements: AiAchievement[];
  warnings: AiWarning[];
  savingsOpportunities: AiRecommendation[];
  debtOpportunities: AiRecommendation[];
  budgetOptimizations: AiRecommendation[];
  cashFlowForecast: Array<{ month: string; projected: number; trend: 'positive' | 'negative' | 'stable' }>;
  recentTrends: AiInsight[];
}

export type FilterPriority = 'all' | PriorityLevel | 'completed';
