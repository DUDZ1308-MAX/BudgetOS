import { supabase } from '@/lib/supabase';
import type { Mortgage } from '@budgetos/database';

export const MortgageRepository = {
  async getAll(userId: string): Promise<Mortgage[]> {
    const { data, error } = await supabase
      .from('mortgages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
