import { supabase } from '@/lib/supabase';
import type { Mortgage } from '@budgetos/database';

// TODO: In production, validate all inputs with Zod schemas before sending to Supabase.

function debug(method: string, ...args: unknown[]) {
  if (import.meta.env.DEV) console.debug(`[api/mortgage] ${method}`, ...args);
}

export type MortgageInsert = {
  name: string;
  principal: number;
  annual_rate: number;
  term_years: number;
  start_date?: string | null;
  down_payment?: number;
  purchase_price?: number;
  notes?: string | null;
  extra_payment?: number;
};

export type MortgageUpdate = Partial<MortgageInsert> & { is_active?: boolean };

export interface ExtraPayment {
  id: string;
  mortgage_id: string;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export const mortgageApi = {
  async list(userId: string): Promise<Mortgage[]> {
    debug('list', userId);
    const { data, error } = await supabase
      .from('mortgages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { debug('list error', error); throw error; }
    return data ?? [];
  },

  async create(userId: string, data: MortgageInsert): Promise<Mortgage> {
    debug('create', data);
    const { data: result, error } = await supabase
      .from('mortgages')
      .insert({ user_id: userId, ...data })
      .select('*')
      .single();
    if (error) { debug('create error', error); throw error; }
    return result;
  },

  async update(id: string, data: MortgageUpdate): Promise<Mortgage> {
    debug('update', id, data);
    const { data: result, error } = await supabase
      .from('mortgages')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    if (error) { debug('update error', error); throw error; }
    return result;
  },

  async remove(id: string): Promise<void> {
    debug('remove', id);
    const { error } = await supabase.from('mortgages').delete().eq('id', id);
    if (error) { debug('remove error', error); throw error; }
  },

  // Extra payments
  async listExtraPayments(mortgageId: string): Promise<ExtraPayment[]> {
    debug('listExtraPayments', mortgageId);
    const { data, error } = await supabase
      .from('mortgage_extra_payments')
      .select('*')
      .eq('mortgage_id', mortgageId)
      .order('date', { ascending: false });
    if (error) { debug('listExtraPayments error', error); throw error; }
    return data ?? [];
  },

  async addExtraPayment(mortgageId: string, data: { amount: number; date: string; notes?: string }): Promise<ExtraPayment> {
    debug('addExtraPayment', mortgageId, data);
    const { data: result, error } = await supabase
      .from('mortgage_extra_payments')
      .insert({ mortgage_id: mortgageId, ...data })
      .select('*')
      .single();
    if (error) { debug('addExtraPayment error', error); throw error; }
    return result;
  },

  async updateExtraPayment(id: string, data: { amount?: number; date?: string; notes?: string }): Promise<ExtraPayment> {
    debug('updateExtraPayment', id, data);
    const { data: result, error } = await supabase
      .from('mortgage_extra_payments')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    if (error) { debug('updateExtraPayment error', error); throw error; }
    return result;
  },

  async removeExtraPayment(id: string): Promise<void> {
    debug('removeExtraPayment', id);
    const { error } = await supabase.from('mortgage_extra_payments').delete().eq('id', id);
    if (error) { debug('removeExtraPayment error', error); throw error; }
  },
};
