import { env } from '@/config/env';
import { logger } from '@/core/logger';

export type StripeMode = 'live' | 'test' | 'disabled';

export function getStripeMode(): StripeMode {
  const key = env.stripe.publishableKey;
  if (!key) return 'disabled';
  if (key.startsWith('pk_live_')) return 'live';
  if (key.startsWith('pk_test_')) return 'test';
  return 'test';
}

export function isStripeLive(): boolean {
  return getStripeMode() === 'live';
}

export function canProcessPayments(): { allowed: boolean; reason?: string; devHint?: string } {
  const mode = getStripeMode();
  if (mode === 'disabled') {
    return {
      allowed: false,
      reason: 'Payments are currently unavailable.',
      devHint: env.isDev ? 'Add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.' : undefined,
    };
  }
  if (mode === 'test' && env.isProd) {
    return {
      allowed: false,
      reason: 'Payments are currently unavailable.',
      devHint: env.isDev ? 'Stripe is in test mode but the app is running in production.' : undefined,
    };
  }
  if (mode === 'live' && env.isDev) {
    logger.warn('Stripe is in live mode in a development environment. Be careful!', 'StripeSafety');
  }
  return { allowed: true };
}

export function requireStripeLive(): void {
  if (env.isProd && !isStripeLive()) {
    logger.error(
      'Cannot process live payments: Stripe is not in live mode',
      'StripeSafety',
    );
  }
}
