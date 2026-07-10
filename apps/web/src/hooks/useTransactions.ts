import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useAuditStore } from '@/core/audit';
import { emitEntityEvent } from '@/core/sync';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  archiveTransaction,
} from '@budgetos/database';
import type { TransactionInsert, TransactionUpdate, TransactionFilters } from '@budgetos/database';

export function useTransactions(filters?: TransactionFilters) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['transactions', user?.id, filters],
    queryFn: async () => {
      const res = await getTransactions(supabase, user!.id, filters);
      return res.data ?? [];
    },
    enabled: !!user,
  });
}

export function useTransaction(transactionId: string | undefined) {
  return useQuery({
    queryKey: ['transactions', transactionId],
    queryFn: async () => {
      const res = await getTransaction(supabase, transactionId!);
      return res.data;
    },
    enabled: !!transactionId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (data: TransactionInsert) => {
      const res = await createTransaction(supabase, user!.id, data);
      return res.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user?.id] });
      if (created) {
        useAuditStore.getState().addEntry({ action: 'create', entity: 'transaction', entityId: created.id, before: null, after: created as any, userId: user?.id ?? null, description: `Created transaction for $${Math.abs(created.amount).toFixed(2)}` });
        emitEntityEvent('transaction', created.id, 'created', null, created as any, user?.id);
      }
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TransactionUpdate }) => {
      const res = await updateTransaction(supabase, id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user?.id] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await archiveTransaction(supabase, id);
      return res.data;
    },
    onSuccess: (deleted, id) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user?.id] });
      if (deleted) {
        useAuditStore.getState().addEntry({ action: 'delete', entity: 'transaction', entityId: id, before: deleted as any, after: null, userId: user?.id ?? null, description: 'Deleted transaction' });
        emitEntityEvent('transaction', id, 'deleted', deleted as any, null, user?.id);
      }
    },
  });
}

export function useArchiveTransaction() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await archiveTransaction(supabase, id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user?.id] });
    },
  });
}
