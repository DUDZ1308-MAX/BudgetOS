import { monitor } from '@/core/monitoring';
import { logger } from '@/core/logger';

interface PerformanceMark {
  name: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

const activeMarks = new Map<string, PerformanceMark>();

export function startMeasure(name: string, metadata?: Record<string, unknown>): void {
  activeMarks.set(name, { name, startTime: performance.now(), metadata });
}

export function endMeasure(name: string): number {
  const mark = activeMarks.get(name);
  if (!mark) {
    logger.warn(`No active measure found: ${name}`, 'Performance');
    return 0;
  }
  const duration = performance.now() - mark.startTime;
  monitor.metric(`perf_${name}`, duration, mark.metadata as Record<string, string> | undefined);
  activeMarks.delete(name);
  return duration;
}

export function measureDuration<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
  startMeasure(name, metadata);
  try {
    return fn();
  } finally {
    endMeasure(name);
  }
}

export async function measureDurationAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T> {
  startMeasure(name, metadata);
  try {
    return await fn();
  } finally {
    endMeasure(name);
  }
}

export function usePerformanceMark(name: string, deps: unknown[] = []): void {
  if (import.meta.env.DEV) {
    const { useEffect, useRef } = require('react');
    const prevDepsRef = useRef(deps);
    useEffect(() => {
      const prevDeps = prevDepsRef.current;
      const changed = deps.filter((d, i) => d !== prevDeps[i]);
      if (changed.length > 0) {
        startMeasure(name, { changed: changed.length });
        requestAnimationFrame(() => endMeasure(name));
      }
      prevDepsRef.current = deps;
    }, deps);
  }
}

export function trackPageLoad(pageName: string): () => void {
  const start = performance.now();
  logger.info(`Page load started: ${pageName}`, 'Performance');
  return () => {
    const duration = performance.now() - start;
    monitor.metric(`page_load_${pageName}`, duration);
    logger.info(`Page load complete: ${pageName}`, 'Performance', { duration: `${duration.toFixed(0)}ms` });
  };
}
