import { wrapState, recoverState, persistState, isStateValid } from './recovery';
import type { z } from 'zod';

let _autoSaveTimer: ReturnType<typeof setInterval> | null = null;

export function scheduleAutoSave(
  key: string,
  getSnapshot: () => unknown,
  intervalMs: number = 30_000,
): void {
  stopAutoSave();
  let lastPayload = '';
  _autoSaveTimer = setInterval(() => {
    try {
      const snapshot = getSnapshot();
      const serialized = JSON.stringify(snapshot);
      if (serialized !== lastPayload) {
        lastPayload = serialized;
        persistState(key, snapshot);
        updateLastWriteTime();
      }
    } catch { /* silently ignore auto-save errors */ }
  }, intervalMs);
}

export function stopAutoSave(): void {
  if (_autoSaveTimer !== null) {
    clearInterval(_autoSaveTimer);
    _autoSaveTimer = null;
  }
}

export function persistSlice<T>(key: string, data: T, schema?: z.ZodSchema<T>): void {
  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      if (import.meta.env.DEV) console.warn(`[persistence] Validation failed for "${key}":`, result.error.issues);
      return;
    }
  }
  persistState(key, data);
}

export function rehydrateSlice<T>(key: string, fallback: T, schema?: z.ZodSchema<T>): T {
  const data = recoverState(key, fallback);
  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      if (import.meta.env.DEV) console.warn(`[persistence] Rehydrated data invalid for "${key}", using fallback`, result.error.issues);
      return fallback;
    }
  }
  return data;
}

export function createPersistenceMiddleware<T extends Record<string, unknown>>(
  key: string,
  schema?: z.ZodSchema<T>,
) {
  let lastSerialized = '';

  return (state: T) => {
    const serialized = JSON.stringify(state);
    if (serialized === lastSerialized) return;
    lastSerialized = serialized;

    if (schema) {
      const result = schema.safeParse(state);
      if (!result.success) {
        if (import.meta.env.DEV) console.warn(`[persistence] Middleware validation failed for "${key}", skipping write`);
        return;
      }
    }
    persistState(key, state);
    updateLastWriteTime();
  };
}

let _lastWriteTime = 0;

export function getLastPersistenceWriteTime(): number {
  return _lastWriteTime;
}

function updateLastWriteTime(): void {
  _lastWriteTime = Date.now();
}
