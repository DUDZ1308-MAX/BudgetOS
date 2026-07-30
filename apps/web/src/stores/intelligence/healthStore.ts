import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FinancialHealthResult } from '@/intelligence/types';

interface HealthState {
  result: FinancialHealthResult | null;
  loading: boolean;
  error: string | null;
  lastComputed: number | null;
  setResult: (result: FinancialHealthResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set) => ({
      result: null,
      loading: false,
      error: null,
      lastComputed: null,
      setResult: (result) => set({ result, lastComputed: Date.now(), loading: false, error: null }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error, loading: false }),
      clear: () => set({ result: null, lastComputed: null, error: null }),
    }),
    {
      name: 'budgetos_health',
      partialize: (state) => ({ result: state.result, lastComputed: state.lastComputed }),
    },
  ),
);
