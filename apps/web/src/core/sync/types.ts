export type SyncStatus = 'idle' | 'syncing' | 'online' | 'offline' | 'error';

export type SyncEntity =
  | 'account'
  | 'category'
  | 'transaction'
  | 'budget'
  | 'savings_goal'
  | 'contribution'
  | 'mortgage'
  | 'extra_payment';

export type SyncAction = 'create' | 'update' | 'delete';

export interface SyncEntry {
  id: string;
  entity: SyncEntity;
  action: SyncAction;
  entityId: string;
  payload: Record<string, unknown>;
  timestamp: string;
  retries: number;
  version?: number;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncTime: string | null;
  pendingCount: number;
  error: string | null;
}

export interface ConflictLog {
  entity: SyncEntity;
  entityId: string;
  localTimestamp: string;
  remoteTimestamp: string;
  resolution: 'local_won' | 'remote_won';
  resolvedAt: string;
}
