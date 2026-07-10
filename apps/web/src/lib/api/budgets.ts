import { supabase } from '@/lib/supabase';
import type { Budget, BudgetInsert, BudgetUpdate } from '@budgetos/database';

// TODO: In production, validate all inputs with Zod schemas before sending to Supabase.

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[api/budgets] ${method}`, ...args);
}

export const budgetsApi = {
  async list(userId: string, year?: number, month?: number): Promise<Budget[]> {
    debug('list', userId, year, month);
    let query = supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (year !== undefined) query = query.eq('year', year);
    if (month !== undefined) query = query.eq('month', month);

    const { data, error } = await query;
    if (error) {
      debug('list error', error);
      throw error;
    }
    return data ?? [];
  },

  async create(userId: string, data: BudgetInsert): Promise<Budget> {
    debug('create', data);
    const { data: result, error } = await supabase
      .from('budgets')
      .insert({ user_id: userId, ...data })
      .select('*')
      .single();
    if (error) {
      debug('create error', error);
      throw error;
    }
    return result;
  },

  async update(id: string, data: BudgetUpdate): Promise<Budget> {
    debug('update', id, data);
    const { data: result, error } = await supabase
      .from('budgets')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      debug('update error', error);
      throw error;
    }
    return result;
  },

  async remove(id: string): Promise<Budget> {
    debug('remove', id);
    const { data: result, error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      debug('remove error', error);
      throw error;
    }
    return result;
  },
};
