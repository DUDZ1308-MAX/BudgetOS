import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConflictResolver,
  VersionStrategy,
  TimestampStrategy,
  VersionThenTimestampStrategy,
} from '../ConflictResolver';

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
    resolver.clearConflicts();
  });

  describe('VersionStrategy', () => {
    it('prefers higher version', () => {
      const local = { id: 'a', amount: 100, version: 2 };
      const remote = { id: 'a', amount: 999, version: 1 };
      const { data, resolution } = resolver.resolve(local, remote, 'transaction', 'a');
      expect(data.amount).toBe(100);
      expect(resolution).toBe('local_won');
    });

    it('prefers remote when version is higher', () => {
      const local = { id: 'a', amount: 100, version: 1 };
      const remote = { id: 'a', amount: 999, version: 2 };
      const { data, resolution } = resolver.resolve(local, remote, 'transaction', 'a');
      expect(data.amount).toBe(999);
      expect(resolution).toBe('remote_won');
    });
  });

  describe('TimestampStrategy', () => {
    it('prefers newer timestamp', () => {
      resolver.setStrategy(new TimestampStrategy());
      const local = { id: 'b', amount: 100, updated_at: '2025-01-01T00:00:00Z' };
      const remote = { id: 'b', amount: 999, updated_at: '2025-01-02T00:00:00Z' };
      const { data, resolution } = resolver.resolve(local, remote, 'transaction', 'b');
      expect(data.amount).toBe(999);
      expect(resolution).toBe('remote_won');
    });

    it('prefers local when timestamps equal', () => {
      resolver.setStrategy(new TimestampStrategy());
      const local = { id: 'c', amount: 100, updated_at: '2025-01-01T00:00:00Z' };
      const remote = { id: 'c', amount: 200, updated_at: '2025-01-01T00:00:00Z' };
      const { data } = resolver.resolve(local, remote, 'transaction', 'c');
      expect(data.amount).toBe(100);
    });
  });

  describe('VersionThenTimestampStrategy (default)', () => {
    it('prefers higher version when timestamps conflict', () => {
      const local = { id: 'a', amount: 100, updated_at: '2025-01-01T00:00:00Z', version: 2 };
      const remote = { id: 'a', amount: 999, updated_at: '2025-01-02T00:00:00Z', version: 1 };
      const { data, resolution } = resolver.resolve(local, remote, 'transaction', 'a');
      expect(data.amount).toBe(100);
      expect(resolution).toBe('local_won');
    });

    it('falls back to timestamp when versions equal', () => {
      const local = { id: 'b', amount: 100, updated_at: '2025-01-01T00:00:00Z', version: 1 };
      const remote = { id: 'b', amount: 999, updated_at: '2025-01-02T00:00:00Z', version: 1 };
      const { data, resolution } = resolver.resolve(local, remote, 'transaction', 'b');
      expect(data.amount).toBe(999);
      expect(resolution).toBe('remote_won');
    });
  });

  describe('mergeArrays', () => {
    it('merges arrays with conflict resolution', () => {
      const local = [
        { id: 'a', amount: 100, version: 2, updated_at: '2025-01-01T00:00:00Z' },
        { id: 'b', amount: 200, version: 1, updated_at: '2025-01-01T00:00:00Z' },
      ];
      const remote = [
        { id: 'a', amount: 999, version: 1, updated_at: '2025-01-02T00:00:00Z' },
        { id: 'c', amount: 300, version: 1, updated_at: '2025-01-03T00:00:00Z' },
      ];

      const { merged, conflicts } = resolver.mergeArrays(local, remote, 'transaction');
      expect(merged.length).toBe(3);
      expect(merged.find((m) => m.id === 'a')!.amount).toBe(100); // local won
      expect(merged.find((m) => m.id === 'c')!.amount).toBe(300); // remote added
      expect(conflicts.length).toBeGreaterThan(0);
    });
  });

  describe('strategy management', () => {
    it('registers and lists strategies', () => {
      resolver.registerStrategy(new TimestampStrategy());
      expect(resolver.getStrategies().length).toBe(2);
    });

    it('sets active strategy', () => {
      resolver.setStrategy(new TimestampStrategy());
      expect(resolver.getActiveStrategy().name).toBe('timestamp');
    });
  });
});
