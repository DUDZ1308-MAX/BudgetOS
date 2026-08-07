// Pure decision helpers for the Stripe billing functions.
// Kept free of Deno/Stripe imports so the web test suite can unit test
// them directly.

/** Statuses that represent an existing, billable Stripe subscription. */
export const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "incomplete",
]);

export interface SubscriptionSummary {
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string | null;
}

/**
 * True when the user already holds a Stripe subscription that must not
 * be duplicated by a new Checkout session (one user -> one active
 * subscription). Canceled / unpaid / incomplete_expired rows fall
 * through so the user can start a fresh subscription.
 */
export function hasActiveSubscription(
  row: SubscriptionSummary | null | undefined,
): boolean {
  if (!row || !row.stripe_subscription_id) return false;
  return ACTIVE_SUBSCRIPTION_STATUSES.has(row.status ?? "");
}
