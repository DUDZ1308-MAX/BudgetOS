import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getQueue, removeFromQueue, incrementRetry, clearQueue } from './queue';
import type { SyncStatus, ConflictLog, SyncEntity } from './types';

export type SyncProgressCallback = (status: SyncStatus, error?: string) => void;

const SYNC_TIME_KEY = 'budgetos-last-sync';

export function getLastSyncTime(): string | null {
  return localStorage.getItem(SYNC_TIME_KEY);
}

function setLastSyncTime(): void {
  localStorage.setItem(SYNC_TIME_KEY, new Date().toISOString());
}

const conflictLog: ConflictLog[] = [];

export function getConflictLog(): ConflictLog[] {
  return conflictLog;
}

interface TableInfo {
  table: string;
  columns: string;
}

const entityTableMap: Record<string, TableInfo> = {
  account: { table: 'accounts', columns: 'id,user_id,name,type,balance,currency,is_active,created_at,updated_at' },
  category: { table: 'categories', columns: 'id,user_id,name,type,icon,color,is_archived,created_at,updated_at' },
  transaction: { table: 'transactions', columns: 'id,user_id,account_id,category_id,amount,date,merchant,note,is_archived,recurring_id,created_at,updated_at' },
  budget: { table: 'budgets', columns: 'id,user_id,category_id,year,month,amount,rollover,created_at,updated_at' },
  savings_goal: { table: 'savings_goals', columns: 'id,user_id,name,target_amount,current_amount,target_date,priority,status,created_at,updated_at' },
  contribution: { table: 'contributions', columns: 'id,user_id,goal_id,amount,date,notes,created_at,updated_at' },
  mortgage: { table: 'mortgages', columns: 'id,user_id,name,principal,annual_rate,term_years,start_date,extra_payment,is_active,created_at,updated_at' },
  extra_payment: { table: 'extra_payments', columns: 'id,user_id,mortgage_id,amount,date,notes,created_at,updated_at' },
};

async function uploadEntry(entry: { entity: SyncEntity; entityId: string; action: string; payload: Record<string, unknown> }): Promise<{ ok: boolean; error?: string }> {
  const info = entityTableMap[entry.entity];
  if (!info) return { ok: false, error: `Unknown entity: ${entry.entity}` };

  try {
    if (entry.action === 'delete') {
      const { error } = await supabase
        .from(info.table)
        .delete()
        .eq('id', entry.entityId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }

    let payload = { ...entry.payload };

    if (entry.action === 'update') {
      const { error } = await supabase
        .from(info.table)
        .update(payload)
        .eq('id', entry.entityId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }

    if (entry.entity === 'transaction' && payload.account_id) {
      const { data: acct } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', payload.account_id)
        .maybeSingle();
      if (!acct) {
        payload = { ...payload, account_id: null };
      }
    }

    const { error } = await supabase
      .from(info.table)
      .insert(payload)
      .select('id')
      .single();
    if (error) {
      if (error.code === '23505') return { ok: true };
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

export async function uploadLocalChanges(onProgress?: SyncProgressCallback): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  onProgress?.('syncing');

  for (const entry of queue) {
    const result = await uploadEntry(entry);
    if (result.ok) {
      removeFromQueue(entry.id);
    } else {
      incrementRetry(entry.id);
      if (entry.retries >= 4) {
        onProgress?.('error', result.error);
      }
    }
  }
}

function resolveConflict(
  localItem: Record<string, unknown>,
  remoteItem: Record<string, unknown>,
  id: string,
  entity: string,
  conflicts: ConflictLog[],
): Record<string, unknown> {
  const localUpdated = localItem.updated_at as string | undefined;
  const remoteUpdated = remoteItem.updated_at as string | undefined;
  const localVersion = (localItem.version as number) ?? 0;
  const remoteVersion = (remoteItem.version as number) ?? 0;

  if (localVersion > remoteVersion) {
    conflicts.push({ entity: entity as any, entityId: id, localTimestamp: localUpdated ?? '', remoteTimestamp: remoteUpdated ?? '', resolution: 'local_won', resolvedAt: new Date().toISOString() });
    return localItem;
  }

  if (remoteVersion > localVersion) {
    conflicts.push({ entity: entity as any, entityId: id, localTimestamp: localUpdated ?? '', remoteTimestamp: remoteUpdated ?? '', resolution: 'remote_won', resolvedAt: new Date().toISOString() });
    return remoteItem;
  }

  if (!localUpdated && !remoteUpdated) return remoteItem;

  if (localUpdated && remoteUpdated) {
    if (remoteUpdated > localUpdated) {
      conflicts.push({ entity: entity as any, entityId: id, localTimestamp: localUpdated, remoteTimestamp: remoteUpdated, resolution: 'remote_won', resolvedAt: new Date().toISOString() });
      return remoteItem;
    }
    conflicts.push({ entity: entity as any, entityId: id, localTimestamp: localUpdated, remoteTimestamp: remoteUpdated, resolution: 'local_won', resolvedAt: new Date().toISOString() });
    return localItem;
  }

  return remoteItem;
}

export function mergeRemoteData(
  local: Record<string, unknown>[],
  remote: Record<string, unknown>[],
  entity: string,
  idKey: string = 'id',
): { merged: Record<string, unknown>[]; conflicts: ConflictLog[] } {
  const localMap = new Map<string, Record<string, unknown>>();
  const conflicts: ConflictLog[] = [];

  for (const item of local) {
    const id = item[idKey] as string;
    localMap.set(id, item);
  }

  for (const remoteItem of remote) {
    const id = remoteItem[idKey] as string;
    const localItem = localMap.get(id);

    if (!localItem) {
      localMap.set(id, remoteItem);
      continue;
    }

    localMap.set(id, resolveConflict(localItem, remoteItem, id, entity, conflicts));
  }

  return { merged: Array.from(localMap.values()), conflicts };
}

export async function downloadCloudData(
  userId: string,
  onProgress?: SyncProgressCallback,
): Promise<Record<string, unknown[]>> {
  const result: Record<string, unknown[]> = {};

  for (const [entity, info] of Object.entries(entityTableMap)) {
    try {
      const { data, error } = await supabase
        .from(info.table)
        .select(info.columns)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        onProgress?.('error', `Failed to download ${entity}: ${error.message}`);
        continue;
      }
      result[entity] = data ?? [];
    } catch (err) {
      onProgress?.('error', `Failed to download ${entity}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      result[entity] = [];
    }
  }

  return result;
}

export async function runFullSync(
  userId: string,
  localData: Record<string, unknown[]>,
  onProgress?: SyncProgressCallback,
): Promise<{ cloudData: Record<string, unknown[]>; conflicts: ConflictLog[] }> {
  onProgress?.('syncing');

  await uploadLocalChanges(onProgress);

  const cloudData = await downloadCloudData(userId, onProgress);

  const allConflicts: ConflictLog[] = [];

  for (const [entity, remoteItems] of Object.entries(cloudData)) {
    const localItems = (localData[entity] ?? []) as Record<string, unknown>[];
    const { merged, conflicts } = mergeRemoteData(localItems, remoteItems as Record<string, unknown>[], entity);
    cloudData[entity] = merged;
    allConflicts.push(...conflicts);
  }

  if (allConflicts.length > 0) {
    conflictLog.push(...allConflicts);
    if (import.meta.env.DEV) console.debug('[Sync] Conflicts resolved:', allConflicts.length);
  }

  setLastSyncTime();
  onProgress?.('online');

  return { cloudData, conflicts: allConflicts };
}

export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
