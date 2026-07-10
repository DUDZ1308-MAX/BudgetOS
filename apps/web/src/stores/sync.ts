import { create } from 'zustand';
import type { SyncStatus } from '@/core/sync/types';
import { getLastSyncTime } from '@/core/sync/engine';
import { getQueueSize } from '@/core/sync/queue';

interface SyncState {
  status: SyncStatus;
  lastSyncTime: string | null;
  pendingCount: number;
  error: string | null;
  setStatus: (status: SyncStatus) => void;
  setLastSyncTime: (time: string) => void;
  setPendingCount: (count: number) => void;
  setError: (error: string | null) => void;
  refresh: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: navigator.onLine ? 'online' : 'offline',
  lastSyncTime: getLastSyncTime(),
  pendingCount: getQueueSize(),
  error: null,
  setStatus: (status) => set({ status }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setError: (error) => set({ error }),
  refresh: () => set({
    status: navigator.onLine ? 'online' : 'offline',
    lastSyncTime: getLastSyncTime(),
    pendingCount: getQueueSize(),
  }),
}));
