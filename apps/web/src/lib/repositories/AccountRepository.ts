import { supabase } from '@/lib/supabase';
import type { Account, AccountInsert, AccountUpdate } from '@budgetos/database';

export const AccountRepository = {
  async getAll(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(userId: string, data: AccountInsert): Promise<Account> {
    const { data: result, error } = await supabase
      .from('accounts')
      .insert({ user_id: userId, ...data })
      .select('*')
      .single();
    if (error) throw error;
    return result;
  },

  async update(id: string, data: AccountUpdate): Promise<Account> {
    const { data: result, error } = await supabase
      .from('accounts')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return result;
  },

  async archive(id: string): Promise<Account> {
    const { data: result, error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return result;
  },
};
