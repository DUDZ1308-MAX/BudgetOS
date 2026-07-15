import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useAuditStore } from '@/core/audit';
import { emitEntityEvent } from '@/core/sync';
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  archiveAccount,
} from '@budgetos/database';
import type { AccountInsert, AccountUpdate } from '@budgetos/database';
import { logger } from '@/core/logger';

export function useAccounts() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      const res = await getAccounts(supabase, user!.id);
      return res.data ?? [];
    },
    enabled: !!user,
  });
}

export function useAccount(accountId: string | undefined) {
  return useQuery({
    queryKey: ['accounts', accountId],
    queryFn: async () => {
      const res = await getAccount(supabase, accountId!);
      return res.data;
    },
    enabled: !!accountId,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (data: AccountInsert) => {
      const res = await createAccount(supabase, user!.id, data);
      return res.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user?.id] });
      if (created) {
        useAuditStore.getState().addEntry({ action: 'create', entity: 'account', entityId: created.id, before: null, after: created as any, userId: user?.id ?? null, description: `Created account "${created.name}"` });
        emitEntityEvent('account', created.id, 'created', null, created as any, user?.id);
      }
    },
    onError: (err) => {
      logger.error('Account creation failed', 'useAccounts', err);
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AccountUpdate }) => {
      const res = await updateAccount(supabase, id, data);
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user?.id] });
      if (updated) {
        useAuditStore.getState().addEntry({ action: 'update', entity: 'account', entityId: updated.id, before: null, after: updated as any, userId: user?.id ?? null, description: `Updated account "${updated.name}"` });
        emitEntityEvent('account', updated.id, 'updated', null, updated as any, user?.id);
      }
    },
  });
}

export function useArchiveAccount() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await archiveAccount(supabase, id);
      return res.data;
    },
    onSuccess: (archived) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary', user?.id] });
      if (archived) {
        useAuditStore.getState().addEntry({ action: 'archive', entity: 'account', entityId: archived.id, before: null, after: archived as any, userId: user?.id ?? null, description: `Archived account "${archived.name}"` });
        emitEntityEvent('account', archived.id, 'archived', null, archived as any, user?.id);
      }
    },
  });
}
