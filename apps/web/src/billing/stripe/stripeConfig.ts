export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '',
} as const;

export function hasStripeConfig(): boolean {
  return !!STRIPE_CONFIG.publishableKey;
}
