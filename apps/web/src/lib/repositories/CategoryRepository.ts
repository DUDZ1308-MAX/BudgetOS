import { supabase } from '@/lib/supabase';
import type { Category, CategoryInsert, CategoryUpdate } from '@budgetos/database';

export const CategoryRepository = {
  async getAll(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(userId: string, data: CategoryInsert): Promise<Category> {
    const { data: result, error } = await supabase
      .from('categories')
      .insert({ user_id: userId, ...data })
      .select('*')
      .single();
    if (error) throw error;
    return result;
  },

  async update(id: string, data: CategoryUpdate): Promise<Category> {
    const { data: result, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return result;
  },
};
