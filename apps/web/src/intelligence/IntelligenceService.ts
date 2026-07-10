import type { IntelligenceInput, FinancialHealthResult, ProactiveAlert, Recommendation, Notification, SpendingPattern, TrendData, GoalAnalysis } from './types';
import { computeFinancialHealth } from './FinancialHealthEngine';
import { generateAlerts } from './AlertEngine';
import { generateRecommendations } from './RecommendationEngine';
import { analyzeTrends } from './TrendAnalyzer';
import { analyzeSpendingPatterns } from './SpendingPatternAnalyzer';
import { analyzeGoals } from './GoalAnalyzer';
import { createNotifications } from './NotificationEngine';
import { generateWeeklySummary, generateMonthlyReview } from './RetentionEngine';
import type { WeeklySummary, MonthlyReview } from './RetentionEngine';

export interface IntelligenceOutput {
  healthScore: FinancialHealthResult;
  alerts: ProactiveAlert[];
  recommendations: Recommendation[];
  notifications: Notification[];
  spendingPatterns: SpendingPattern;
  trends: TrendData;
  goalAnalyses: Record<string, GoalAnalysis>;
  weeklySummary: WeeklySummary | null;
  monthlyReview: MonthlyReview | null;
}

export function generate(input: IntelligenceInput): IntelligenceOutput {
  const healthScore = computeFinancialHealth(input);
  const alerts = generateAlerts(input);
  const recommendations = generateRecommendations(input);
  const spendingPatterns = analyzeSpendingPatterns(input);
  const trends = analyzeTrends(input);
  const goalAnalyses = analyzeGoals(input);
  const notifications = createNotifications(alerts, recommendations);
  const weeklySummary = generateWeeklySummary(input);
  const monthlyReview = generateMonthlyReview(input, healthScore.overallScore, recommendations);

  return {
    healthScore,
    alerts,
    recommendations,
    notifications,
    spendingPatterns,
    trends,
    goalAnalyses,
    weeklySummary,
    monthlyReview,
  };
}
