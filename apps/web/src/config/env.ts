export interface EnvValidation {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '',
    prices: {
      proMonth: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTH ?? '',
      proYear: import.meta.env.VITE_STRIPE_PRICE_PRO_YEAR ?? '',
      premiumMonth: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_MONTH ?? '',
      premiumYear: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_YEAR ?? '',
    },
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_URL ?? '/api/stripe/create-checkout',
    portalUrl: import.meta.env.VITE_STRIPE_PORTAL_URL ?? '/api/stripe/customer-portal',
    webhookEndpoint: import.meta.env.VITE_STRIPE_WEBHOOK_ENDPOINT ?? '/api/stripe/webhook',
  },
  app: {
    name: 'BudgetOS',
    version: '1.0.0',
    url: import.meta.env.VITE_APP_URL ?? 'http://localhost:5173',
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

const REQUIRED_VARS: { key: string; value: string; label: string }[] = [
  { key: 'VITE_SUPABASE_URL', value: env.supabase.url, label: 'Supabase URL' },
  { key: 'VITE_SUPABASE_ANON_KEY', value: env.supabase.anonKey, label: 'Supabase Anon Key' },
];

export function validateEnv(): EnvValidation {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of REQUIRED_VARS) {
    if (!v.value) {
      missing.push(v.key);
    }
  }

  if (env.stripe.publishableKey && env.isProd && env.stripe.publishableKey.startsWith('pk_test_')) {
    warnings.push('Stripe is in test mode in production. Set a live publishable key (pk_live_).');
  }

  if (env.app.url === 'http://localhost:5173' && env.isProd) {
    warnings.push('APP_URL is still set to localhost. Set VITE_APP_URL to your production domain.');
  }

  if (missing.length > 0) {
    console.warn('[Env] Missing required environment variables:', missing.join(', '));
  }
  if (warnings.length > 0) {
    warnings.forEach((w) => console.warn('[Env] Warning:', w));
  }

  return { valid: missing.length === 0, missing, warnings };
}

export function isSupabaseConfigured(): boolean {
  return !!env.supabase.url && !!env.supabase.anonKey;
}

export function isStripeConfigured(): boolean {
  return !!env.stripe.publishableKey;
}
