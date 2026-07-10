import { describe, it, expect, beforeEach } from 'vitest';
import { SyncManager } from '../SyncManager';
import { syncQueue } from '../SyncQueue';

describe('SyncManager', () => {
  let manager: SyncManager;

  beforeEach(() => {
    localStorage.clear();
    syncQueue.clear();
    manager = new SyncManager();
  });

  it('starts in idle or offline state', () => {
    const status = manager.getSyncStatus();
    expect(['idle', 'offline']).toContain(status.status);
    expect(status.pendingCount).toBe(0);
    expect(status.failedCount).toBe(0);
  });

  it('returns sync status with queue stats', () => {
    manager.queueChange('transaction', 'create', 'txn-1', { amount: 100 });
    const status = manager.getSyncStatus();
    expect(status.pendingCount).toBeGreaterThanOrEqual(1);
  });

  it('cancels pending changes', () => {
    manager.queueChange('account', 'create', 'acct-1', { name: 'A' });
    manager.queueChange('account', 'create', 'acct-2', { name: 'B' });
    expect(manager.getSyncStatus().pendingCount).toBe(2);

    const cancelled = manager.cancelPending();
    expect(cancelled).toBe(2);
    expect(manager.getSyncStatus().pendingCount).toBe(0);
  });

  it('retries failed entries', () => {
    // Add an entry, then force it to failed status
    syncQueue.add('budget', 'update', 'budget-1', { amount: 100 });
    const entry = syncQueue.getPending()[0]!;
    for (let i = 0; i < 5; i++) {
      syncQueue.markFailed(entry.id, `err ${i}`);
    }
    expect(syncQueue.getFailed().length).toBe(1);

    const retried = manager.retryFailed();
    expect(retried).toBe(1);
    expect(syncQueue.getPending().length).toBeGreaterThan(0);
  });

  it('allows subscribing to status changes', () => {
    const cb = (status: string) => {};
    const unsub = manager.onStatusChange(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('exposes sub-components', () => {
    expect(manager.getLogger()).toBeTruthy();
    expect(manager.getQueue()).toBeTruthy();
    expect(manager.getConflictResolver()).toBeTruthy();
    expect(manager.getRealtimeManager()).toBeTruthy();
    expect(manager.getScheduler()).toBeTruthy();
  });

  it('destroy cleans up', () => {
    manager.destroy();
    const status = manager.getSyncStatus();
    expect(status.isOnline).toBe(true); // navigator.onLine is true in jsdom
  });
});
