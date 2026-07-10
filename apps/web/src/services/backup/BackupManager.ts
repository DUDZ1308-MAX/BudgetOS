import { supabase } from '@/lib/supabase';
import { logger } from '@/core/logger';

export interface BackupMetadata {
  id: string;
  name: string;
  createdAt: string;
  sizeBytes: number;
  entityCount: number;
  schemaVersion: string;
  entities: string[];
}

export interface BackupEntry {
  id: string;
  timestamp: string;
  label: string;
  size: number;
  tableCounts: Record<string, number>;
}

export interface BackupData {
  _meta: {
    id: string;
    name: string;
    createdAt: string;
    schemaVersion: string;
    appVersion: string;
  };
  transactions: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  budgets: Record<string, unknown>[];
  savings_goals: Record<string, unknown>[];
  mortgages: Record<string, unknown>[];
  accounts: Record<string, unknown>[];
}

export class BackupManager {
  private localStorageBackupPrefix = 'budgetos_local_backup_';
  private maxLocalStorageBackups = 20;
  private retentionDays = 30;
  private autoScheduled = false;

  private readonly BACKUP_KEYS = [
    'budgetos_subscription',
    'budgetos_ai_settings',
    'budgetos_alerts',
    'budgetos_recommendations',
    'budgetos_notifications',
    'budgetos_last_intelligence_gen',
    'budgetos_notification_prefs',
    'budgetos-sync-queue',
    'budgetos-sync-queue-v2',
    'budgetos_sync_last_sync',
  ];

  createLocalStorageBackup(label: string = `backup_${Date.now()}`): BackupEntry {
    const data: Record<string, unknown> = {};
    let totalSize = 0;
    const tableCounts: Record<string, number> = {};

    for (const key of this.BACKUP_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          data[key] = JSON.parse(raw);
          totalSize += raw.length;
          if (Array.isArray(data[key])) {
            tableCounts[key] = (data[key] as unknown[]).length;
          } else if (data[key] && typeof data[key] === 'object') {
            tableCounts[key] = 1;
          }
        }
      } catch (err) {
        logger.warn(`Failed to backup key: ${key}`, 'BackupManager', { error: String(err) });
      }
    }

    const entry: BackupEntry = {
      id: crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      label,
      size: totalSize,
      tableCounts,
    };

    try {
      const backupData = { version: 1, exportedAt: entry.timestamp, appVersion: '1.0.0', data };
      localStorage.setItem(`${this.localStorageBackupPrefix}${entry.id}`, JSON.stringify(backupData));
    } catch (err) {
      logger.error('Failed to save local backup', 'BackupManager', err);
    }

    logger.info(`Local backup created: ${label}`, 'BackupManager', { size: `${totalSize}B`, tables: tableCounts });
    return entry;
  }

  listLocalStorageBackups(): BackupEntry[] {
    const backups: BackupEntry[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.localStorageBackupPrefix)) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              backups.push({
                id: key.replace(this.localStorageBackupPrefix, ''),
                timestamp: parsed.exportedAt ?? parsed.timestamp,
                label: parsed.label ?? `Backup ${new Date(parsed.exportedAt).toLocaleDateString()}`,
                size: raw.length,
                tableCounts: parsed.data
                  ? Object.keys(parsed.data).reduce((acc: Record<string, number>, k: string) => {
                      acc[k] = Array.isArray(parsed.data[k]) ? parsed.data[k].length : 1;
                      return acc;
                    }, {})
                  : {},
              });
            }
          } catch { /* skip corrupt entries */ }
        }
      }
    } catch { /* ignore */ }
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  restoreLocalStorageBackup(backupId: string): boolean {
    try {
      const raw = localStorage.getItem(`${this.localStorageBackupPrefix}${backupId}`);
      if (!raw) return false;
      const backup = JSON.parse(raw);
      const data = backup.data as Record<string, unknown>;

      for (const key of Object.keys(data)) {
        try {
          localStorage.setItem(key, JSON.stringify(data[key]));
        } catch (err) {
          logger.warn(`Failed to restore key: ${key}`, 'BackupManager', { error: String(err) });
        }
      }

      logger.info(`Local backup restored: ${backupId}`, 'BackupManager');
      return true;
    } catch (err) {
      logger.error('Failed to restore local backup', 'BackupManager', err);
      return false;
    }
  }

  downloadLocalStorageBackup(backupId: string): void {
    try {
      const raw = localStorage.getItem(`${this.localStorageBackupPrefix}${backupId}`);
      if (!raw) return;
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budgetos_local_backup_${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Failed to download local backup', 'BackupManager', err);
    }
  }

  deleteLocalStorageBackup(backupId: string): boolean {
    try {
      localStorage.removeItem(`${this.localStorageBackupPrefix}${backupId}`);
      return true;
    } catch {
      return false;
    }
  }

  clearAllLocalStorageBackups(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.localStorageBackupPrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    logger.info(`Cleared ${keysToRemove.length} local backups`, 'BackupManager');
  }

  async createBackup(userId: string, name: string): Promise<BackupData> {
    const [transactions, categories, budgets, savingsGoals, mortgages, accounts] =
      await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId),
        supabase.from('categories').select('*').eq('user_id', userId),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('savings_goals').select('*').eq('user_id', userId),
        supabase.from('mortgages').select('*').eq('user_id', userId),
        supabase.from('accounts').select('*').eq('user_id', userId),
      ]);

    const backup: BackupData = {
      _meta: {
        id: this.generateId(),
        name,
        createdAt: new Date().toISOString(),
        schemaVersion: '1.0',
        appVersion: '1.0.0',
      },
      transactions: transactions.data ?? [],
      categories: categories.data ?? [],
      budgets: budgets.data ?? [],
      savings_goals: savingsGoals.data ?? [],
      mortgages: mortgages.data ?? [],
      accounts: accounts.data ?? [],
    };

    this.saveToLocalHistory(backup);
    return backup;
  }

  getBackupMetadata(backup: BackupData): BackupMetadata {
    const entityCount =
      backup.transactions.length +
      backup.categories.length +
      backup.budgets.length +
      backup.savings_goals.length +
      backup.mortgages.length +
      backup.accounts.length;

    const entities = Object.keys(backup).filter(
      (k) => k !== '_meta' && Array.isArray((backup as unknown as Record<string, unknown>)[k]),
    );

    return {
      id: backup._meta.id,
      name: backup._meta.name,
      createdAt: backup._meta.createdAt,
      sizeBytes: new Blob([JSON.stringify(backup)]).size,
      entityCount,
      schemaVersion: backup._meta.schemaVersion,
      entities,
    };
  }

  listLocalBackups(): BackupMetadata[] {
    try {
      const raw = localStorage.getItem('budgetos_backups');
      if (!raw) return [];
      const backups: BackupData[] = JSON.parse(raw);
      return backups.map((b) => this.getBackupMetadata(b));
    } catch {
      return [];
    }
  }

  getLocalBackup(id: string): BackupData | null {
    const backups = this.loadLocalBackups();
    return backups.find(
      (b) => b._meta.id === id,
    ) ?? null;
  }

  deleteLocalBackup(id: string): boolean {
    const backups = this.loadLocalBackups();
    const filtered = backups.filter(
      (b) => b._meta.id !== id,
    );
    if (filtered.length === backups.length) return false;
    localStorage.setItem('budgetos_backups', JSON.stringify(filtered));
    return true;
  }

  downloadBackup(backup: BackupData): void {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup._meta.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  estimateBackupSize(userId: string): Promise<number> {
    return this.createBackup(userId, '_size_estimate').then(
      (b) => new Blob([JSON.stringify(b)]).size,
    );
  }

  buildExportData(
    transactions: Record<string, unknown>[] = [],
    categories: Record<string, unknown>[] = [],
    budgets: Record<string, unknown>[] = [],
    savingsGoals: Record<string, unknown>[] = [],
    mortgages: Record<string, unknown>[] = [],
    accounts: Record<string, unknown>[] = [],
    name: string = 'backup',
  ): BackupData {
    return {
      _meta: {
        id: this.generateId(),
        name,
        createdAt: new Date().toISOString(),
        schemaVersion: '1.0',
        appVersion: '1.0.0',
      },
      transactions,
      categories,
      budgets: budgets as Record<string, unknown>[],
      savings_goals: savingsGoals as Record<string, unknown>[],
      mortgages: mortgages as Record<string, unknown>[],
      accounts: accounts as Record<string, unknown>[],
    };
  }

  saveToLocalHistory(backup: BackupData): void {
    const backups = this.loadLocalBackups();
    backups.unshift(backup);
    const max = 20;
    if (backups.length > max) backups.length = max;
    localStorage.setItem('budgetos_backups', JSON.stringify(backups));
  }

  private loadLocalBackups(): BackupData[] {
    try {
      const raw = localStorage.getItem('budgetos_backups');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private generateId(): string {
    return 'bkp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  setRetentionDays(days: number): void {
    this.retentionDays = Math.max(1, days);
    logger.info(`Backup retention set to ${this.retentionDays} days`, 'BackupManager');
  }

  enforceRetentionPolicy(): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    const backups = this.listLocalBackups();
    let removed = 0;
    for (const backup of backups) {
      if (new Date(backup.createdAt) < cutoff) {
        if (this.deleteLocalBackup(backup.id)) removed++;
      }
    }
    if (removed > 0) {
      logger.info(`Retention policy removed ${removed} expired backups`, 'BackupManager', { retentionDays: this.retentionDays });
    }
    return removed;
  }

  enforceLocalBackupLimit(): number {
    const keysToRemove: string[] = [];
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.localStorageBackupPrefix)) {
        count++;
        if (count > this.maxLocalStorageBackups) {
          keysToRemove.push(key);
        }
      }
    }
    const overflow = count - this.maxLocalStorageBackups;
    if (overflow > 0) {
      keysToRemove.slice(0, overflow).forEach((key) => localStorage.removeItem(key));
      logger.info(`Removed ${overflow} local backups over limit of ${this.maxLocalStorageBackups}`, 'BackupManager');
    }
    return overflow;
  }

  scheduleAutoBackup(intervalMs: number = 30 * 60 * 1000): () => void {
    if (this.autoScheduled) {
      logger.warn('Auto backup already scheduled', 'BackupManager');
      return () => {};
    }
    this.autoScheduled = true;
    const intervalId = setInterval(() => {
      try {
        const backup = this.createLocalStorageBackup(`auto_${new Date().toISOString()}`);
        logger.info('Auto backup created', 'BackupManager', { id: backup.id, size: `${backup.size}B` });
        this.enforceRetentionPolicy();
        this.enforceLocalBackupLimit();
      } catch (err) {
        logger.error('Auto backup failed', 'BackupManager', err);
      }
    }, intervalMs);
    logger.info(`Auto backup scheduled every ${intervalMs / 60000} minutes`, 'BackupManager');
    return () => {
      clearInterval(intervalId);
      this.autoScheduled = false;
      logger.info('Auto backup stopped', 'BackupManager');
    };
  }
}

export const backupManager = new BackupManager();
