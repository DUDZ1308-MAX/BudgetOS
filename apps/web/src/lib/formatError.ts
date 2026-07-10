import type { PostgrestError } from '@supabase/supabase-js';

export interface FormattedError {
  message: string;
  detail: string;
}

export function formatError(err: unknown): FormattedError {
  if (isPostgrestError(err)) {
    return {
      message: err.code ? `[${err.code}] ${err.message}` : err.message,
      detail: err.details || err.hint || '',
    };
  }
  if (err instanceof Error) {
    return { message: err.message, detail: err.stack ?? '' };
  }
  return { message: String(err), detail: '' };
}

function isPostgrestError(err: unknown): err is PostgrestError {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as Record<string, unknown>;
  return typeof e.message === 'string' && typeof e.code === 'string' && typeof e.details === 'string';
}
