import { describe, it, expect, beforeEach } from 'vitest';
import { getQueue, addToQueue, removeFromQueue, getQueueSize, clearQueue } from '../queue';

beforeEach(() => {
  localStorage.clear();
});

describe('sync queue', () => {
  it('starts empty', () => {
    expect(getQueueSize()).toBe(0);
    expect(getQueue()).toEqual([]);
  });

  it('adds entries to queue', () => {
    addToQueue('transaction', 'create', 'txn-1', { amount: 100 });
    expect(getQueueSize()).toBe(1);
    const queue = getQueue();
    expect(queue[0]!.entity).toBe('transaction');
    expect(queue[0]!.entityId).toBe('txn-1');
    expect(queue[0]!.retries).toBe(0);
  });

  it('replaces existing entry for same entity+id on update', () => {
    addToQueue('transaction', 'create', 'txn-1', { amount: 100 });
    addToQueue('transaction', 'update', 'txn-1', { amount: 200 });
    expect(getQueueSize()).toBe(1);
    expect(getQueue()[0]!.payload.amount).toBe(200);
  });

  it('removes entry when a delete follows a prior action', () => {
    addToQueue('transaction', 'create', 'txn-1', { amount: 100 });
    addToQueue('transaction', 'delete', 'txn-1', {});
    expect(getQueueSize()).toBe(0);
  });

  it('removes entry by id', () => {
    addToQueue('account', 'create', 'acct-1', { name: 'Test' });
    const id = getQueue()[0]!.id;
    removeFromQueue(id);
    expect(getQueueSize()).toBe(0);
  });

  it('clears all entries', () => {
    addToQueue('budget', 'create', 'budget-1', { amount: 500 });
    addToQueue('category', 'create', 'cat-1', { name: 'Test' });
    clearQueue();
    expect(getQueueSize()).toBe(0);
  });
});
