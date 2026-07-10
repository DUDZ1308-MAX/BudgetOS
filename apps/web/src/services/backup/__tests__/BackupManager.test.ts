import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackupManager, backupManager } from '@/services/backup/BackupManager';

describe('BackupManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function createTestBackup() {
    return backupManager.buildExportData(
      [{ id: 1, amount: 50 }],
      [{ id: 1, name: 'Test' }],
      [],
      [],
      [],
      [],
      'test_backup',
    );
  }

  it('builds export data with metadata', () => {
    const data = createTestBackup();
    expect(data._meta.name).toBe('test_backup');
    expect(data._meta.schemaVersion).toBe('1.0');
    expect(data.transactions).toHaveLength(1);
    expect(data.categories).toHaveLength(1);
  });

  it('gets backup metadata from data', () => {
    const data = createTestBackup();
    const meta = backupManager.getBackupMetadata(data);
    expect(meta.entityCount).toBe(2);
    expect(meta.entities).toContain('transactions');
    expect(meta.entities).toContain('categories');
    expect(meta.name).toBe('test_backup');
    expect(meta.schemaVersion).toBe('1.0');
  });

  it('calculates sizeBytes in metadata', () => {
    const data = createTestBackup();
    const meta = backupManager.getBackupMetadata(data);
    expect(meta.sizeBytes).toBeGreaterThan(0);
  });

  it('lists local backups from localStorage', () => {
    const data = createTestBackup();
    backupManager.saveToLocalHistory(data);
    const backups = backupManager.listLocalBackups();
    expect(backups).toHaveLength(1);
    expect(backups[0]!.name).toBe('test_backup');
  });

  it('returns empty array when no backups exist', () => {
    const backups = backupManager.listLocalBackups();
    expect(backups).toEqual([]);
  });

  it('gets a local backup by id', () => {
    const data = createTestBackup();
    backupManager.saveToLocalHistory(data);
    const backups = backupManager.listLocalBackups();
    const retrieved = backupManager.getLocalBackup(backups[0]!.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!._meta.name).toBe('test_backup');
    expect(retrieved!.transactions).toHaveLength(1);
  });

  it('returns null for non-existent backup id', () => {
    const result = backupManager.getLocalBackup('nonexistent');
    expect(result).toBeNull();
  });

  it('deletes a local backup by id', () => {
    const data = createTestBackup();
    backupManager.saveToLocalHistory(data);
    const before = backupManager.listLocalBackups();
    const deleted = backupManager.deleteLocalBackup(before[0]!.id);
    expect(deleted).toBe(true);
    expect(backupManager.listLocalBackups()).toHaveLength(0);
  });

  it('returns false when deleting non-existent backup', () => {
    const result = backupManager.deleteLocalBackup('nonexistent');
    expect(result).toBe(false);
  });

  it('limits history to 20 backups', () => {
    for (let i = 0; i < 25; i++) {
      backupManager.saveToLocalHistory(
        backupManager.buildExportData([], [], [], [], [], [], `backup_${i}`),
      );
    }
    expect(backupManager.listLocalBackups()).toHaveLength(20);
  });

  it('generates backup id with correct prefix', () => {
    const data = createTestBackup();
    backupManager.saveToLocalHistory(data);
    const id = backupManager.listLocalBackups()[0]!.id;
    expect(id).toMatch(/^bkp_/);
  });

  it('downloadBackup creates a downloadable blob', () => {
    const data = createTestBackup();
    const originalURL = globalThis.URL;
    (globalThis as any).URL = {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    };
    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockReturnValue({} as Node);
    vi.spyOn(document.body, 'removeChild').mockReturnValue({} as Node);

    backupManager.downloadBackup(data);
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    globalThis.URL = originalURL;
  });
});
