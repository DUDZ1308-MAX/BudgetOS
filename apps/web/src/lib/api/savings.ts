import { supabase } from '@/lib/supabase';
import type { SavingsGoal } from '@budgetos/database';

// TODO: In production, validate all inputs with Zod schemas before sending to Supabase.

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[api/savings] ${method}`, ...args);
}

export type SavingsGoalInsert = {
  name: string;
  target_amount: number;
  current_amount?: number;
  monthly_contribution?: number;
  target_date?: string | null;
  category_id?: string | null;
  is_completed?: boolean;
  sort_order?: number;
  priority?: number;
  status?: string;
};

export type SavingsGoalUpdate = Partial<SavingsGoalInsert>;

export interface SavingsContribution {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export const savingsApi = {
  async list(userId: string): Promise<SavingsGoal[]> {
    debug('list', userId);
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { debug('list error', error); throw error; }
    return data ?? [];
  },

  async create(userId: string, data: SavingsGoalInsert): Promise<SavingsGoal> {
    debug('create', data);
    const { data: result, error } = await supabase
      .from('savings_goals')
      .insert({ user_id: userId, ...data, current_amount: data.current_amount ?? 0 })
      .select('*')
      .single();
    if (error) { debug('create error', error); throw error; }
    return result;
  },

  async update(id: string, data: SavingsGoalUpdate): Promise<SavingsGoal> {
    debug('update', id, data);
    const { data: result, error } = await supabase
      .from('savings_goals')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    if (error) { debug('update error', error); throw error; }
    return result;
  },

  async remove(id: string): Promise<void> {
    debug('remove', id);
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (error) { debug('remove error', error); throw error; }
  },

  async archive(id: string): Promise<SavingsGoal> {
    debug('archive', id);
    return savingsApi.update(id, { is_completed: true });
  },

  // Contributions
  async listContributions(goalId: string): Promise<SavingsContribution[]> {
    debug('listContributions', goalId);
    const { data, error } = await supabase
      .from('contributions')
      .select('*')
      .eq('goal_id', goalId)
      .order('date', { ascending: false });
    if (error) { debug('listContributions error', error); throw error; }
    return data ?? [];
  },

  async addContribution(userId: string, goalId: string, data: { amount: number; date: string; notes?: string }): Promise<SavingsContribution> {
    debug('addContribution', userId, goalId, data);
    const { data: result, error } = await supabase
      .from('contributions')
      .insert({ user_id: userId, goal_id: goalId, ...data })
      .select('*')
      .single();
    if (error) { debug('addContribution error', error); throw error; }
    return result;
  },

  async updateContribution(id: string, data: { amount?: number; date?: string; notes?: string }): Promise<SavingsContribution> {
    debug('updateContribution', id, data);
    const { data: result, error } = await supabase
      .from('contributions')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    if (error) { debug('updateContribution error', error); throw error; }
    return result;
  },

  async removeContribution(id: string): Promise<void> {
    debug('removeContribution', id);
    const { error } = await supabase.from('contributions').delete().eq('id', id);
    if (error) { debug('removeContribution error', error); throw error; }
  },
};
