import { supabase } from '@/lib/supabase';
import type { PortalResult } from '@/billing/stripe/stripeTypes';

export async function createPortalSession(): Promise<PortalResult> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-customer-portal');

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.url) {
      return { success: false, error: 'Billing portal could not be opened. Please try again.' };
    }

    return { success: true, url: data.url as string };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to open billing portal' };
  }
}
