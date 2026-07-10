import { supabase } from '@/lib/supabase';
import { syncQueue } from './SyncQueue';
import { conflictResolver } from './ConflictResolver';
import { syncLogger } from './SyncLogger';
import { realtimeManager } from './RealtimeManager';
import { SyncScheduler } from './SyncScheduler';
import { schemaMigration } from './SchemaMigration';
import type { ConflictResolution } from './ConflictResolver';
import type { SyncLogEntry, SyncOutcome } from './SyncLogger';
import type { QueueEntry } from './SyncQueue';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'queued' | 'conflict' | 'failed' | 'synced';

export interface SyncStateSnapshot {
  status: SyncStatus;
  lastSyncTime: string | null;
  pendingCount: number;
  failedCount: number;
  isOnline: boolean;
  lastSyncLog: SyncLogEntry | null;
}

type StatusCallback = (status: SyncStatus, error?: string) => void;
type ProgressCallback = (current: number, total: number, entity?: string) => void;

const entityTableMap: Record<string, string> = {
  account: 'accounts',
  category: 'categories',
  transaction: 'transactions',
  budget: 'budgets',
  savings_goal: 'savings_goals',
  contribution: 'contributions',
  mortgage: 'mortgages',
  extra_payment: 'extra_payments',
};

const entityTableReverse: Record<string, string> = {};
for (const [key, val] of Object.entries(entityTableMap)) {
  entityTableReverse[val] = key;
}

export class SyncManager {
  private status: SyncStatus = 'idle';
  private lastSyncTime: string | null = null;
  private userId: string | null = null;
  private statusCallbacks: Set<StatusCallback> = new Set();
  private progressCallbacks: Set<ProgressCallback> = new Set();
  private scheduler: SyncScheduler;
  private syncing: boolean = false;

  constructor() {
    this.scheduler = new SyncScheduler(300000);
    this.scheduler.setSyncFn(async () => { await this.syncNow(); });
    this.status = navigator.onLine ? 'idle' : 'offline';

    window.addEventListener('online', () => {
      if (this.status === 'offline') {
        this.setStatus('idle');
        this.scheduler.triggerSync();
      }
    });

    window.addEventListener('offline', () => {
      this.setStatus('offline');
    });
  }

  initialize(userId: string): void {
    this.userId = userId;
    schemaMigration.ensureUpToDate().catch(() => {});
    realtimeManager.setUserId(userId);
    this.scheduler.start();
    this.scheduler.triggerSync();
  }

  setUserId(userId: string | null): void {
    this.userId = userId;
    realtimeManager.setUserId(userId);
    if (userId) {
      this.initialize(userId);
    } else {
      this.scheduler.stop();
      realtimeManager.unsubscribeAll();
    }
  }

  async syncNow(): Promise<SyncStateSnapshot> {
    if (this.syncing || !this.userId) return this.getSyncStatus();
    if (!navigator.onLine) {
      this.setStatus('offline');
      return this.getSyncStatus();
    }

    this.syncing = true;
    this.setStatus('syncing');
    const syncId = syncLogger.startSync();

    try {
      const uploaded = await this.uploadPendingChanges();
      const downloadResult = await this.downloadAndMerge();

      const totalFailures = uploaded.failures + downloadResult.failures;
      const outcome: SyncOutcome = totalFailures > 0 ? 'partial' : 'success';
      const hasConflicts = downloadResult.conflicts > 0;

      syncLogger.completeSync(syncId, outcome, {
        recordsUploaded: uploaded.count,
        recordsDownloaded: downloadResult.count,
        conflictsResolved: downloadResult.conflicts,
        failures: totalFailures,
      });

      this.lastSyncTime = new Date().toISOString();
      this.setStatus(hasConflicts ? 'conflict' : 'synced');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      syncLogger.completeSync(syncId, 'failed', { error: msg, failures: 1 });
      this.setStatus('failed', msg);
    } finally {
      this.syncing = false;
    }

    return this.getSyncStatus();
  }

  queueChange(
    entityType: string,
    operation: 'create' | 'update' | 'delete',
    entityId: string,
    payload: Record<string, unknown>,
  ): QueueEntry {
    const entry = syncQueue.add(entityType, operation, entityId, payload);
    if (navigator.onLine && this.userId) {
      this.syncNow().catch(() => {});
    } else {
      this.setStatus('queued');
    }
    return entry;
  }

  cancelPending(entityType?: string, entityId?: string): number {
    return syncQueue.cancelPending(entityType, entityId);
  }

  retryFailed(): number {
    return syncQueue.retryFailed();
  }

  async retryFailedSyncs(): Promise<number> {
    const count = syncQueue.retryFailed();
    if (count > 0) await this.syncNow();
    return count;
  }

  getSyncStatus(): SyncStateSnapshot {
    return {
      status: this.status,
      lastSyncTime: this.lastSyncTime,
      pendingCount: syncQueue.getPendingCount(),
      failedCount: syncQueue.getFailed().length,
      isOnline: navigator.onLine,
      lastSyncLog: syncLogger.getLastSync(),
    };
  }

  onStatusChange(cb: StatusCallback): () => void {
    this.statusCallbacks.add(cb);
    return () => this.statusCallbacks.delete(cb);
  }

  onProgress(cb: ProgressCallback): () => void {
    this.progressCallbacks.add(cb);
    return () => this.progressCallbacks.delete(cb);
  }

  getLogger(): typeof syncLogger {
    return syncLogger;
  }

  getQueue(): typeof syncQueue {
    return syncQueue;
  }

  getConflictResolver(): typeof conflictResolver {
    return conflictResolver;
  }

  getRealtimeManager(): typeof realtimeManager {
    return realtimeManager;
  }

  getScheduler(): SyncScheduler {
    return this.scheduler;
  }

  destroy(): void {
    this.scheduler.destroy();
    realtimeManager.destroy();
    this.statusCallbacks.clear();
    this.progressCallbacks.clear();
    this.userId = null;
    this.syncing = false;
  }

  private setStatus(status: SyncStatus, error?: string): void {
    this.status = status;
    for (const cb of this.statusCallbacks) {
      cb(status, error);
    }
  }

  private async uploadPendingChanges(): Promise<{ count: number; failures: number }> {
    const pending = syncQueue.getPending();
    if (pending.length === 0) return { count: 0, failures: 0 };

    let count = 0;
    let failures = 0;

    for (let i = 0; i < pending.length; i++) {
      const entry = pending[i]!;
      this.notifyProgress(i + 1, pending.length, entry.entityType);

      syncQueue.markProcessing(entry.id);

      try {
        const result = await this.executeUpload(entry);
        if (result.ok) {
          syncQueue.markCompleted(entry.id);
          count++;
        } else {
          syncQueue.markFailed(entry.id, result.error ?? 'Unknown error');
          failures++;
        }
      } catch (err) {
        syncQueue.markFailed(entry.id, err instanceof Error ? err.message : 'Upload failed');
        failures++;
      }
    }

    return { count, failures };
  }

  private async executeUpload(entry: QueueEntry): Promise<{ ok: boolean; error?: string }> {
    const table = entityTableMap[entry.entityType];
    if (!table) return { ok: false, error: `Unknown entity: ${entry.entityType}` };

    try {
      if (entry.operation === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', entry.entityId);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      }

      if (entry.operation === 'update') {
        const { error } = await supabase
          .from(table)
          .update(entry.payload)
          .eq('id', entry.entityId);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      }

      const { error } = await supabase
        .from(table)
        .insert(entry.payload)
        .select('id')
        .single();
      if (error) {
        if (error.code === '23505') return { ok: true };
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Upload failed' };
    }
  }

  private async downloadAndMerge(): Promise<{ count: number; conflicts: number; failures: number }> {
    if (!this.userId) return { count: 0, conflicts: 0, failures: 0 };

    let count = 0;
    let failures = 0;
    conflictResolver.clearConflicts();

    const tables = Object.entries(entityTableMap);

    for (let i = 0; i < tables.length; i++) {
      const pair = tables[i]!;
      const entityType = pair[0];
      const table = pair[1];
      this.notifyProgress(i + 1, tables.length, entityType);

      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', this.userId)
          .order('updated_at', { ascending: false });

        if (error) {
          failures++;
          if (import.meta.env.DEV) console.error(`[Sync] Failed to download ${entityType}:`, error.message);
          continue;
        }

        if (data && data.length > 0) {
          const localData = this.getLocalData(entityType);
          conflictResolver.mergeArrays(localData, data as Record<string, unknown>[], entityType);
          count += data.length;
        }
      } catch (err) {
        failures++;
        if (import.meta.env.DEV) console.error(`[Sync] Error downloading ${entityType}:`, err);
      }
    }

    const conflictCount = conflictResolver.getConflicts().length;
    return { count, conflicts: conflictCount, failures };
  }

  private getLocalData(entityType: string): Record<string, unknown>[] {
    try {
      const key = `budgetos-local-${entityType}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private notifyProgress(current: number, total: number, entity?: string): void {
    for (const cb of this.progressCallbacks) {
      cb(current, total, entity);
    }
  }
}

export const syncManager = new SyncManager();
