import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { useAuditStore } from '@/core/audit';
import { emitEntityEvent } from '@/core/sync';
import { savingsApi } from '@/lib/api/savings';
import type { SavingsGoalInsert, SavingsGoalUpdate } from '@/lib/api/savings';

export function useSavingsGoals() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['savings-goals', user?.id],
    queryFn: () => savingsApi.list(user!.id),
    enabled: !!user,
  });
}

export function useCreateSavingsGoal() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: SavingsGoalInsert) => savingsApi.create(user!.id, data),
    onSuccess: (created) => { qc.invalidateQueries({ queryKey: ['savings-goals', user?.id] }); toast('success', 'Goal created'); if (created) { useAuditStore.getState().addEntry({ action: 'create', entity: 'savings_goal', entityId: created.id, before: null, after: created as any, userId: user?.id ?? null, description: `Created savings goal "${created.name}"` }); emitEntityEvent('savings_goal', created.id, 'created', null, created as any, user?.id); } },
    onError: (err: Error) => { toast('error', err.message); },
  });
}

export function useUpdateSavingsGoal() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SavingsGoalUpdate }) => savingsApi.update(id, data),
    onSuccess: (updated) => { qc.invalidateQueries({ queryKey: ['savings-goals', user?.id] }); toast('success', 'Goal updated'); if (updated) { useAuditStore.getState().addEntry({ action: 'update', entity: 'savings_goal', entityId: updated.id, before: null, after: updated as any, userId: user?.id ?? null, description: `Updated savings goal` }); emitEntityEvent('savings_goal', updated.id, 'updated', null, updated as any, user?.id); } },
    onError: (err: Error) => { toast('error', err.message); },
  });
}

export function useDeleteSavingsGoal() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => savingsApi.remove(id),
    onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: ['savings-goals', user?.id] }); toast('success', 'Goal deleted'); useAuditStore.getState().addEntry({ action: 'delete', entity: 'savings_goal', entityId: id, before: null, after: null, userId: user?.id ?? null, description: `Deleted savings goal` }); emitEntityEvent('savings_goal', id, 'deleted', null, null, user?.id); },
    onError: (err: Error) => { toast('error', err.message); },
  });
}

export function useArchiveSavingsGoal() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => savingsApi.archive(id),
    onSuccess: (archived) => { qc.invalidateQueries({ queryKey: ['savings-goals', user?.id] }); toast('success', 'Goal archived'); if (archived) { useAuditStore.getState().addEntry({ action: 'archive', entity: 'savings_goal', entityId: archived.id, before: null, after: archived as any, userId: user?.id ?? null, description: `Archived savings goal "${archived.name}"` }); emitEntityEvent('savings_goal', archived.id, 'archived', null, archived as any, user?.id); } },
    onError: (err: Error) => { toast('error', err.message); },
  });
}

export function useDupeSavingsGoal() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: async (goal: { name: string; target_amount: number; target_date?: string | null }) => {
      return savingsApi.create(user!.id, { ...goal, current_amount: 0 });
    },
    onSuccess: (created) => { qc.invalidateQueries({ queryKey: ['savings-goals', user?.id] }); toast('success', 'Goal duplicated'); if (created) { useAuditStore.getState().addEntry({ action: 'create', entity: 'savings_goal', entityId: created.id, before: null, after: created as any, userId: user?.id ?? null, description: `Duplicated savings goal "${created.name}"` }); emitEntityEvent('savings_goal', created.id, 'created', null, created as any, user?.id); } },
    onError: (err: Error) => { toast('error', err.message); },
  });
}

export function useContributions(goalId: string | undefined) {
  return useQuery({
    queryKey: ['savings-contributions', goalId],
    queryFn: () => savingsApi.listContributions(goalId!),
    enabled: !!goalId,
  });
}

export function useAddContribution() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ goalId, amount, date, notes }: { goalId: string; amount: number; date: string; notes?: string }) =>
      savingsApi.addContribution(goalId, { amount, date, notes }),
    onSuccess: (created, vars) => {
      qc.invalidateQueries({ queryKey: ['savings-contributions', vars.goalId] });
      qc.invalidateQueries({ queryKey: ['savings-goals'] });
      toast('success', 'Contribution added');
      if (created) {
        useAuditStore.getState().addEntry({ action: 'create', entity: 'contribution', entityId: created.id, before: null, after: created as any, userId: null, description: `Added $${vars.amount.toFixed(2)} contribution to goal` });
        emitEntityEvent('contribution', created.id, 'created', null, created as any, null);
      }
    },
    onError: (err: Error) => { console.error(err); },
  });
}

export function useDeleteContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, goalId }: { id: string; goalId: string }) => savingsApi.removeContribution(id),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['savings-contributions', vars.goalId] });
      qc.invalidateQueries({ queryKey: ['savings-goals'] });
    },
  });
}
