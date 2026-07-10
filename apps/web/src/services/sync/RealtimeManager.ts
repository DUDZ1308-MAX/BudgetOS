import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';
export type RealtimePayload = { event: RealtimeEvent; entityType: string; data: Record<string, unknown>; old?: Record<string, unknown> };
export type RealtimeCallback = (payload: RealtimePayload) => void;

interface TableSubscription {
  table: string;
  channelName: string;
  channel: RealtimeChannel;
  callback: RealtimeCallback;
}

const entityTableMap: Record<string, string> = {
  account: 'accounts',
  category: 'categories',
  transaction: 'transactions',
  budget: 'budgets',
  savings_goal: 'savings_goals',
  contribution: 'contributions',
  mortgage: 'mortgages',
  extra_payment: 'extra_payments',
};

export class RealtimeManager {
  private subscriptions: Map<string, TableSubscription> = new Map();
  private userId: string | null = null;
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  setUserId(userId: string | null): void {
    const changed = this.userId !== userId;
    this.userId = userId;
    if (changed && userId) this.resubscribeAll();
  }

  subscribe(entityType: string, callback: RealtimeCallback): () => void {
    const table = entityTableMap[entityType];
    if (!table || !this.userId) return () => {};

    const channelName = `${table}-${this.userId}`;

    if (this.subscriptions.has(channelName)) {
      const existing = this.subscriptions.get(channelName)!;
      const prevCb = existing.callback;
      existing.callback = (payload) => {
        prevCb(payload);
        callback(payload);
      };
      return () => this.unsubscribe(entityType);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${this.userId}` },
        (payload) => {
          const eventType = payload.eventType.toUpperCase();
          if (eventType !== 'INSERT' && eventType !== 'UPDATE' && eventType !== 'DELETE') return;
          const p: RealtimePayload = {
            event: eventType as RealtimeEvent,
            entityType,
            data: (payload.new as Record<string, unknown>) ?? {},
            old: (payload.old as Record<string, unknown>) ?? undefined,
          };
          callback(p);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.clearRetry(channelName);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.scheduleRetry(channelName, entityType, callback);
        }
      });

    this.subscriptions.set(channelName, { table, channelName, channel, callback });
    return () => this.unsubscribe(entityType);
  }

  subscribeAll(callback: RealtimeCallback): () => void {
    const unsubs: (() => void)[] = [];
    for (const entityType of Object.keys(entityTableMap)) {
      unsubs.push(this.subscribe(entityType, callback));
    }
    return () => unsubs.forEach((fn) => fn());
  }

  unsubscribe(entityType: string): void {
    const table = entityTableMap[entityType];
    if (!table || !this.userId) return;
    const channelName = `${table}-${this.userId}`;
    this.removeSubscription(channelName);
  }

  unsubscribeAll(): void {
    for (const [channelName] of this.subscriptions) {
      this.removeSubscription(channelName);
    }
  }

  getActiveCount(): number {
    return this.subscriptions.size;
  }

  isSubscribed(entityType: string): boolean {
    const table = entityTableMap[entityType];
    if (!table || !this.userId) return false;
    return this.subscriptions.has(`${table}-${this.userId}`);
  }

  private removeSubscription(channelName: string): void {
    const sub = this.subscriptions.get(channelName);
    if (sub) {
      supabase.removeChannel(sub.channel);
      this.subscriptions.delete(channelName);
    }
    this.clearRetry(channelName);
  }

  private resubscribeAll(): void {
    const subs = Array.from(this.subscriptions.entries());
    for (const [channelName] of subs) {
      this.removeSubscription(channelName);
    }
    for (const [entityType] of Object.entries(entityTableMap)) {
      this.subscribe(entityType, () => {});
    }
  }

  private scheduleRetry(channelName: string, entityType: string, callback: RealtimeCallback): void {
    this.clearRetry(channelName);
    if (!this.userId) return;
    const timer = setTimeout(() => {
      this.retryTimers.delete(channelName);
      this.subscribe(entityType, callback);
    }, 5000);
    this.retryTimers.set(channelName, timer);
  }

  private clearRetry(channelName: string): void {
    const timer = this.retryTimers.get(channelName);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(channelName);
    }
  }

  destroy(): void {
    this.unsubscribeAll();
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }
    this.retryTimers.clear();
  }
}

export const realtimeManager = new RealtimeManager();
