import { useAuditStore } from './audit';
import type { AuditEntry } from './audit';

const SNAPSHOT_PREFIX = 'budgetos-snapshot-';
const MAX_SNAPSHOTS = 5;

export interface Snapshot {
  id: string;
  timestamp: string;
  label: string;
  state: Record<string, unknown>;
}

export function takeSnapshot(label: string, state: Record<string, unknown>): string {
  const id = `snap-${Date.now()}`;
  const snapshot: Snapshot = { id, timestamp: new Date().toISOString(), label, state };
  try {
    const existing = getSnapshots();
    existing.unshift(snapshot);
    if (existing.length > MAX_SNAPSHOTS) existing.length = MAX_SNAPSHOTS;
    localStorage.setItem(SNAPSHOT_PREFIX + 'index', JSON.stringify(existing.map((s) => ({ id: s.id, timestamp: s.timestamp, label: s.label }))));
    localStorage.setItem(SNAPSHOT_PREFIX + id, JSON.stringify(snapshot));
  } catch {
    // Silently fail if storage is full
  }
  return id;
}

export function getSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOT_PREFIX + 'index');
    if (!raw) return [];
    const index = JSON.parse(raw) as { id: string; timestamp: string; label: string }[];
    const snapshots: Snapshot[] = [];
    for (const entry of index) {
      const data = localStorage.getItem(SNAPSHOT_PREFIX + entry.id);
      if (data) {
        try {
          snapshots.push(JSON.parse(data));
        } catch { /* skip corrupted */ }
      }
    }
    return snapshots;
  } catch {
    return [];
  }
}

export function restoreSnapshot(snapshotId: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_PREFIX + snapshotId);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as Snapshot;
    return snapshot.state;
  } catch {
    return null;
  }
}

export function clearSnapshots(): void {
  try {
    const raw = localStorage.getItem(SNAPSHOT_PREFIX + 'index');
    if (raw) {
      const index = JSON.parse(raw) as { id: string }[];
      for (const entry of index) {
        localStorage.removeItem(SNAPSHOT_PREFIX + entry.id);
      }
    }
    localStorage.removeItem(SNAPSHOT_PREFIX + 'index');
  } catch { /* ignore */ }
}
