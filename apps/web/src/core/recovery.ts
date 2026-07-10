export const STATE_VERSION = 1;

export interface VersionedState<T = unknown> {
  stateVersion: number;
  data: T;
  savedAt: string;
}

export function wrapState<T>(data: T): VersionedState<T> {
  return { stateVersion: STATE_VERSION, data, savedAt: new Date().toISOString() };
}

export function isStateValid<T>(stored: unknown): stored is VersionedState<T> {
  if (!stored || typeof stored !== 'object') return false;
  const s = stored as Record<string, unknown>;
  return (
    typeof s.stateVersion === 'number' &&
    !Number.isNaN(s.stateVersion) &&
    s.stateVersion >= 1 &&
    s.stateVersion <= STATE_VERSION + 1 &&
    'data' in s
  );
}

export function recoverState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!isStateValid<T>(parsed)) return fallback;
    if (parsed.stateVersion < STATE_VERSION) {
      return migrateState(parsed, key, fallback);
    }
    return parsed.data;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function persistState<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(wrapState(data)));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      pruneStorage(key, data);
    }
  }
}

export function clearState(key: string): void {
  localStorage.removeItem(key);
}

function migrateState<T>(parsed: VersionedState, key: string, fallback: T): T {
  let data = parsed.data as Record<string, unknown>;
  for (let v = parsed.stateVersion; v < STATE_VERSION; v++) {
    const migrated = runMigration(v, data);
    if (!migrated) return fallback;
    data = migrated;
  }
  return data as unknown as T;
}

function runMigration(fromVersion: number, data: Record<string, unknown>): Record<string, unknown> | null {
  try {
    if (fromVersion === 0) {
      return { ...data, _migrated: true };
    }
    return data;
  } catch {
    return null;
  }
}

function pruneStorage<T>(key: string, data: T): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('budgetos-snapshot-')) keysToRemove.push(k);
  }
  keysToRemove.sort().slice(0, Math.max(0, keysToRemove.length - 3)).forEach((k) => localStorage.removeItem(k));
  try {
    localStorage.setItem(key, JSON.stringify(wrapState(data)));
  } catch {
    // Storage full, cannot recover
  }
}
