import { supabase } from '@/lib/supabase';
import type { Account, AccountInsert, AccountUpdate } from '@budgetos/database';

// TODO: In production, validate all inputs with Zod schemas before sending to Supabase.

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[api/accounts] ${method}`, ...args);
}

export const accountsApi = {
  async list(userId: string): Promise<Account[]> {
    debug('list', userId);
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) {
      debug('list error', error);
      throw error;
    }
    return data ?? [];
  },

  async create(userId: string, data: AccountInsert): Promise<Account> {
    debug('create', data);
    const { data: result, error } = await supabase
      .from('accounts')
      .insert({ user_id: userId, ...data })
      .select('*')
      .single();
    if (error) {
      debug('create error', error);
      throw error;
    }
    return result;
  },

  async update(id: string, data: AccountUpdate): Promise<Account> {
    debug('update', id, data);
    const { data: result, error } = await supabase
      .from('accounts')
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

  async remove(id: string): Promise<Account> {
    debug('remove', id);
    const { data: result, error } = await supabase
      .from('accounts')
      .update({ is_active: false })
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
