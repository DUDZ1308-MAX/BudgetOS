import { describe, it, expect } from 'vitest';
import { checkoutConfirmationForTier } from '../stripe/checkoutConfirmation';

describe('checkout confirmation (server-confirmed entitlement)', () => {
  it('never claims active for a free tier', () => {
    expect(checkoutConfirmationForTier('free')).toBe('pending');
    expect(checkoutConfirmationForTier(null)).toBe('pending');
    expect(checkoutConfirmationForTier(undefined)).toBe('pending');
    expect(checkoutConfirmationForTier('')).toBe('pending');
  });

  it('only claims active once a paid tier is confirmed', () => {
    expect(checkoutConfirmationForTier('pro')).toBe('active');
    expect(checkoutConfirmationForTier('premium')).toBe('active');
  });
});
