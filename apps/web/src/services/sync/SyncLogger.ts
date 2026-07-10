export type SyncOutcome = 'success' | 'partial' | 'failed';

export interface SyncLogEntry {
  id: string;
  startedAt: string;
  completedAt: string;
  outcome: SyncOutcome;
  recordsUploaded: number;
  recordsDownloaded: number;
  conflictsResolved: number;
  failures: number;
  error?: string;
}

const LOG_KEY = 'budgetos-sync-log';
const MAX_ENTRIES = 100;

export class SyncLogger {
  private entries: SyncLogEntry[] = [];

  constructor() {
    this.load();
  }

  startSync(): string {
    const id = `sync-${Date.now()}`;
    const entry: SyncLogEntry = {
      id,
      startedAt: new Date().toISOString(),
      completedAt: '',
      outcome: 'success',
      recordsUploaded: 0,
      recordsDownloaded: 0,
      conflictsResolved: 0,
      failures: 0,
    };
    this.entries.unshift(entry);
    this.trim();
    this.save();
    return id;
  }

  completeSync(
    id: string,
    outcome: SyncOutcome,
    stats: { recordsUploaded?: number; recordsDownloaded?: number; conflictsResolved?: number; failures?: number; error?: string },
  ): void {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry) return;
    entry.completedAt = new Date().toISOString();
    entry.outcome = outcome;
    if (stats.recordsUploaded !== undefined) entry.recordsUploaded = stats.recordsUploaded;
    if (stats.recordsDownloaded !== undefined) entry.recordsDownloaded = stats.recordsDownloaded;
    if (stats.conflictsResolved !== undefined) entry.conflictsResolved = stats.conflictsResolved;
    if (stats.failures !== undefined) entry.failures = stats.failures;
    if (stats.error !== undefined) entry.error = stats.error;
    this.save();
  }

  getRecent(count: number = 10): SyncLogEntry[] {
    return this.entries.slice(0, count);
  }

  getLastSync(): SyncLogEntry | null {
    return this.entries.length > 0 ? this.entries[0] ?? null : null;
  }

  getAll(): SyncLogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
    this.save();
  }

  private trim(): void {
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_ENTRIES);
    }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      if (raw) this.entries = JSON.parse(raw);
    } catch {
      this.entries = [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(this.entries));
    } catch {
      if (import.meta.env.DEV) console.error('[SyncLogger] Failed to persist log');
    }
  }
}

export const syncLogger = new SyncLogger();
