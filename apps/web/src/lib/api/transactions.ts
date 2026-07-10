import { supabase } from '@/lib/supabase';
import type { Transaction, TransactionInsert, TransactionUpdate, TransactionFilters } from '@budgetos/database';

// TODO: In production, validate all inputs with Zod schemas before sending to Supabase.

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[api/transactions] ${method}`, ...args);
}

export const transactionsApi = {
  async list(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    debug('list', userId, filters);
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('date', filters.dateTo);
    if (filters?.accountId) query = query.eq('account_id', filters.accountId);
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters?.is_archived !== undefined) {
      query = query.eq('is_archived', filters.is_archived);
    } else {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;
    if (error) {
      debug('list error', error);
      throw error;
    }
    return data ?? [];
  },

  async create(userId: string, data: TransactionInsert): Promise<Transaction> {
    debug('create', data);
    const { data: result, error } = await supabase
      .from('transactions')
      .insert({ user_id: userId, ...data })
      .select('*')
      .single();
    if (error) {
      debug('create error', error);
      throw error;
    }
    return result;
  },

  async update(id: string, data: TransactionUpdate): Promise<Transaction> {
    debug('update', id, data);
    const { data: result, error } = await supabase
      .from('transactions')
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

  async remove(id: string): Promise<Transaction> {
    debug('remove', id);
    const { data: result, error } = await supabase
      .from('transactions')
      .update({ is_archived: true })
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
