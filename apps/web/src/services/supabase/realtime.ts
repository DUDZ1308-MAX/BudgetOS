import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeCallback = (payload: Record<string, unknown>) => void;

const activeChannels = new Map<string, RealtimeChannel>();

export function subscribeToTable(
  table: string,
  userId: string,
  onChange: RealtimeCallback,
): () => void {
  const channelName = `${table}-${userId}`;

  if (activeChannels.has(channelName)) {
    return () => unsubscribeFromTable(channelName);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
      (payload) => {
        onChange(payload as unknown as Record<string, unknown>);
      },
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  return () => unsubscribeFromTable(channelName);
}

function unsubscribeFromTable(channelName: string): void {
  const channel = activeChannels.get(channelName);
  if (channel) {
    supabase.removeChannel(channel);
    activeChannels.delete(channelName);
  }
}

export function unsubscribeAll(): void {
  for (const [name] of activeChannels) {
    unsubscribeFromTable(name);
  }
}

export function getActiveSubscriptionCount(): number {
  return activeChannels.size;
}
