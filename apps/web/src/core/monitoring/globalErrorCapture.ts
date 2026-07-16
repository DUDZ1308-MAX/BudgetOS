import { reportError } from './errorReporter';
import { logger } from '@/core/logger';

let initialized = false;

interface GlobalErrorConfig {
  enabled: boolean;
  captureUnhandledRejections: boolean;
  captureConsoleErrors: boolean;
}

const config: GlobalErrorConfig = {
  enabled: import.meta.env.PROD || import.meta.env.VITE_CAPTURE_ERRORS === 'true',
  captureUnhandledRejections: true,
  captureConsoleErrors: false,
};

function handleErrorEvent(event: ErrorEvent) {
  event.preventDefault();
  const { message, filename, lineno, colno, error } = event;

  reportError(
    error ?? new Error(message),
    'GlobalError',
    'high',
    {
      source: filename ?? 'unknown',
      line: String(lineno ?? 0),
      column: String(colno ?? 0),
      type: 'unhandled_error',
    },
  );
}

function handleUnhandledRejection(event: PromiseRejectionEvent) {
  event.preventDefault();
  const reason = event.reason;

  reportError(
    reason instanceof Error ? reason : new Error(String(reason)),
    'UnhandledRejection',
    'high',
    {
      type: 'unhandled_rejection',
    },
  );
}

export function initGlobalErrorCapture(): void {
  if (initialized || !config.enabled) return;

  window.addEventListener('error', handleErrorEvent);

  if (config.captureUnhandledRejections) {
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  }

  initialized = true;
  logger.info('Global error capture initialized', 'ErrorMonitor', {
    environment: import.meta.env.MODE,
    captureUnhandledRejections: String(config.captureUnhandledRejections),
  });
}

export function disableGlobalErrorCapture(): void {
  if (!initialized) return;

  window.removeEventListener('error', handleErrorEvent);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);

  initialized = false;
  logger.info('Global error capture disabled', 'ErrorMonitor');
}

export function getErrorConfig(): Readonly<GlobalErrorConfig> {
  return { ...config };
}
