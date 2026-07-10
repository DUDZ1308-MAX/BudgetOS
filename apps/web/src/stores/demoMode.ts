import { create } from 'zustand';
import { demoData, type DemoData } from '@/data/demoData';

interface DemoStore {
  isDemo: boolean;
  demoData: DemoData | null;
  enterDemo: () => void;
  exitDemo: () => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  isDemo: false,
  demoData: null,
  enterDemo: () => set({ isDemo: true, demoData }),
  exitDemo: () => set({ isDemo: false, demoData: null }),
}));
