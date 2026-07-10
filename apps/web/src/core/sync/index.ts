import { useEffect, useCallback } from 'react';
import { useSyncStore } from '@/stores/sync';
import { useAuthStore } from '@/stores/auth';
import { runFullSync, checkConnection, uploadLocalChanges } from './engine';
import { getQueueSize } from './queue';
import { emitEvent } from '@/core/events';
import type { EventType } from '@/core/events';

const entityEventMap: Record<string, string> = {
  transaction: 'transaction',
  account: 'account',
  budget: 'budget',
  category: 'category',
  savings_goal: 'savings',
  contribution: 'savings',
  mortgage: 'mortgage',
  extra_payment: 'mortgage',
};

export function emitEntityEvent(
  entityType: string,
  entityId: string,
  action: 'created' | 'updated' | 'deleted' | 'archived',
  before?: unknown,
  after?: unknown,
  userId?: string | null,
): void {
  const prefix = entityEventMap[entityType];
  if (!prefix) return;
  const eventType = `${prefix}:${action}` as EventType;
  emitEvent(eventType, { entityId, entityType, before, after, userId });
}

export type { SyncStatus, SyncEntry, SyncEntity, SyncAction, ConflictLog } from './types';
export { getQueue, addToQueue, removeFromQueue, getQueueSize, clearQueue } from './queue';
export { getLastSyncTime, getConflictLog, runFullSync, checkConnection, uploadLocalChanges } from './engine';

export function useSync() {
  const { status, setStatus, setLastSyncTime, setPendingCount, setError } = useSyncStore();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const sync = useCallback(async (localData?: Record<string, unknown[]>) => {
    if (!userId) return;
    setStatus('syncing');
    try {
      const online = await checkConnection();
      if (!online) {
        setStatus('offline');
        setPendingCount(getQueueSize());
        return;
      }
      await runFullSync(userId, localData ?? {}, (s, err) => {
        setStatus(s);
        if (err) setError(err);
      });
      setPendingCount(getQueueSize());
      setLastSyncTime(new Date().toISOString());
      setStatus('online');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  }, [userId, setStatus, setLastSyncTime, setPendingCount, setError]);

  const uploadLocal = useCallback(async () => {
    setStatus('syncing');
    try {
      await uploadLocalChanges((s, err) => {
        setStatus(s);
        if (err) setError(err);
      });
      setPendingCount(getQueueSize());
      setStatus(getQueueSize() > 0 ? 'offline' : 'online');
    } catch {
      setStatus('error');
    }
  }, [setStatus, setPendingCount, setError]);

  useEffect(() => {
    setPendingCount(getQueueSize());
  }, [setPendingCount]);

  return { status, sync, uploadLocal };
}
