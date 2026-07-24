export type CoachQuestionId =
  | 'spending-summary'
  | 'budget-health'
  | 'savings-progress'
  | 'mortgage-status'
  | 'cash-flow'
  | 'net-worth'
  | 'safe-to-spend'
  | 'forecast'
  | 'recurring-overview'
  | 'top-categories';

export interface CoachQuestion {
  id: CoachQuestionId;
  label: string;
  prompt: string;
  icon: string;
}

export interface CoachMetric {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

export interface CoachCalculation {
  description: string;
  formula: string;
  result: string;
}

export interface CoachAnswer {
  questionId: CoachQuestionId;
  summary: string;
  metrics: CoachMetric[];
  calculations: CoachCalculation[];
  confidence: number;
  nextActions: string[];
  referencedMetrics: string[];
}

export interface CoachRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  savings: number;
  category: string;
  actionLabel: string;
  reasoning: string;
  supportingCalculation: string;
}

export interface CoachSummary {
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
  savingsRate: number;
  budgetHealth: 'good' | 'fair' | 'poor';
  activeGoals: number;
  topAlerts: number;
  lastUpdated: string;
  recommendationCount: number;
}

export const COACH_QUESTIONS: CoachQuestion[] = [
  { id: 'spending-summary', label: 'Spending Summary', prompt: 'Give me a summary of my spending', icon: '📊' },
  { id: 'budget-health', label: 'Budget Health', prompt: 'How healthy is my budget?', icon: '📋' },
  { id: 'savings-progress', label: 'Savings Progress', prompt: 'How are my savings goals doing?', icon: '🎯' },
  { id: 'mortgage-status', label: 'Mortgage Status', prompt: 'What is my mortgage status?', icon: '🏠' },
  { id: 'cash-flow', label: 'Cash Flow', prompt: 'How is my cash flow looking?', icon: '💵' },
  { id: 'net-worth', label: 'Net Worth', prompt: 'What is my net worth?', icon: '💰' },
  { id: 'safe-to-spend', label: 'Safe to Spend', prompt: 'How much can I safely spend?', icon: '🛡️' },
  { id: 'forecast', label: 'Forecast', prompt: 'What is my financial outlook?', icon: '🔮' },
  { id: 'recurring-overview', label: 'Recurring Bills', prompt: 'What recurring bills do I have?', icon: '🔄' },
  { id: 'top-categories', label: 'Top Categories', prompt: 'What are my top spending categories?', icon: '🏷️' },
];
