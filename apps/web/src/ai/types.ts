import type { EngineTransaction, EngineCategory, BudgetSummary, CashFlowSummary, Alert, Insight, SafeToSpendResult } from '@/engine/types';
import type { GoalProgressResult, SavingsDashboard } from '@/engine/SavingsEngine';
import type { MortgageDashboard, MortgageCalcResult } from '@/engine/MortgageEngine';

export type AiProviderName = 'openai' | 'ollama' | 'deepseek';

export interface AiProviderConfig {
  apiKey?: string;
  model: string;
  temperature: number;
  baseUrl?: string;
  maxTokens?: number;
  streaming?: boolean;
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiResponse {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface AiProvider {
  name: AiProviderName;
  chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse>;
  stream?(messages: AiMessage[], config: AiProviderConfig): AsyncIterable<AiResponse>;
  testConnection(config: AiProviderConfig): Promise<{ success: boolean; message: string }>;
}

export type ConnectionStatus = 'unknown' | 'connected' | 'failed';

export interface ProviderSetup {
  model: string;
  apiKey: string;
  baseUrl: string;
}

export interface AiContext {
  budgetSummary: BudgetSummary;
  cashFlowSummary: CashFlowSummary;
  insights: Insight[];
  alerts: Alert[];
  savings: {
    goals: { id: string; name: string; target: number; current: number; progress: GoalProgressResult }[];
    dashboard: SavingsDashboard;
  };
  mortgage: {
    dashboard: MortgageDashboard | null;
    details: MortgageCalcResult | null;
  };
  safeToSpend: SafeToSpendResult | null;
  recentTransactions: EngineTransaction[];
  categories: EngineCategory[];
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  confidence: number;
  reasoning: string;
  category: string;
  actionLabel: string;
  action?: () => void;
}

export interface ForecastPoint {
  month: string;
  value: number;
}

export type ForecastType = 'spending' | 'cashflow' | 'savings' | 'mortgage';

export interface FinancialForecast {
  type: ForecastType;
  title: string;
  current: number;
  projected: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  months: ForecastPoint[];
  description: string;
}

export interface AiAlert {
  id: string;
  type: 'unusual_spending' | 'large_transaction' | 'budget_exhausted' | 'goal_achieved' | 'mortgage_milestone' | 'cashflow_shortfall';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  category?: string;
  amount?: number;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  topCategories: { name: string; amount: number; percentage: number }[];
  savingsProgress: string;
  mortgageProgress: string;
  budgetHealth: string;
  netWorthChange: number;
  suggestions: string[];
}
