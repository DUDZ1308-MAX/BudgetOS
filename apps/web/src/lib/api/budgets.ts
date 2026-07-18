import { supabase } from '@/lib/supabase';
import type { Budget, BudgetInsert, BudgetUpdate } from '@budgetos/database';

// TODO: In production, validate all inputs with Zod schemas before sending to Supabase.

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[api/budgets] ${method}`, ...args);
}

export const budgetsApi = {
  async list(userId: string, year?: number, month?: number): Promise<Budget[]> {
    debug('list', userId, year, month);
    let query = supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (year !== undefined && month !== undefined) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      query = query.eq('month_key', monthKey);
    } else if (year !== undefined) {
      query = query.ilike('month_key', `${year}-%`);
    }

    const { data, error } = await query;
    if (error) {
      debug('list error', error);
      throw error;
    }
    return (data ?? []).map((row: any) => {
      const parts = (row.month_key ?? '').split('-');
      return { ...row, year: parts[0] ? Number(parts[0]) : new Date().getFullYear(), month: parts[1] ? Number(parts[1]) : new Date().getMonth() + 1 };
    });
  },

  async create(userId: string, data: BudgetInsert): Promise<Budget> {
    const { year, month, rollover, ...rest } = data as any;
    const monthKey = year && month ? `${year}-${String(month).padStart(2, '0')}` : undefined;

    if (!monthKey) {
      throw new Error('Year and month are required to create a budget.');
    }

    if (!rest.category_id) {
      throw new Error('Category is required.');
    }

    const parsedAmount = Number(rest.amount);
    if (!parsedAmount || parsedAmount <= 0) {
      throw new Error('Budget amount must be a positive number.');
    }

    // Check for duplicate budget (same category + same month)
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', userId)
      .eq('category_id', rest.category_id)
      .eq('month_key', monthKey)
      .maybeSingle();

    if (existing) {
      throw new Error('A budget already exists for this category in this month.');
    }

    const payload: Record<string, unknown> = {
      user_id: userId,
      category_id: rest.category_id,
      amount: parsedAmount,
      month_key: monthKey,
    };
    if (rollover !== undefined) payload.rollover_enabled = rollover;

    const { data: result, error } = await supabase
      .from('budgets')
      .insert(payload)
      .select('*')
      .single();
    if (error) {
      debug('create error', error);
      throw error;
    }
    return result;
  },

  async update(id: string, data: BudgetUpdate): Promise<Budget> {
    const { year, month, rollover, ...rest } = data as any;
    const payload: Record<string, unknown> = { ...rest };
    if (year !== undefined && month !== undefined) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      payload.month_key = monthKey;

      if (rest.category_id) {
        const { data: existing } = await supabase
          .from('budgets')
          .select('id')
          .eq('category_id', rest.category_id)
          .eq('month_key', monthKey)
          .neq('id', id)
          .maybeSingle();
        if (existing) {
          throw new Error('A budget already exists for this category in this month.');
        }
      }
    }
    if (rollover !== undefined) payload.rollover_enabled = rollover;
    const { data: result, error } = await supabase
      .from('budgets')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      debug('update error', error);
      throw error;
    }
    return result;
  },

  async remove(id: string): Promise<Budget> {
    debug('remove', id);
    const { data: result, error } = await supabase
      .from('budgets')
      .delete()
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
