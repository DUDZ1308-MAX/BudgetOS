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
  if (err !== null && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const msg = typeof obj.message === 'string' ? obj.message
      : typeof obj.error === 'string' ? obj.error
      : typeof obj.details === 'string' ? obj.details
      : typeof obj.hint === 'string' ? obj.hint
      : JSON.stringify(err);
    const detail = typeof obj.details === 'string' ? obj.details
      : typeof obj.hint === 'string' ? obj.hint
      : '';
    return { message: msg, detail };
  }
  return { message: String(err ?? 'An unknown error occurred'), detail: '' };
}

function isPostgrestError(err: unknown): err is PostgrestError {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as Record<string, unknown>;
  return typeof e.message === 'string' && typeof e.code === 'string' && typeof e.details === 'string';
}
