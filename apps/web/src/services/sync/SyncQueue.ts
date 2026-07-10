export type QueueEntryStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QueueEntry {
  id: string;
  entityType: string;
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  payload: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
  status: QueueEntryStatus;
  error?: string;
}

const QUEUE_KEY = 'budgetos-sync-queue-v2';
const MAX_RETRIES = 5;

export class SyncQueue {
  private entries: QueueEntry[] = [];

  constructor() {
    this.load();
  }

  add(
    entityType: string,
    operation: QueueEntry['operation'],
    entityId: string,
    payload: Record<string, unknown>,
  ): QueueEntry {
    const existing = this.entries.find(
      (e) => e.entityType === entityType && e.entityId === entityId && e.status === 'pending',
    );

    if (existing) {
      if (operation === 'delete') {
        this.entries = this.entries.filter((e) => e.id !== existing.id);
        this.save();
        return existing;
      }
      existing.operation = operation;
      existing.payload = payload;
      existing.timestamp = new Date().toISOString();
      this.save();
      return existing;
    }

    if (operation === 'delete') {
      const noop: QueueEntry = {
        id: `${entityType}-${entityId}-${Date.now()}`,
        entityType,
        operation: 'delete',
        entityId,
        payload: {},
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'completed',
      };
      return noop;
    }

    const entry: QueueEntry = {
      id: `${entityType}-${entityId}-${Date.now()}`,
      entityType,
      operation,
      entityId,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    this.entries.push(entry);
    this.save();
    return entry;
  }

  remove(id: string): void {
    this.entries = this.entries.filter((e) => e.id !== id);
    this.save();
  }

  markProcessing(id: string): void {
    const entry = this.entries.find((e) => e.id === id);
    if (entry) {
      entry.status = 'processing';
      this.save();
    }
  }

  markCompleted(id: string): void {
    this.entries = this.entries.filter((e) => e.id !== id);
    this.save();
  }

  markFailed(id: string, error: string): void {
    const entry = this.entries.find((e) => e.id === id);
    if (entry) {
      entry.retryCount += 1;
      entry.status = entry.retryCount >= MAX_RETRIES ? 'failed' : 'pending';
      entry.error = error;
      this.save();
    }
  }

  getPending(): QueueEntry[] {
    return this.entries.filter((e) => e.status === 'pending').sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  getFailed(): QueueEntry[] {
    return this.entries.filter((e) => e.status === 'failed');
  }

  getAll(): QueueEntry[] {
    return [...this.entries];
  }

  getSize(): number {
    return this.entries.length;
  }

  getPendingCount(): number {
    return this.entries.filter((e) => e.status === 'pending').length;
  }

  cancelPending(entityType?: string, entityId?: string): number {
    const before = this.entries.length;
    if (entityType && entityId) {
      this.entries = this.entries.filter(
        (e) => !(e.entityType === entityType && e.entityId === entityId && e.status === 'pending'),
      );
    } else if (entityType) {
      this.entries = this.entries.filter(
        (e) => !(e.entityType === entityType && e.status === 'pending'),
      );
    } else {
      this.entries = this.entries.filter((e) => e.status !== 'pending');
    }
    this.save();
    return before - this.entries.length;
  }

  retryFailed(): number {
    const failed = this.entries.filter((e) => e.status === 'failed');
    for (const entry of failed) {
      entry.status = 'pending';
      entry.retryCount = 0;
      entry.error = undefined;
    }
    this.save();
    return failed.length;
  }

  clear(): void {
    this.entries = [];
    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) this.entries = JSON.parse(raw);
    } catch {
      this.entries = [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.entries));
    } catch {
      if (import.meta.env.DEV) console.error('[SyncQueue] Failed to persist queue');
    }
  }
}

export const syncQueue = new SyncQueue();
