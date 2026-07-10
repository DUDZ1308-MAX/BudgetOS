import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useCategoryStore } from '@/stores/categories';
import { getCategories, getCategory, createCategory, updateCategory, seedDefaultCategories } from '@budgetos/database';
import type { CategoryInsert, CategoryUpdate } from '@budgetos/database';

function deduplicate<T extends { id: string; name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const seenNames = new Set<string>();
  return items.filter((item) => {
    if (!item?.id) return false;
    const idKey = item.id.toLowerCase();
    if (seen.has(idKey)) return false;
    seen.add(idKey);
    const nameKey = item.name.trim().toLowerCase();
    if (seenNames.has(nameKey)) return false;
    seenNames.add(nameKey);
    return true;
  });
}

export function useCategories() {
  const user = useAuthStore((s) => s.user);
  const setCategories = useCategoryStore((s) => s.setCategories);
  const setLoading = useCategoryStore((s) => s.setLoading);
  const setError = useCategoryStore((s) => s.setError);

  return useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      setLoading(true);
      try {
        let res = await getCategories(supabase, user!.id);
        if (res.data && res.data.length === 0) {
          await seedDefaultCategories(supabase, user!.id);
          res = await getCategories(supabase, user!.id);
        }
        const deduped = deduplicate(res.data ?? []);
        setCategories(deduped);
        return deduped;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
        throw err;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCategory(categoryId: string | undefined) {
  const setLoading = useCategoryStore((s) => s.setLoading);

  return useQuery({
    queryKey: ['categories', categoryId],
    queryFn: async () => {
      setLoading(true);
      const res = await getCategory(supabase, categoryId!);
      return res.data;
    },
    enabled: !!categoryId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const appendCategory = useCategoryStore((s) => s.appendCategory);

  return useMutation({
    mutationFn: async (data: CategoryInsert) => {
      const res = await createCategory(supabase, user!.id, data);
      return res.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
      if (created) appendCategory(created);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setCategories = useCategoryStore((s) => s.setCategories);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryUpdate }) => {
      const res = await updateCategory(supabase, id, data);
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
      if (updated) {
        const current = useCategoryStore.getState().categories;
        const next = current.map((c) => c.id === updated.id ? { ...c, ...updated } : c);
        setCategories(next);
      }
    },
  });
}
