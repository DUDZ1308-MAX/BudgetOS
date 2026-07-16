// Re-export the singleton Supabase client from the web app.
// The database package should NOT create its own client — that causes
// "Multiple GoTrueClient instances" warnings in the browser.
//
// If this package is used outside the web app, create a thin wrapper
// that accepts a client instance instead of creating one here.

// Lazy re-export: the actual client lives in apps/web/src/lib/supabase.ts
// For type-only usage (which is the primary use case), no client is needed.
export type { SupabaseClient } from '@supabase/supabase-js';
