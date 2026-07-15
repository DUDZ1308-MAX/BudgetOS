import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useAuditStore } from '@/core/audit';
import { emitEntityEvent } from '@/core/sync';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '@budgetos/database';
import type { BudgetInsert, BudgetUpdate } from '@budgetos/database';
import { logger } from '@/core/logger';

export function useBudgets(year?: number, month?: number) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['budgets', user?.id, year, month],
    queryFn: async () => {
      const res = await getBudgets(supabase, user!.id, year, month);
      return res.data ?? [];
    },
    enabled: !!user,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (data: BudgetInsert) => {
      const res = await createBudget(supabase, user!.id, data);
      return res.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] });
      if (created) {
        useAuditStore.getState().addEntry({ action: 'create', entity: 'budget', entityId: created.id, before: null, after: created as any, userId: user?.id ?? null, description: `Created budget for category ${created.category_id}` });
        emitEntityEvent('budget', created.id, 'created', null, created as any, user?.id);
      }
    },
    onError: (err) => {
      logger.error('Budget creation failed', 'useBudgets', err);
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BudgetUpdate }) => {
      const res = await updateBudget(supabase, id, data);
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] });
      if (updated) {
        useAuditStore.getState().addEntry({ action: 'update', entity: 'budget', entityId: updated.id, before: null, after: updated as any, userId: user?.id ?? null, description: `Updated budget for category ${updated.category_id}` });
        emitEntityEvent('budget', updated.id, 'updated', null, updated as any, user?.id);
      }
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteBudget(supabase, id);
      return res.data;
    },
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] });
      if (deleted) {
        useAuditStore.getState().addEntry({ action: 'delete', entity: 'budget', entityId: deleted.id, before: deleted as any, after: null, userId: user?.id ?? null, description: `Deleted budget for category ${deleted.category_id}` });
        emitEntityEvent('budget', deleted.id, 'deleted', deleted as any, null, user?.id);
      }
    },
  });
}
