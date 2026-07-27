import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import {
  getNotifications,
  createNotification,
  createNotificationsBatch,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  deleteNotification,
  getUnreadNotificationCount,
} from '@budgetos/database';
import type { NotificationInsert } from '@budgetos/database';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const res = await getNotifications(supabase, user!.id);
      return res.data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useUnreadNotificationCount() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['notifications', 'unread', user?.id],
    queryFn: async () => {
      const res = await getUnreadNotificationCount(supabase, user!.id);
      return (res as any)?.count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (data: NotificationInsert) => {
      const res = await createNotification(supabase, user!.id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.id] });
    },
  });
}

export function useCreateNotificationsBatch() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (items: NotificationInsert[]) => {
      await createNotificationsBatch(supabase, user!.id, items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.id] });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await markNotificationRead(supabase, notificationId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.id] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      await markAllNotificationsRead(supabase, user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.id] });
    },
  });
}

export function useArchiveNotification() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await archiveNotification(supabase, notificationId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.id] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await deleteNotification(supabase, notificationId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.id] });
    },
  });
}
