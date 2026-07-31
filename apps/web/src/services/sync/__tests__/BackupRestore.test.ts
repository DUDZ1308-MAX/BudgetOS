import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackupRestore } from '../BackupRestore';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

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
    const meta = await backup.createBackup(TEST_USER_ID);
    expect(meta.id).toBeTruthy();
    expect(meta.createdAt).toBeTruthy();
    expect(meta.recordCount).toBe(0); // no data in DB
  });

  it('stores backup data locally', async () => {
    const meta = await backup.createBackup(TEST_USER_ID);
    const data = backup.getBackupData(meta.id);
    expect(data).not.toBeNull();
    expect(data!.version).toBe('1.0.0');
    expect(data!.createdAt).toBeTruthy();
    expect(Array.isArray(data!.accounts)).toBe(true);
    expect(Array.isArray(data!.transactions)).toBe(true);
  });

  it('lists backups after creation', async () => {
    await backup.createBackup(TEST_USER_ID);
    await backup.createBackup(TEST_USER_ID);
    expect(backup.getBackups().length).toBe(2);
  });

  it('deletes a backup', async () => {
    const meta = await backup.createBackup(TEST_USER_ID);
    expect(backup.getBackups().length).toBe(1);
    backup.deleteBackup(meta.id);
    expect(backup.getBackups().length).toBe(0);
  });

  it('restore throws for missing backup', async () => {
    await expect(backup.restoreBackup(TEST_USER_ID, 'nonexistent')).rejects.toThrow('not found');
  });

  it('restore rejects an unauthenticated user id', async () => {
    await expect(backup.restoreBackup('user-1', 'nonexistent')).rejects.toThrow('Invalid user id');
  });

  it('createBackup rejects an unauthenticated user id', async () => {
    await expect(backup.createBackup('user-1')).rejects.toThrow('Invalid user id');
    await expect(backup.createBackup('')).rejects.toThrow('Authentication required');
  });

  it('stores and retrieves backup data', async () => {
    const meta = await backup.createBackup(TEST_USER_ID);
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
