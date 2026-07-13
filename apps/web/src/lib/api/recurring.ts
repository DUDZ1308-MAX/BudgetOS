import { supabase } from '@/lib/supabase';
import type { RecurringTransaction, RecurringTransactionInsert, RecurringTransactionUpdate } from '@budgetos/database';

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[api/recurring] ${method}`, ...args);
}

export const recurringApi = {
  async list(userId: string): Promise<RecurringTransaction[]> {
    debug('list', userId);
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('next_run', { ascending: true });
    if (error) { debug('list error', error); throw error; }
    return data ?? [];
  },

  async get(id: string): Promise<RecurringTransaction> {
    debug('get', id);
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) { debug('get error', error); throw error; }
    return data;
  },

  async create(userId: string, data: RecurringTransactionInsert): Promise<RecurringTransaction> {
    debug('create', data);
    const { data: result, error } = await supabase
      .from('recurring_transactions')
      .insert({ user_id: userId, ...data })
      .select('*')
      .single();
    if (error) { debug('create error', error); throw error; }
    return result;
  },

  async update(id: string, data: RecurringTransactionUpdate): Promise<RecurringTransaction> {
    debug('update', id, data);
    const { data: result, error } = await supabase
      .from('recurring_transactions')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) { debug('update error', error); throw error; }
    return result;
  },

  async remove(id: string): Promise<RecurringTransaction> {
    debug('remove', id);
    const { data: result, error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .select('*')
      .single();
    if (error) { debug('remove error', error); throw error; }
    return result;
  },
};
