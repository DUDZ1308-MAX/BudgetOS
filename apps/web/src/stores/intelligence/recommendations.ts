import { create } from 'zustand';
import type { Recommendation } from '@/intelligence/types';
import { loadStoredRecs, saveRecs } from '@/intelligence/RecommendationScheduler';

interface RecommendationsState {
  recommendations: Recommendation[];
  addMany: (recs: Recommendation[]) => void;
  dismiss: (id: string) => void;
  apply: (id: string) => void;
  load: () => void;
  clear: () => void;
}

export const useRecommendationsStore = create<RecommendationsState>((set, get) => ({
  recommendations: [],
  addMany: (newRecs) => {
    const existing = new Map(get().recommendations.map((r) => [r.id, r]));
    for (const r of newRecs) {
      const prev = existing.get(r.id);
      if (prev) {
        existing.set(r.id, { ...r, dismissed: prev.dismissed, applied: prev.applied });
      } else {
        existing.set(r.id, r);
      }
    }
    const updated = Array.from(existing.values());
    set({ recommendations: updated });
    saveRecs(updated);
  },
  dismiss: (id) =>
    set((s) => ({
      recommendations: s.recommendations.map((r) =>
        r.id === id ? { ...r, dismissed: true } : r,
      ),
    })),
  apply: (id) =>
    set((s) => ({
      recommendations: s.recommendations.map((r) =>
        r.id === id ? { ...r, applied: true } : r,
      ),
    })),
  load: () => {
    const stored = loadStoredRecs();
    set({ recommendations: stored });
  },
  clear: () => set({ recommendations: [] }),
}));
