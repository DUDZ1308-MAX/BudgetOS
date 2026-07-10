import { supabase } from '@/lib/supabase';
import type { Category, CategoryInsert, CategoryUpdate } from '@budgetos/database';

// TODO: In production, validate all inputs with Zod schemas before sending to Supabase.

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[api/categories] ${method}`, ...args);
}

export const categoriesApi = {
  async list(userId: string): Promise<Category[]> {
    debug('list', userId);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      debug('list error', error);
      throw error;
    }
    return data ?? [];
  },

  async create(userId: string, data: CategoryInsert): Promise<Category> {
    debug('create', data);
    const { data: result, error } = await supabase
      .from('categories')
      .insert({ user_id: userId, ...data })
      .select('*')
      .single();
    if (error) {
      debug('create error', error);
      throw error;
    }
    return result;
  },

  async update(id: string, data: CategoryUpdate): Promise<Category> {
    debug('update', id, data);
    const { data: result, error } = await supabase
      .from('categories')
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
};
