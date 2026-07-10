import { logger } from '@/core/logger';

export function setupApiErrorInterceptor() {
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return originalFetch.call(window, input, init).catch((error: Error) => {
      logger.error('API request failed', 'ApiInterceptor', error, {
        url: typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url,
        method: init?.method ?? 'GET',
      });
      throw error;
    });
  };
}
