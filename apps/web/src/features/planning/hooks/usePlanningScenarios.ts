"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import {
  listPlanningScenarios,
  insertPlanningScenario,
  updatePlanningScenario,
  deletePlanningScenario,
} from '@budgetos/database';
import type { PlanningScenarioInsert, PlanningScenarioUpdate, PlanningScenario } from '@budgetos/database';

export function usePlanningScenarios() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['planning-scenarios', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await listPlanningScenarios(supabase, user.id);
      if (error) throw error;
      return (data ?? []) as PlanningScenario[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePlanningScenario() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PlanningScenarioInsert) => {
      if (!user) throw new Error('Not authenticated');
      const { data: result, error } = await insertPlanningScenario(supabase, user.id, data);
      if (error) throw error;
      return result as PlanningScenario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-scenarios'] });
    },
  });
}

export function useUpdatePlanningScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlanningScenarioUpdate }) => {
      const { data: result, error } = await updatePlanningScenario(supabase, id, data);
      if (error) throw error;
      return result as PlanningScenario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-scenarios'] });
    },
  });
}

export function useDeletePlanningScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deletePlanningScenario(supabase, id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-scenarios'] });
    },
  });
}
