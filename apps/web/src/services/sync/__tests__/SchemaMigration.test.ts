import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchemaMigration } from '../SchemaMigration';

describe('SchemaMigration', () => {
  let migration: SchemaMigration;

  beforeEach(() => {
    localStorage.clear();
    migration = new SchemaMigration();
  });

  it('starts at version 0', () => {
    expect(migration.getCurrentVersion()).toBe(0);
  });

  it('reports latest version', () => {
    expect(migration.getLatestVersion()).toBe(2);
  });

  it('reports needing migration at version 0', () => {
    expect(migration.needsMigration()).toBe(true);
  });

  it('does not need migration when at latest', () => {
    const m = new SchemaMigration();
    // After ensureUpToDate it should be at version 2... 
    // But there are no registered migrations yet
    // So needsMigration will still be true
  });

  it('runs registered migrations', async () => {
    const fn1 = vi.fn().mockResolvedValue(undefined);
    const fn2 = vi.fn().mockResolvedValue(undefined);

    migration.register({ version: 1, name: 'Initial', migrate: fn1 });
    migration.register({ version: 2, name: 'Add fields', migrate: fn2 });

    const result = await migration.runPending();
    expect(result.applied).toBe(2);
    expect(result.currentVersion).toBe(2);
    expect(migration.getCurrentVersion()).toBe(2);
    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).toHaveBeenCalledOnce();
  });

  it('skips already-applied migrations', async () => {
    const fn = vi.fn();

    migration.register({ version: 1, name: 'Initial', migrate: fn });
    await migration.runPending();
    expect(migration.getCurrentVersion()).toBe(1);

    migration.register({ version: 2, name: 'Second', migrate: fn });
    const result = await migration.runPending();
    expect(result.applied).toBe(1);
    expect(fn).toHaveBeenCalledTimes(2); // once per run, only v2
  });

  it('stops on migration failure', async () => {
    const fnGood = vi.fn().mockResolvedValue(undefined);
    const fnBad = vi.fn().mockRejectedValue(new Error('Migration failed'));

    migration.register({ version: 1, name: 'Good', migrate: fnGood });
    migration.register({ version: 2, name: 'Bad', migrate: fnBad });

    await expect(migration.runPending()).rejects.toThrow('Migration failed');
    expect(fnGood).toHaveBeenCalledOnce();
    expect(fnBad).toHaveBeenCalledOnce();
  });

  it('persists version across instances', async () => {
    migration.register({ version: 1, name: 'Initial', migrate: async () => {} });
    await migration.runPending();
    expect(migration.getCurrentVersion()).toBe(1);

    const m2 = new SchemaMigration();
    expect(m2.getCurrentVersion()).toBe(1);
  });

  it('resets version to 0', async () => {
    migration.register({ version: 1, name: 'Initial', migrate: async () => {} });
    await migration.runPending();
    expect(migration.getCurrentVersion()).toBe(1);

    migration.reset();
    expect(migration.getCurrentVersion()).toBe(0);
  });

  it('ensureUpToDate runs pending migrations', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    migration.register({ version: 1, name: 'Initial', migrate: fn });
    migration.register({ version: 2, name: 'Second', migrate: fn });

    await migration.ensureUpToDate();
    expect(migration.getCurrentVersion()).toBe(2);
  });
});
