import type { ReactNode } from 'react';
import { logger } from '@/core/logger';
import { useToastStore } from '@/stores/toast';

export type ApiErrorType = 'network' | 'auth' | 'server' | 'not_found' | 'validation' | 'timeout' | 'unknown';

export interface ApiError {
  type: ApiErrorType;
  message: string;
  code?: string;
  status?: number;
  retryable: boolean;
}

export function classifyApiError(error: unknown): ApiError {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return { type: 'network', message: 'Network connection lost. Check your internet connection.', retryable: true };
  }
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    if (status === 401) return { type: 'auth', message: 'Session expired. Please sign in again.', retryable: false };
    if (status === 404) return { type: 'not_found', message: 'The requested resource was not found.', retryable: false };
    if (status === 422) return { type: 'validation', message: 'Invalid data provided.', retryable: false };
    if (status >= 500) return { type: 'server', message: 'Server error. Please try again later.', retryable: true };
  }
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (code === 'PGRST116') return { type: 'not_found', message: 'No matching record found.', retryable: false };
    if (code === '23505') return { type: 'validation', message: 'A record with this value already exists.', retryable: false };
    if (code === '42P01') return { type: 'server', message: 'Database configuration error. Please contact support.', retryable: false };
    if (code === '42703') return { type: 'server', message: 'Missing database column. Please refresh and try again.', retryable: true };
    if (code === '23503') return { type: 'validation', message: 'Referenced record not found. Please check your data.', retryable: false };
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === 'string' && msg.includes('column') && msg.includes('does not exist')) {
      return { type: 'server', message: 'Database schema mismatch. Please refresh the page.', retryable: true };
    }
  }
  return { type: 'unknown', message: 'An unexpected error occurred. Please try again.', retryable: true };
}

interface ApiErrorDisplayProps {
  error: ApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ApiErrorDisplay({ error, onRetry, onDismiss }: ApiErrorDisplayProps) {
  const iconMap: Record<ApiErrorType, string> = {
    network: '🔌',
    auth: '🔒',
    server: '🔧',
    not_found: '🔍',
    validation: '⚠️',
    timeout: '⏰',
    unknown: '❌',
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950" role="alert">
      <div className="flex items-start gap-3">
        <span className="text-lg" aria-hidden="true">{iconMap[error.type]}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{error.message}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {error.retryable && onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="rounded-lg p-1.5 text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Dismiss error"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function handleApiError(error: unknown, context: string): ApiError {
  const apiError = classifyApiError(error);
  logger.error(apiError.message, context, error, { type: apiError.type, retryable: String(apiError.retryable) });
  if (!apiError.retryable) {
    useToastStore.getState().addToast('error', apiError.message, 6000);
  }
  return apiError;
}
