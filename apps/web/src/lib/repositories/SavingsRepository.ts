import { supabase } from '@/lib/supabase';
import type { SavingsGoal } from '@budgetos/database';

export const SavingsRepository = {
  async getAll(userId: string): Promise<SavingsGoal[]> {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
