import { create } from 'zustand';
import type { ProactiveAlert } from '@/intelligence/types';
import { loadStoredAlerts, saveAlerts } from '@/intelligence/RecommendationScheduler';

interface AlertsState {
  alerts: ProactiveAlert[];
  add: (alert: ProactiveAlert) => void;
  addMany: (alerts: ProactiveAlert[]) => void;
  remove: (id: string) => void;
  dismiss: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  load: () => void;
  clear: () => void;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  add: (alert) => set((s) => ({ alerts: [alert, ...s.alerts] })),
  addMany: (newAlerts) => {
    const existing = new Map(get().alerts.map((a) => [a.id, a]));
    for (const a of newAlerts) {
      const prev = existing.get(a.id);
      if (prev) {
        existing.set(a.id, { ...a, read: prev.read, dismissed: prev.dismissed });
      } else {
        existing.set(a.id, a);
      }
    }
    const updated = Array.from(existing.values());
    set({ alerts: updated });
    saveAlerts(updated);
  },
  remove: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  dismiss: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a)),
    })),
  markRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
    })),
  markAllRead: () =>
    set((s) => ({
      alerts: s.alerts.map((a) => ({ ...a, read: true })),
    })),
  load: () => {
    const stored = loadStoredAlerts();
    set({ alerts: stored });
  },
  clear: () => set({ alerts: [] }),
}));
