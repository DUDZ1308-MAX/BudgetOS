import { create } from 'zustand';
import type { Category } from '@budgetos/database';

function deduplicate(categories: Category[]): Category[] {
  const seen = new Set<string>();
  const seenNames = new Set<string>();
  const result: Category[] = [];
  for (const cat of categories) {
    if (!cat?.id) continue;
    const idKey = cat.id.trim().toLowerCase();
    if (seen.has(idKey)) continue;
    seen.add(idKey);
    const nameKey = cat.name.trim().toLowerCase();
    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);
    result.push(cat);
  }
  return result;
}

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  setCategories: (categories: Category[]) => void;
  appendCategory: (category: Category) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

const initialState = {
  categories: [],
  isLoading: false,
  error: null,
};

export const useCategoryStore = create<CategoriesState>((set) => ({
  ...initialState,
  setCategories: (categories) => {
    const deduped = deduplicate(categories);
    set({ categories: deduped, isLoading: false, error: null });
  },
  appendCategory: (category) => {
    if (!category?.id) return;
    set((s) => {
      const existing = s.categories.find((c) => c.id === category.id);
      if (existing) return s;
      return { categories: [...s.categories, category] };
    });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clear: () => set({ ...initialState }),
}));
