import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useAuditStore } from '@/core/audit';
import { emitEntityEvent } from '@/core/sync';
import { recurringApi } from '@/lib/api/recurring';
import type { RecurringTransactionInsert, RecurringTransactionUpdate } from '@budgetos/database';

export function useRecurringTransactions() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['recurring-transactions', user?.id],
    queryFn: async () => {
      const data = await recurringApi.list(user!.id);
      return data;
    },
    enabled: !!user,
  });
}

export function useRecurringTransaction(id: string | undefined) {
  return useQuery({
    queryKey: ['recurring-transactions', id],
    queryFn: async () => {
      const data = await recurringApi.get(id!);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (data: RecurringTransactionInsert) => {
      const result = await recurringApi.create(user!.id, data);
      return result;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions', user?.id] });
      if (created) {
        useAuditStore.getState().addEntry({
          action: 'create', entity: 'recurring_transaction', entityId: created.id,
          before: null, after: created as any, userId: user?.id ?? null,
          description: `Created recurring transaction "${created.name}"`,
        });
        emitEntityEvent('recurring_transaction', created.id, 'created', null, created as any, user?.id);
      }
    },
  });
}

export function useUpdateRecurringTransaction() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RecurringTransactionUpdate }) => {
      const result = await recurringApi.update(id, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions', user?.id] });
    },
  });
}

export function useDeleteRecurringTransaction() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await recurringApi.remove(id);
      return result;
    },
    onSuccess: (deleted, id) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions', user?.id] });
      if (deleted) {
        useAuditStore.getState().addEntry({
          action: 'delete', entity: 'recurring_transaction', entityId: id,
          before: deleted as any, after: null, userId: user?.id ?? null,
          description: `Deleted recurring transaction "${deleted.name}"`,
        });
        emitEntityEvent('recurring_transaction', id, 'deleted', deleted as any, null, user?.id);
      }
    },
  });
}
