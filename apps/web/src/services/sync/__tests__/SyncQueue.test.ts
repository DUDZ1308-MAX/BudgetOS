import { describe, it, expect, beforeEach } from 'vitest';
import { SyncQueue } from '../SyncQueue';

describe('SyncQueue', () => {
  let queue: SyncQueue;

  beforeEach(() => {
    localStorage.clear();
    queue = new SyncQueue();
  });

  it('starts empty', () => {
    expect(queue.getSize()).toBe(0);
    expect(queue.getPending()).toEqual([]);
    expect(queue.getFailed()).toEqual([]);
  });

  it('adds entries', () => {
    queue.add('transaction', 'create', 'txn-1', { amount: 100 });
    expect(queue.getSize()).toBe(1);
    expect(queue.getPendingCount()).toBe(1);
  });

  it('replaces existing entry for same entity+id on update', () => {
    queue.add('transaction', 'create', 'txn-1', { amount: 100 });
    queue.add('transaction', 'update', 'txn-1', { amount: 200 });
    expect(queue.getSize()).toBe(1);
    expect(queue.getPending()[0]!.payload.amount).toBe(200);
  });

  it('removes entry when delete follows prior action', () => {
    queue.add('transaction', 'create', 'txn-1', { amount: 100 });
    queue.add('transaction', 'delete', 'txn-1', {});
    expect(queue.getSize()).toBe(0);
  });

  it('does not add standalone delete', () => {
    queue.add('transaction', 'delete', 'txn-1', {});
    expect(queue.getSize()).toBe(0);
  });

  it('supports lifecycle: pending -> processing -> completed', () => {
    queue.add('account', 'create', 'acct-1', { name: 'Test' });
    const entry = queue.getPending()[0]!;
    expect(entry.status).toBe('pending');

    queue.markProcessing(entry.id);
    expect(queue.getPending().length).toBe(0);

    queue.markCompleted(entry.id);
    expect(queue.getSize()).toBe(0);
  });

  it('marks failed and tracks retries', () => {
    queue.add('budget', 'create', 'budget-1', { amount: 500 });
    const entry = queue.getPending()[0]!;

    queue.markFailed(entry.id, 'Network error');
    expect(queue.getFailed().length).toBe(0); // retries=1, not yet max
    expect(queue.getPending().length).toBe(1); // reverted to pending
    expect(queue.getPending()[0]!.retryCount).toBe(1);
    expect(queue.getPending()[0]!.error).toBe('Network error');
  });

  it('permanently fails after max retries', () => {
    queue.add('category', 'create', 'cat-1', { name: 'Test' });
    const entry = queue.getPending()[0]!;

    for (let i = 0; i < 5; i++) {
      queue.markFailed(entry.id, `Attempt ${i + 1}`);
    }

    const all = queue.getAll();
    expect(all.length).toBe(1);
    expect(all[0]!.status).toBe('failed');
    expect(all[0]!.retryCount).toBe(5);
    const failed = queue.getFailed();
    expect(failed.length).toBe(1);
  });

  it('cancels pending entries', () => {
    queue.add('transaction', 'create', 'txn-1', { amount: 100 });
    queue.add('account', 'create', 'acct-1', { name: 'A' });
    expect(queue.getSize()).toBe(2);

    const cancelled = queue.cancelPending();
    expect(cancelled).toBe(2);
    expect(queue.getSize()).toBe(0);
  });

  it('cancels pending by entity type', () => {
    queue.add('transaction', 'create', 'txn-1', { amount: 100 });
    queue.add('account', 'create', 'acct-1', { name: 'A' });
    expect(queue.getSize()).toBe(2);

    const cancelled = queue.cancelPending('transaction');
    expect(cancelled).toBe(1);
    expect(queue.getSize()).toBe(1);
  });

  it('cancels pending by entity type and id', () => {
    queue.add('transaction', 'create', 'txn-1', { amount: 100 });
    queue.add('transaction', 'create', 'txn-2', { amount: 200 });
    expect(queue.getSize()).toBe(2);

    const cancelled = queue.cancelPending('transaction', 'txn-1');
    expect(cancelled).toBe(1);
    expect(queue.getSize()).toBe(1);
  });

  it('retries failed entries', () => {
    queue.add('budget', 'update', 'budget-1', { amount: 100 });
    const entry = queue.getPending()[0]!;
    // Mark it failed repeatedly to get it to 'failed' status
    for (let i = 0; i < 5; i++) {
      queue.markFailed(entry.id, `err ${i}`);
    }
    // Wait - MAX_RETRIES is 5. After 5 increments retryCount=5, status='failed'
    // Let me trace: add -> retryCount=0, status='pending'
    // markFailed 1: retryCount=1, 1>=5? no -> status='pending'
    // markFailed 2: retryCount=2, 2>=5? no -> status='pending'
    // markFailed 3: retryCount=3, 3>=5? no -> status='pending'
    // markFailed 4: retryCount=4, 4>=5? no -> status='pending'
    // markFailed 5: retryCount=5, 5>=5? yes -> status='failed'
    const after = queue.getAll();
    expect(after.length).toBe(1);
    expect(after[0]!.status).toBe('failed');

    const retried = queue.retryFailed();
    expect(retried).toBe(1);
    const all = queue.getAll();
    expect(all[0]!.status).toBe('pending');
    expect(all[0]!.retryCount).toBe(0);
  });

  it('clears all entries', () => {
    queue.add('mortgage', 'create', 'm-1', { amount: 100 });
    queue.add('budget', 'create', 'b-1', { amount: 200 });
    expect(queue.getSize()).toBe(2);
    queue.clear();
    expect(queue.getSize()).toBe(0);
  });

  it('persists across instances', () => {
    queue.add('transaction', 'create', 'txn-1', { amount: 100 });
    const queue2 = new SyncQueue();
    expect(queue2.getSize()).toBe(1);
    expect(queue2.getPending()[0]!.entityId).toBe('txn-1');
  });
});
