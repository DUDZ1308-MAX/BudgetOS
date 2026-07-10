import { describe, it, expect, beforeEach } from 'vitest';
import { SyncLogger } from '../SyncLogger';

describe('SyncLogger', () => {
  let logger: SyncLogger;

  beforeEach(() => {
    localStorage.clear();
    logger = new SyncLogger();
  });

  it('starts with no entries', () => {
    expect(logger.getAll()).toEqual([]);
    expect(logger.getLastSync()).toBeNull();
  });

  it('records a sync lifecycle', () => {
    const id = logger.startSync();
    expect(id).toBeTruthy();

    const entries = logger.getAll();
    expect(entries.length).toBe(1);
    expect(entries[0]!.id).toBe(id);
    expect(entries[0]!.startedAt).toBeTruthy();
    expect(entries[0]!.completedAt).toBe('');

    logger.completeSync(id, 'success', { recordsUploaded: 5, recordsDownloaded: 10 });

    const updated = logger.getLastSync()!;
    expect(updated.outcome).toBe('success');
    expect(updated.recordsUploaded).toBe(5);
    expect(updated.recordsDownloaded).toBe(10);
    expect(updated.completedAt).toBeTruthy();
  });

  it('records partial outcome', () => {
    const id = logger.startSync();
    logger.completeSync(id, 'partial', { recordsUploaded: 3, failures: 1 });
    expect(logger.getLastSync()!.outcome).toBe('partial');
    expect(logger.getLastSync()!.failures).toBe(1);
  });

  it('records failed outcome', () => {
    const id = logger.startSync();
    logger.completeSync(id, 'failed', { error: 'Network error', failures: 1 });
    expect(logger.getLastSync()!.outcome).toBe('failed');
    expect(logger.getLastSync()!.error).toBe('Network error');
  });

  it('limits to 100 entries', () => {
    for (let i = 0; i < 150; i++) {
      const id = logger.startSync();
      logger.completeSync(id, 'success', {});
    }
    expect(logger.getAll().length).toBe(100);
  });

  it('returns recent entries', () => {
    for (let i = 0; i < 5; i++) {
      const id = logger.startSync();
      logger.completeSync(id, 'success', {});
    }
    expect(logger.getRecent(3).length).toBe(3);
    expect(logger.getRecent(10).length).toBe(5);
  });

  it('clears all entries', () => {
    logger.startSync();
    logger.clear();
    expect(logger.getAll()).toEqual([]);
    expect(logger.getLastSync()).toBeNull();
  });

  it('persists across instances', () => {
    const id = logger.startSync();
    logger.completeSync(id, 'success', { recordsUploaded: 1 });
    const logger2 = new SyncLogger();
    expect(logger2.getLastSync()!.recordsUploaded).toBe(1);
  });
});
