import { describe, it, expect, beforeEach } from 'vitest';
import { BackupRestore } from '../BackupRestore';

describe('BackupRestore', () => {
  let backup: BackupRestore;

  beforeEach(() => {
    localStorage.clear();
    backup = new BackupRestore();
  });

  it('starts with no backups', () => {
    expect(backup.getBackups()).toEqual([]);
  });

  it('creates a backup and stores metadata', async () => {
    const meta = await backup.createBackup('test-user-id');
    expect(meta.id).toBeTruthy();
    expect(meta.createdAt).toBeTruthy();
    expect(meta.recordCount).toBe(0); // no data in DB
  });

  it('stores backup data locally', async () => {
    const meta = await backup.createBackup('test-user-id');
    const data = backup.getBackupData(meta.id);
    expect(data).not.toBeNull();
    expect(data!.version).toBe('1.0.0');
    expect(data!.createdAt).toBeTruthy();
    expect(Array.isArray(data!.accounts)).toBe(true);
    expect(Array.isArray(data!.transactions)).toBe(true);
  });

  it('lists backups after creation', async () => {
    await backup.createBackup('user-1');
    await backup.createBackup('user-1');
    expect(backup.getBackups().length).toBe(2);
  });

  it('deletes a backup', async () => {
    const meta = await backup.createBackup('user-1');
    expect(backup.getBackups().length).toBe(1);
    backup.deleteBackup(meta.id);
    expect(backup.getBackups().length).toBe(0);
  });

  it('restore throws for missing backup', async () => {
    await expect(backup.restoreBackup('user-1', 'nonexistent')).rejects.toThrow('not found');
  });

  it('stores and retrieves backup data', async () => {
    const meta = await backup.createBackup('user-1');
    const data = backup.getBackupData(meta.id);
    expect(data).toBeTruthy();
    expect(data!.version).toBe('1.0.0');
    expect(data!.accounts).toBeInstanceOf(Array);
    expect(data!.categories).toBeInstanceOf(Array);
    expect(data!.transactions).toBeInstanceOf(Array);
    expect(data!.budgets).toBeInstanceOf(Array);
    expect(data!.savings_goals).toBeInstanceOf(Array);
    expect(data!.contributions).toBeInstanceOf(Array);
    expect(data!.mortgages).toBeInstanceOf(Array);
    expect(data!.extra_payments).toBeInstanceOf(Array);
    expect(data!.report_preferences).toBeInstanceOf(Array);
    expect(data!.metadata).toBeInstanceOf(Object);
  });
});
