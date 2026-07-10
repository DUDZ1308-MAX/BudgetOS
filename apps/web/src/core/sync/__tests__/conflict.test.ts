import { describe, it, expect } from 'vitest';
import { mergeRemoteData } from '../engine';

describe('conflict resolution', () => {
  it('prefers higher version when timestamps conflict', () => {
    const local = [
      { id: 'a', amount: 100, updated_at: '2025-01-01T00:00:00Z', version: 2 },
    ];
    const remote = [
      { id: 'a', amount: 999, updated_at: '2025-01-02T00:00:00Z', version: 1 },
    ];

    const { merged, conflicts } = mergeRemoteData(local, remote, 'transaction');
    expect(merged[0]!.amount).toBe(100);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]!.resolution).toBe('local_won');
  });

  it('prefers newer timestamp when versions are equal', () => {
    const local = [
      { id: 'b', amount: 100, updated_at: '2025-01-01T00:00:00Z', version: 1 },
    ];
    const remote = [
      { id: 'b', amount: 999, updated_at: '2025-01-02T00:00:00Z', version: 1 },
    ];

    const { merged, conflicts } = mergeRemoteData(local, remote, 'transaction');
    expect(merged[0]!.amount).toBe(999);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0]!.resolution).toBe('remote_won');
  });

  it('keeps local when versions and timestamps are equal', () => {
    const local = [{ id: 'c', amount: 100, updated_at: '2025-01-01T00:00:00Z', version: 1 }];
    const remote = [{ id: 'c', amount: 200, updated_at: '2025-01-01T00:00:00Z', version: 1 }];

    const { merged } = mergeRemoteData(local, remote, 'transaction');
    expect(merged[0]!.amount).toBe(100);
  });

  it('adds remote items not in local', () => {
    const local: Record<string, unknown>[] = [];
    const remote = [{ id: 'd', amount: 300, updated_at: '2025-01-03T00:00:00Z', version: 1 }];

    const { merged } = mergeRemoteData(local, remote, 'transaction');
    expect(merged.length).toBe(1);
    expect(merged[0]!.amount).toBe(300);
  });
});
