import type { SyncEntry, SyncEntity, SyncAction } from './types';

const QUEUE_KEY = 'budgetos-sync-queue';
const MAX_RETRIES = 5;

export function getQueue(): SyncEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToQueue(
  entity: SyncEntity,
  action: SyncAction,
  entityId: string,
  payload: Record<string, unknown>,
): void {
  const queue = getQueue();
  const existingIdx = queue.findIndex(
    (e) => e.entity === entity && e.entityId === entityId,
  );

  if (existingIdx >= 0) {
    const existing = queue[existingIdx]!;
    if (action === 'delete') {
      queue.splice(existingIdx, 1);
    } else {
      queue[existingIdx] = {
        ...existing,
        action,
        payload,
        timestamp: new Date().toISOString(),
      };
    }
  } else if (action !== 'delete') {
    queue.push({
      id: `${entity}-${entityId}-${Date.now()}`,
      entity,
      action,
      entityId,
      payload,
      timestamp: new Date().toISOString(),
      retries: 0,
    });
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter((e) => e.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function incrementRetry(id: string): void {
  const queue = getQueue();
  const entry = queue.find((e) => e.id === id);
  if (entry) {
    entry.retries += 1;
    if (entry.retries >= MAX_RETRIES) {
      const filtered = queue.filter((e) => e.id !== id);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } else {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  }
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

export function getQueueSize(): number {
  return getQueue().length;
}
