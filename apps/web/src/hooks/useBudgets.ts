import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useAuditStore } from '@/core/audit';
import { emitEntityEvent } from '@/core/sync';
import { getBudgets, createBudget } from '@budgetos/database';
import type { BudgetInsert } from '@budgetos/database';

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
      console.error('[useCreateBudget] mutation failed', err);
    },
  });
}
