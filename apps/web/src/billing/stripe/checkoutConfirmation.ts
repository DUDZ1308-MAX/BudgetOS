export type CheckoutConfirmationStatus = 'active' | 'pending';

/**
 * A Checkout return only becomes "active" once the server-confirmed
 * tier is a paid tier. A pending/free tier means the webhook has not
 * landed yet and no access may be claimed.
 */
export function checkoutConfirmationForTier(
  tier: string | null | undefined,
): CheckoutConfirmationStatus {
  return tier && tier !== 'free' ? 'active' : 'pending';
}
