import { supabase } from '@/lib/supabase';
import { logger } from '@/core/logger';

export interface BackupData {
  version: string;
  createdAt: string;
  budgets: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  accounts: Record<string, unknown>[];
  savings_goals: Record<string, unknown>[];
  contributions: Record<string, unknown>[];
  mortgages: Record<string, unknown>[];
  extra_payments: Record<string, unknown>[];
  report_preferences: Record<string, unknown>[];
  metadata: Record<string, unknown>;
}

const BACKUP_KEY = 'budgetos-backups';
const CURRENT_VERSION = '1.0.0';

interface BackupMeta {
  id: string;
  createdAt: string;
  recordCount: number;
}

const entityTableMap: Record<string, string> = {
  accounts: 'accounts',
  categories: 'categories',
  transactions: 'transactions',
  budgets: 'budgets',
  savings_goals: 'savings_goals',
  contributions: 'contributions',
  mortgages: 'mortgages',
  extra_payments: 'extra_payments',
  report_preferences: 'report_preferences',
};

export class BackupRestore {
  async createBackup(userId: string): Promise<BackupMeta> {
    const tables: Array<keyof BackupData> = [
      'accounts', 'categories', 'transactions', 'budgets',
      'savings_goals', 'contributions', 'mortgages',
      'extra_payments', 'report_preferences',
    ];

    const data: Partial<BackupData> = {
      version: CURRENT_VERSION,
      createdAt: new Date().toISOString(),
      metadata: {},
    };

    for (const table of tables) {
      const dbTable = entityTableMap[table] ?? table;
      const { data: rows, error } = await supabase
        .from(dbTable)
        .select('*')
        .eq('user_id', userId);

      if (error && import.meta.env.DEV) {
        console.error(`[Backup] Failed to fetch ${table}:`, error.message);
      }
      (data as Record<string, unknown>)[table] = rows ?? [];
    }

    const backup: BackupData = data as BackupData;
    const recordCount = tables.reduce((sum, t) => sum + ((backup[t] as unknown[])?.length ?? 0), 0);
    const backupId = `backup-${Date.now()}`;
    const meta: BackupMeta = { id: backupId, createdAt: backup.createdAt, recordCount };

    this.saveBackupMeta(backupId, meta);
    this.saveBackupData(backupId, backup);

    return meta;
  }

  async restoreBackup(userId: string, backupId: string): Promise<{ restored: number; errors: string[] }> {
    const backup = this.getBackupData(backupId);
    if (!backup) throw new Error(`Backup ${backupId} not found`);

    const errors: string[] = [];
    let restored = 0;

    const tables: Array<keyof BackupData> = [
      'accounts', 'categories', 'transactions', 'budgets',
      'savings_goals', 'contributions', 'mortgages',
      'extra_payments', 'report_preferences',
    ];

    for (const table of tables) {
      const dbTable = entityTableMap[table] ?? table;
      const rows = backup[table] as Record<string, unknown>[] | undefined;
      if (!rows || rows.length === 0) continue;

      const withUserId = rows.map((row) => ({ ...row, user_id: userId, id: row.id }));

      const { error } = await supabase.from(dbTable).upsert(withUserId, { onConflict: 'id' });
      if (error) {
        errors.push(`${table}: ${error.message}`);
      } else {
        restored += rows.length;
      }
    }

    return { restored, errors };
  }

  getBackups(): BackupMeta[] {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  deleteBackup(backupId: string): void {
    const backups = this.getBackups().filter((b) => b.id !== backupId);
    this.saveBackupMetaList(backups);
    try {
      localStorage.removeItem(`budgetos-backup-data-${backupId}`);
    } catch {
      // ignore
    }
  }

  getBackupData(backupId: string): BackupData | null {
    try {
      const raw = localStorage.getItem(`budgetos-backup-data-${backupId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveBackupMeta(id: string, meta: BackupMeta): void {
    const backups = this.getBackups();
    backups.push(meta);
    this.saveBackupMetaList(backups);
  }

  private saveBackupMetaList(backups: BackupMeta[]): void {
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
    } catch {
      if (import.meta.env.DEV) console.error('[Backup] Failed to persist backup list');
    }
  }

  private saveBackupData(id: string, data: BackupData): void {
    try {
      localStorage.setItem(`budgetos-backup-data-${id}`, JSON.stringify(data));
    } catch {
      if (import.meta.env.DEV) console.error('[Backup] Failed to persist backup data');
    }
  }

  generateBackupReport(backupId: string): {
    entryCount: number;
    lastBackupDate: string | null;
    sizeEstimate: number;
    entityCounts: Record<string, number>;
  } | null {
    const backup = this.getBackupData(backupId);
    if (!backup) return null;

    const tables: Array<keyof BackupData> = [
      'accounts', 'categories', 'transactions', 'budgets',
      'savings_goals', 'contributions', 'mortgages',
      'extra_payments', 'report_preferences',
    ];

    let entryCount = 0;
    const entityCounts: Record<string, number> = {};
    for (const table of tables) {
      const rows = backup[table] as Record<string, unknown>[] | undefined;
      const count = rows?.length ?? 0;
      entityCounts[table] = count;
      entryCount += count;
    }

    const raw = localStorage.getItem(`budgetos-backup-data-${backupId}`);
    const sizeEstimate = raw ? new Blob([raw]).size : 0;

    return {
      entryCount,
      lastBackupDate: backup.createdAt,
      sizeEstimate,
      entityCounts,
    };
  }

  verifyBackupIntegrity(backup: BackupData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!backup || typeof backup !== 'object') {
      return { valid: false, errors: ['Backup is not an object'] };
    }

    if (typeof backup.version !== 'string') {
      errors.push('Missing or invalid "version" field');
    }
    if (typeof backup.createdAt !== 'string') {
      errors.push('Missing or invalid "createdAt" field');
    }
    if (!backup.metadata || typeof backup.metadata !== 'object') {
      errors.push('Missing or invalid "metadata" field');
    }

    const arrayFields: Array<keyof BackupData> = [
      'accounts', 'categories', 'transactions', 'budgets',
      'savings_goals', 'contributions', 'mortgages',
      'extra_payments', 'report_preferences',
    ];

    for (const field of arrayFields) {
      const value = backup[field];
      if (value !== undefined && value !== null && !Array.isArray(value)) {
        errors.push(`"${field}" is not an array`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  downloadBackupAsJson(backupId: string): void {
    try {
      const raw = localStorage.getItem(`budgetos-backup-data-${backupId}`);
      if (!raw) {
        logger.warn(`Backup ${backupId} not found for download`, 'BackupRestore');
        return;
      }
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mybudgetos_cloud_backup_${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      logger.info(`Downloaded backup: ${backupId}`, 'BackupRestore');
    } catch (err) {
      logger.error('Failed to download backup as JSON', 'BackupRestore', err);
    }
  }

  importBackupFromJson(file: File): Promise<BackupData | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string) as BackupData;
          const integrity = this.verifyBackupIntegrity(parsed);
          if (!integrity.valid) {
            logger.warn('Imported backup failed integrity check', 'BackupRestore', { errors: integrity.errors });
            resolve(null);
            return;
          }
          const meta: BackupMeta = {
            id: `imported-${Date.now()}`,
            createdAt: parsed.createdAt,
            recordCount: (
              (parsed.accounts?.length ?? 0) +
              (parsed.categories?.length ?? 0) +
              (parsed.transactions?.length ?? 0) +
              (parsed.budgets?.length ?? 0) +
              (parsed.savings_goals?.length ?? 0) +
              (parsed.contributions?.length ?? 0) +
              (parsed.mortgages?.length ?? 0) +
              (parsed.extra_payments?.length ?? 0) +
              (parsed.report_preferences?.length ?? 0)
            ),
          };
          this.saveBackupMeta(meta.id, meta);
          this.saveBackupData(meta.id, parsed);
          logger.info(`Imported backup: ${meta.id}`, 'BackupRestore', { records: meta.recordCount });
          resolve(parsed);
        } catch (err) {
          logger.error('Failed to parse imported backup file', 'BackupRestore', err);
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
  }
}

export const backupRestore = new BackupRestore();
