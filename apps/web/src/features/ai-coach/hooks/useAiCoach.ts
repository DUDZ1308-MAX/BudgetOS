import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { computeDashboard } from '@/lib/dashboard/computeDashboard';
import {
  analyzeDashboardData,
  getInitialState,
  buildCoachState,
  getTopInsight,
  getTopRecommendation,
  getHighestPriorityWarning,
  getPositiveAchievement,
  filterRecommendations,
  getCachedAnalysis,
} from '../AiCoachService';
import type { AiCoachState, FilterPriority } from '../types';

export function useAiCoach() {
  const user = useAuthStore((s) => s.user);

  const { data: dashboardResult, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['dashboard-summary', user?.id],
    queryFn: () => computeDashboard(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const coachState = useMemo<AiCoachState>(() => {
    if (!user) return { ...getInitialState(), isLoading: false, error: 'Not authenticated' };
    if (dashboardLoading) return getInitialState();
    if (dashboardError) return { ...getInitialState(), isLoading: false, error: 'Failed to load financial data' };
    if (!dashboardResult?.data) return { ...getInitialState(), isLoading: false, error: 'No data available' };

    const analysis = analyzeDashboardData(dashboardResult.data, user.id);
    return buildCoachState(analysis);
  }, [user, dashboardLoading, dashboardError, dashboardResult]);

  const topInsight = useMemo(() => getTopInsight(coachState), [coachState]);
  const topRecommendation = useMemo(() => getTopRecommendation(coachState), [coachState]);
  const topWarning = useMemo(() => getHighestPriorityWarning(coachState), [coachState]);
  const topAchievement = useMemo(() => getPositiveAchievement(coachState), [coachState]);

  const getFilteredRecommendations = useMemo(
    () => (filter: FilterPriority) => filterRecommendations(coachState.recommendations, filter),
    [coachState.recommendations],
  );

  return {
    ...coachState,
    topInsight,
    topRecommendation,
    topWarning,
    topAchievement,
    getFilteredRecommendations,
  };
}
