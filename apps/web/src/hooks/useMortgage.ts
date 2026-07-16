import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { useAuditStore } from '@/core/audit';
import { emitEntityEvent } from '@/core/sync';
import { mortgageApi } from '@/lib/api/mortgage';
import type { MortgageInsert, MortgageUpdate } from '@/lib/api/mortgage';

export function useMortgages() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['mortgages', user?.id],
    queryFn: () => mortgageApi.list(user!.id),
    enabled: !!user,
  });
}

export function useCreateMortgage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: MortgageInsert) => mortgageApi.create(user!.id, data),
    onSuccess: (created) => { qc.invalidateQueries({ queryKey: ['mortgages', user?.id] }); toast('success', 'Mortgage created'); if (created) { useAuditStore.getState().addEntry({ action: 'create', entity: 'mortgage', entityId: created.id, before: null, after: created as any, userId: user?.id ?? null, description: `Created mortgage "${created.name}"` }); emitEntityEvent('mortgage', created.id, 'created', null, created as any, user?.id); } },
    onError: (err: Error) => { toast('error', err.message); },
  });
}

export function useUpdateMortgage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MortgageUpdate }) => mortgageApi.update(id, data),
    onSuccess: (updated) => { qc.invalidateQueries({ queryKey: ['mortgages', user?.id] }); toast('success', 'Mortgage updated'); if (updated) { useAuditStore.getState().addEntry({ action: 'update', entity: 'mortgage', entityId: updated.id, before: null, after: updated as any, userId: user?.id ?? null, description: `Updated mortgage "${updated.name}"` }); emitEntityEvent('mortgage', updated.id, 'updated', null, updated as any, user?.id); } },
    onError: (err: Error) => { toast('error', err.message); },
  });
}

export function useDeleteMortgage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => mortgageApi.remove(id),
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: ['mortgages', user?.id] }); toast('success', 'Mortgage deleted'); useAuditStore.getState().addEntry({ action: 'delete', entity: 'mortgage', entityId: id, before: null, after: null, userId: user?.id ?? null, description: `Deleted mortgage` }); emitEntityEvent('mortgage', id, 'deleted', null, null, user?.id); },
    onError: (err: Error) => { toast('error', err.message); },
  });
}

export function useExtraPayments(mortgageId: string | undefined) {
  return useQuery({
    queryKey: ['mortgage-extra-payments', mortgageId],
    queryFn: async () => {
      try {
        return await mortgageApi.listExtraPayments(mortgageId!);
      } catch {
        // Table may not exist yet (migration pending) — return empty list
        return [];
      }
    },
    enabled: !!mortgageId,
    retry: false,
  });
}

export function useAddExtraPayment() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: async ({ mortgageId, amount, date, notes }: { mortgageId: string; amount: number; date: string; notes?: string }) => {
      try {
        return await mortgageApi.addExtraPayment(mortgageId, { amount, date, notes });
      } catch (err: any) {
        if (err?.message?.includes('relation') || err?.code === '42P01') {
          throw new Error('Extra payments table not yet available. Please run the database migration.');
        }
        throw err;
      }
    },
    onSuccess: (created, vars) => {
      qc.invalidateQueries({ queryKey: ['mortgage-extra-payments', vars.mortgageId] });
      toast('success', 'Extra payment added');
      if (created) {
        useAuditStore.getState().addEntry({ action: 'create', entity: 'extra_payment', entityId: created.id, before: null, after: created as any, userId: null, description: `Added $${vars.amount.toFixed(2)} extra payment to mortgage` });
        emitEntityEvent('extra_payment', created.id, 'created', null, created as any, null);
      }
    },
    onError: (err: Error) => { toast('error', err.message); },
  });
}

export function useDeleteExtraPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mortgageId }: { id: string; mortgageId: string }) => mortgageApi.removeExtraPayment(id),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['mortgage-extra-payments', vars.mortgageId] });
    },
  });
}
