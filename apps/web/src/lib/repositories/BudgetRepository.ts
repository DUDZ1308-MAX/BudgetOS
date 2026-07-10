import { supabase } from '@/lib/supabase';
import type { Budget, BudgetInsert, BudgetUpdate } from '@budgetos/database';

export const BudgetRepository = {
  async getAll(userId: string, year?: number, month?: number): Promise<Budget[]> {
    let query = supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (year !== undefined) {
      query = query.eq('year', year);
    }
    if (month !== undefined) {
      query = query.eq('month', month);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<Budget | null> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(userId: string, data: BudgetInsert): Promise<Budget> {
    const { data: result, error } = await supabase
      .from('budgets')
      .insert({ user_id: userId, ...data })
      .select('*')
      .single();
    if (error) throw error;
    return result;
  },

  async update(id: string, data: BudgetUpdate): Promise<Budget> {
    const { data: result, error } = await supabase
      .from('budgets')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return result;
  },

  async remove(id: string): Promise<Budget> {
    const { data: result, error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return result;
  },
};
