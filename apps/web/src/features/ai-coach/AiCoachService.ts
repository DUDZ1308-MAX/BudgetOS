import { FinancialEngine } from '@/services/FinancialEngine';
import { analyzeFinancials, buildSummary } from './AnalysisEngine';
import type { AiCoachState, AiAnalysisResult } from './types';
import type { DashboardSummaryData } from '@/lib/dashboard/types';

const STORAGE_KEY = 'budgetos_ai_coach';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedCoachData {
  result: AiAnalysisResult;
  timestamp: number;
  userId: string;
}

function loadCached(userId: string): AiAnalysisResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cached: CachedCoachData = JSON.parse(raw);
    if (cached.userId !== userId) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null;
    return cached.result;
  } catch {
    return null;
  }
}

function saveCache(userId: string, result: AiAnalysisResult): void {
  try {
    const data: CachedCoachData = { result, timestamp: Date.now(), userId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function getCachedAnalysis(userId: string): AiAnalysisResult | null {
  return loadCached(userId);
}

export function analyzeDashboardData(d: DashboardSummaryData, userId: string): AiAnalysisResult {
  const cached = loadCached(userId);
  if (cached) return cached;

  const result = analyzeFinancials(d);
  saveCache(userId, result);
  return result;
}

export function getInitialState(): AiCoachState {
  return {
    summary: null,
    insights: [],
    recommendations: [],
    achievements: [],
    warnings: [],
    savingsOpportunities: [],
    debtOpportunities: [],
    budgetOptimizations: [],
    cashFlowForecast: [],
    recentTrends: [],
    isLoading: true,
    error: null,
    lastAnalyzed: null,
  };
}

export function buildCoachState(analysis: AiAnalysisResult): AiCoachState {
  return {
    summary: analysis.summary,
    insights: analysis.insights,
    recommendations: analysis.recommendations,
    achievements: analysis.achievements,
    warnings: analysis.warnings,
    savingsOpportunities: analysis.savingsOpportunities,
    debtOpportunities: analysis.debtOpportunities,
    budgetOptimizations: analysis.budgetOptimizations,
    cashFlowForecast: analysis.cashFlowForecast,
    recentTrends: analysis.recentTrends,
    isLoading: false,
    error: null,
    lastAnalyzed: new Date().toISOString(),
  };
}

export function getTopInsight(state: AiCoachState): AiCoachState['insights'][0] | null {
  if (state.insights.length === 0) return null;
  const severityOrder = { critical: 0, negative: 1, neutral: 2, positive: 3 };
  return [...state.insights].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  )[0] ?? null;
}

export function getTopRecommendation(state: AiCoachState): AiCoachState['recommendations'][0] | null {
  if (state.recommendations.length === 0) return null;
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...state.recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  )[0] ?? null;
}

export function getHighestPriorityWarning(state: AiCoachState): AiCoachState['warnings'][0] | null {
  if (state.warnings.length === 0) return null;
  const severityOrder = { critical: 0, high: 1, medium: 2 };
  return [...state.warnings].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  )[0] ?? null;
}

export function getPositiveAchievement(state: AiCoachState): AiCoachState['achievements'][0] | null {
  return state.achievements.length > 0 ? (state.achievements[0] ?? null) : null;
}

export function filterRecommendations(
  recs: AiCoachState['recommendations'],
  filter: string,
): AiCoachState['recommendations'] {
  if (filter === 'all') return recs;
  if (filter === 'completed') return recs.filter((r) => r.applied);
  return recs.filter((r) => r.priority === filter);
}
