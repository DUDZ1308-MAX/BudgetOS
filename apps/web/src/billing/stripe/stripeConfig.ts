export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '',

  priceIds: {
    pro: {
      month: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTH ?? 'price_pro_month',
      year: import.meta.env.VITE_STRIPE_PRICE_PRO_YEAR ?? 'price_pro_year',
    },
    premium: {
      month: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_MONTH ?? 'price_premium_month',
      year: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_YEAR ?? 'price_premium_year',
    },
  },

  getCheckoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_URL ?? '/api/stripe/create-checkout-session',
  getPortalUrl: import.meta.env.VITE_STRIPE_PORTAL_URL ?? '/api/stripe/customer-portal',
  webhookEndpoint: import.meta.env.VITE_STRIPE_WEBHOOK_ENDPOINT ?? '/api/stripe/webhook',

  successUrl: `${window.location.origin}/billing?checkout=success`,
  cancelUrl: `${window.location.origin}/billing?checkout=canceled`,
} as const;

export function hasStripeConfig(): boolean {
  return !!STRIPE_CONFIG.publishableKey;
}
