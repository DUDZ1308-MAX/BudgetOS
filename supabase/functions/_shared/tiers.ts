export type SubscriptionTier = "free" | "pro" | "premium";
export type BillingInterval = "month" | "year";

export const VALID_TIERS: SubscriptionTier[] = ["pro", "premium"];
export const VALID_INTERVALS: BillingInterval[] = ["month", "year"];

export function getPriceIdForTier(
  tier: SubscriptionTier,
  interval: BillingInterval,
): string | null {
  const suffix = interval === "year" ? "YEAR" : "MONTH";
  return Deno.env.get(`STRIPE_PRICE_${tier.toUpperCase()}_${suffix}`) ?? null;
}

// Maps the server-configured Stripe Price IDs back to plan/interval.
// Only configured (non-empty) env values are registered, so an
// unconfigured price can never be resolved to a paid tier.
const PRICE_ID_TO_PLAN: Record<string, { tier: SubscriptionTier; interval: BillingInterval }> = {};

(() => {
  const configs: Array<[string, SubscriptionTier, BillingInterval]> = [
    ["STRIPE_PRICE_PRO_MONTH", "pro", "month"],
    ["STRIPE_PRICE_PRO_YEAR", "pro", "year"],
    ["STRIPE_PRICE_PREMIUM_MONTH", "premium", "month"],
    ["STRIPE_PRICE_PREMIUM_YEAR", "premium", "year"],
  ];
  for (const [key, tier, interval] of configs) {
    const value = Deno.env.get(key);
    if (value) PRICE_ID_TO_PLAN[value] = { tier, interval };
  }
})();

export function resolveTierFromPriceId(
  priceId: string,
): { tier: SubscriptionTier; interval: BillingInterval } | null {
  return PRICE_ID_TO_PLAN[priceId] ?? null;
}

export function isUuid(value: string | undefined | null): boolean {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
