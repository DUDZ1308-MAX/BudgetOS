import { logger } from '@/core/logger';
import { monitor } from '@/core/monitoring';

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  tags: Record<string, string>;
  metadata?: Record<string, unknown>;
}

let errorCounter = 0;

function generateErrorId(): string {
  return `err_${Date.now().toString(36)}_${(++errorCounter).toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function reportError(
  error: unknown,
  context: string,
  severity: ErrorReport['severity'] = 'medium',
  tags?: Record<string, string>,
): ErrorReport {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const stack = error instanceof Error ? error.stack : undefined;

  const report: ErrorReport = {
    id: generateErrorId(),
    message,
    stack,
    context,
    severity,
    timestamp: new Date().toISOString(),
    tags: {
      environment: import.meta.env.MODE ?? 'development',
      ...tags,
    },
  };

  logger.error(message, context, error, { severity, errorId: report.id });
  monitor.error(error instanceof Error ? error : new Error(message), context, tags);

  return report;
}

export async function reportErrorAsync(
  error: unknown,
  context: string,
  severity: ErrorReport['severity'] = 'medium',
  tags?: Record<string, string>,
): Promise<ErrorReport> {
  return reportError(error, context, severity, tags);
}

export function createErrorReporter(context: string) {
  return {
    report: (error: unknown, severity?: ErrorReport['severity'], tags?: Record<string, string>) =>
      reportError(error, context, severity, tags),
    capture: <T>(fn: () => T, fallback: T, tags?: Record<string, string>): T => {
      try {
        return fn();
      } catch (err) {
        reportError(err, context, 'low', tags);
        return fallback;
      }
    },
    captureAsync: async <T>(fn: () => Promise<T>, fallback: T, tags?: Record<string, string>): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        reportError(err, context, 'low', tags);
        return fallback;
      }
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      logger.warn(message, context, data);
    },
    info: (message: string, data?: Record<string, unknown>) => {
      logger.info(message, context, data);
    },
    getContext: () => context,
  };
}
