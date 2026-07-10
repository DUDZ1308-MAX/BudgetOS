import { supabase } from '@/lib/supabase';
import type { Category } from '@budgetos/database';

export async function getCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('is_system', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
