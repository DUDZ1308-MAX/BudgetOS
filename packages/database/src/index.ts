export * from './types';
export * from './schemas';
export * from './repository';
// Note: The Supabase client singleton lives in apps/web/src/lib/supabase.ts.
// The database package should not create its own client to avoid
// "Multiple GoTrueClient instances" warnings.
