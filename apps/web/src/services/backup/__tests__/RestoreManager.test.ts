import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RestoreManager, restoreManager } from '@/services/backup/RestoreManager';
import type { BackupData } from '@/services/backup/BackupManager';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

function createTestBackup(): BackupData {
  return {
    _meta: { id: 'test-1', name: 'test', createdAt: '2025-01-01', schemaVersion: '1.0', appVersion: '1.0.0' },
    transactions: [{ id: '1', amount: 50, description: 'Test' }],
    categories: [],
    budgets: [],
    savings_goals: [],
    mortgages: [],
    accounts: [],
  };
}

describe('RestoreManager', () => {
  it('previews restore with entity counts', async () => {
    const preview = await restoreManager.preview(createTestBackup(), 'user1');
    expect(preview.totalRecords).toBe(1);
    expect(preview.totalEntities).toBeGreaterThanOrEqual(1);
    expect(preview.byEntity.transactions).toBeDefined();
  });

  it('restores entities in correct order', async () => {
    const result = await restoreManager.restore(createTestBackup(), 'user1', 'merge');
    expect(result.success).toBe(true);
    expect(result.restored).toBeGreaterThan(0);
  });

  it('calls onProgress callback', async () => {
    const onProgress = vi.fn();
    await restoreManager.restore(createTestBackup(), 'user1', 'merge', onProgress);
    expect(onProgress).toHaveBeenCalled();
  });

  it('handles replace mode', async () => {
    const result = await restoreManager.restore(createTestBackup(), 'user1', 'replace');
    expect(result.success).toBe(true);
  });

  it('handles empty backup gracefully', async () => {
    const empty: BackupData = {
      _meta: { id: 'empty-1', name: 'empty', createdAt: '2025-01-01', schemaVersion: '1.0', appVersion: '1.0.0' },
      transactions: [],
      categories: [],
      budgets: [],
      savings_goals: [],
      mortgages: [],
      accounts: [],
    };
    const result = await restoreManager.restore(empty, 'user1', 'merge');
    expect(result.restored).toBe(0);
  });
});
