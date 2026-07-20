import { supabase } from '@/lib/supabase';
import type { Transaction, TransactionInsert, TransactionUpdate } from '@budgetos/database';

export const TransactionRepository = {
  async getAll(
    userId: string,
    options?: { fromDate?: string; toDate?: string; limit?: number },
  ): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (options?.fromDate) {
      query = query.gte('date', options.fromDate);
    }
    if (options?.toDate) {
      query = query.lte('date', options.toDate);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(userId: string, data: TransactionInsert): Promise<Transaction> {
    if (data.account_id) {
      const { data: acct } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', data.account_id)
        .eq('user_id', userId)
        .maybeSingle();
      if (!acct) {
        const err = new Error('The selected account no longer exists. Please select a different account.') as any;
        err.code = '23503';
        throw err;
      }
    }

    const { data: result, error } = await supabase
      .from('transactions')
      .insert({ user_id: userId, ...data })
      .select('*')
      .single();
    if (error) throw error;
    return result;
  },

  async update(id: string, data: TransactionUpdate): Promise<Transaction> {
    const { data: result, error } = await supabase
      .from('transactions')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return result;
  },

  async archive(id: string): Promise<Transaction> {
    const { data: result, error } = await supabase
      .from('transactions')
      .update({ is_archived: true })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return result;
  },
};
