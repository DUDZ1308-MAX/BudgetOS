import { create } from 'zustand';
import type { FinancialHealthResult } from '@/intelligence/types';

interface HealthState {
  result: FinancialHealthResult | null;
  loading: boolean;
  error: string | null;
  lastComputed: number | null;
  setResult: (result: FinancialHealthResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  result: null,
  loading: false,
  error: null,
  lastComputed: null,
  setResult: (result) => set({ result, lastComputed: Date.now(), loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));
