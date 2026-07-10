import { logger } from '@/core/logger';
import { monitor } from '@/core/monitoring';
import { useToastStore } from '@/stores/toast';

export interface SafeError {
  message: string;
  code: string;
  recoverable: boolean;
  original?: unknown;
}

export function captureError(error: unknown, context?: string): SafeError {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const safe: SafeError = {
    message: context ? `${context}: ${message}` : message,
    code: error instanceof TypeError ? 'TYPE_ERROR' : 'UNKNOWN',
    recoverable: true,
    original: error,
  };
  logger.error(safe.message, context ?? 'CaptureError', error);
  return safe;
}

export function notifyError(error: SafeError): void {
  if (!error.recoverable) {
    useToastStore.getState().addToast('error', `Critical: ${error.message}`, 8000);
  }
}

export function safeTry<T>(fn: () => T, fallback: T, context?: string): T {
  try {
    return fn();
  } catch (err) {
    captureError(err, context);
    return fallback;
  }
}

export async function safeTryAsync<T>(fn: () => Promise<T>, fallback: T, context?: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    captureError(err, context);
    return fallback;
  }
}

export function withErrorLogging<T extends (...args: any[]) => any>(fn: T, context: string): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (err) {
      captureError(err, context);
      throw err;
    }
  }) as T;
}
