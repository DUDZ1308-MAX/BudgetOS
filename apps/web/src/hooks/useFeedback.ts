import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useFeedbackStore } from '@/stores/feedback';
import {
  getFeedback,
  createFeedback,
  deleteFeedback,
} from '@budgetos/database';
import type { FeedbackInsert } from '@budgetos/database';
import { logger } from '@/core/logger';

export function useFeedback() {
  const user = useAuthStore((s) => s.user);
  const { setFeedback, setLoading, setError } = useFeedbackStore();

  return useQuery({
    queryKey: ['feedback', user?.id],
    queryFn: async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getFeedback(supabase, user!.id);
        if (res.error) {
          setError(res.error.message);
          return [];
        }
        setFeedback(res.data ?? []);
        return res.data ?? [];
      } catch (err) {
        logger.error('Failed to fetch feedback', 'useFeedback', err);
        setError('Failed to load feedback');
        return [];
      } finally {
        setLoading(false);
      }
    },
    enabled: !!user,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { addFeedback } = useFeedbackStore();

  return useMutation({
    mutationFn: async (data: FeedbackInsert) => {
      const res = await createFeedback(supabase, user!.id, data);
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['feedback', user?.id] });
      if (created) {
        addFeedback(created);
      }
    },
    onError: (err) => {
      logger.error('Feedback creation failed', 'useCreateFeedback', err);
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { removeFeedback } = useFeedbackStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteFeedback(supabase, id);
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['feedback', user?.id] });
      removeFeedback(id);
    },
    onError: (err) => {
      logger.error('Feedback deletion failed', 'useDeleteFeedback', err);
    },
  });
}
