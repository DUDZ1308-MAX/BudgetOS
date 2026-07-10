/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_STRIPE_PRICE_PRO_MONTH: string;
  readonly VITE_STRIPE_PRICE_PRO_YEAR: string;
  readonly VITE_STRIPE_PRICE_PREMIUM_MONTH: string;
  readonly VITE_STRIPE_PRICE_PREMIUM_YEAR: string;
  readonly VITE_STRIPE_CHECKOUT_URL: string;
  readonly VITE_STRIPE_PORTAL_URL: string;
  readonly VITE_STRIPE_WEBHOOK_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
