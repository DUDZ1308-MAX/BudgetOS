export type EventType =
  | 'transaction:created'
  | 'transaction:updated'
  | 'transaction:deleted'
  | 'budget:created'
  | 'budget:updated'
  | 'savings:created'
  | 'savings:updated'
  | 'savings:deleted'
  | 'mortgage:created'
  | 'mortgage:updated'
  | 'mortgage:deleted'
  | 'account:created'
  | 'account:updated'
  | 'account:archived'
  | 'category:created'
  | 'category:updated';

export interface EventPayload {
  entityId: string;
  entityType: string;
  before?: unknown;
  after?: unknown;
  userId?: string | null;
}

type EventHandler = (payload: EventPayload) => void;

const listeners = new Map<EventType, Set<EventHandler>>();

export function onEvent(type: EventType, handler: EventHandler): () => void {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type)!.add(handler);
  return () => { listeners.get(type)?.delete(handler); };
}

export function emitEvent(type: EventType, payload: EventPayload): void {
  const handlers = listeners.get(type);
  if (!handlers) return;
  for (const handler of handlers) {
    try { handler(payload); } catch { /* swallow handler errors */ }
  }
}

export function offEvent(type: EventType, handler: EventHandler): void {
  listeners.get(type)?.delete(handler);
}

export function clearAllListeners(): void {
  listeners.clear();
}
