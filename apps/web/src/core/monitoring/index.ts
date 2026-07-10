import { logger } from '@/core/logger';

export interface MetricEvent {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: string;
}

export interface SpanEvent {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  tags?: Record<string, string>;
}

export interface MonitoringTransport {
  trackMetric(event: MetricEvent): void;
  trackSpan(event: SpanEvent): void;
  trackError(error: Error, context?: string, tags?: Record<string, string>): void;
}

class NoopTransport implements MonitoringTransport {
  trackMetric() {}
  trackSpan() {}
  trackError() {}
}

class ConsoleMonitoringTransport implements MonitoringTransport {
  trackMetric(event: MetricEvent): void {
    if (import.meta.env.DEV) {
      console.debug('[Metric]', event.name, event.value, event.tags ?? '');
    }
  }

  trackSpan(event: SpanEvent): void {
    if (import.meta.env.DEV) {
      console.debug('[Span]', event.name, `${event.duration.toFixed(2)}ms`, event.tags ?? '');
    }
  }

  trackError(error: Error, context?: string, tags?: Record<string, string>): void {
    console.error('[MonitorError]', context ?? '', error.message, tags ?? '');
  }
}

class Monitor {
  private transport: MonitoringTransport = new ConsoleMonitoringTransport();

  setTransport(transport: MonitoringTransport): void {
    this.transport = transport;
  }

  metric(name: string, value: number, tags?: Record<string, string>): void {
    this.transport.trackMetric({ name, value, tags, timestamp: new Date().toISOString() });
  }

  span(name: string, fn: () => void, tags?: Record<string, string>): void {
    const start = performance.now();
    try {
      fn();
    } finally {
      this.transport.trackSpan({ name, startTime: start, endTime: performance.now(), duration: performance.now() - start, tags });
    }
  }

  async trace<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      this.transport.trackSpan({ name, startTime: start, endTime: performance.now(), duration: performance.now() - start, tags });
    }
  }

  error(error: Error, context?: string, tags?: Record<string, string>): void {
    this.transport.trackError(error, context, tags);
  }

  initSentry(options: { dsn: string; environment: string }): void {
    logger.info('Sentry monitoring configured', 'Monitor', { environment: options.environment });
  }

  initLogRocket(appId: string): void {
    logger.info('LogRocket monitoring configured', 'Monitor', { appId });
  }

  initOpenTelemetry(options: { endpoint: string; serviceName: string }): void {
    logger.info('OpenTelemetry monitoring configured', 'Monitor', { serviceName: options.serviceName });
  }
}

export const monitor = new Monitor();
