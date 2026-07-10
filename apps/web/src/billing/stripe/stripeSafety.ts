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

export function isStripeTest(): boolean {
  return getStripeMode() === 'test';
}

export function isStripeDisabled(): boolean {
  return getStripeMode() === 'disabled';
}

export function assertStripeMode(expected: StripeMode): void {
  const actual = getStripeMode();
  if (actual !== expected) {
    logger.warn(
      `Stripe mode mismatch: expected ${expected}, actual ${actual}`,
      'StripeSafety',
    );
  }
}

export function canProcessPayments(): { allowed: boolean; reason?: string } {
  const mode = getStripeMode();
  if (mode === 'disabled') {
    return { allowed: false, reason: 'Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.' };
  }
  if (mode === 'test' && env.isProd) {
    return { allowed: false, reason: 'Stripe is in test mode but the app is running in production. Set a live publishable key.' };
  }
  if (mode === 'live' && env.isDev) {
    logger.warn('Stripe is in live mode in a development environment. Be careful!', 'StripeSafety');
  }
  return { allowed: true };
}

export function getCheckoutEnvironment(): { mode: StripeMode; label: string } {
  const mode = getStripeMode();
  const labels: Record<StripeMode, string> = {
    live: 'Production (Live)',
    test: 'Test Mode',
    disabled: 'Disabled',
  };
  return { mode, label: labels[mode] };
}

export function requireStripeLive(): void {
  if (env.isProd && !isStripeLive()) {
    logger.error(
      'Cannot process live payments: Stripe is not in live mode',
      'StripeSafety',
    );
  }
}
