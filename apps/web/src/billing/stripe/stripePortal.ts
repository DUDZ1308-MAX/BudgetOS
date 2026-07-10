import { STRIPE_CONFIG } from './stripeConfig';
import type { PortalResult } from './stripeTypes';

export async function createPortalSession(customerId: string | null): Promise<PortalResult> {
  if (!customerId) {
    return { success: false, error: 'No customer ID available.' };
  }

  if (!STRIPE_CONFIG.publishableKey) {
    return { success: false, error: 'Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY.' };
  }

  try {
    const response = await fetch(STRIPE_CONFIG.getPortalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, returnUrl: `${window.location.origin}/billing` }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { success: false, error: body.error ?? `Portal failed (${response.status})` };
    }

    const data = await response.json();
    return { success: true, url: data.url };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error loading portal',
    };
  }
}
