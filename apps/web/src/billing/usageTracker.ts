export type UsageAction = 'ai_request' | 'export_csv' | 'export_pdf_excel' | 'export_json';

export interface UsageRecord {
  action: UsageAction;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_PREFIX = 'budgetos_usage_';

function getStorageKey(userId: string, month: string): string {
  return `${STORAGE_PREFIX}${userId}_${month}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function trackUsage(userId: string, action: UsageAction, metadata?: Record<string, unknown>): void {
  const month = getCurrentMonth();
  const key = getStorageKey(userId, month);

  try {
    const raw = localStorage.getItem(key);
    const records: UsageRecord[] = raw ? JSON.parse(raw) : [];
    records.push({ action, timestamp: new Date().toISOString(), metadata });
    localStorage.setItem(key, JSON.stringify(records));
  } catch {
    // storage full or disabled
  }
}

export function getUsageCount(userId: string, action: UsageAction): number {
  const month = getCurrentMonth();
  const key = getStorageKey(userId, month);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const records: UsageRecord[] = JSON.parse(raw);
    return records.filter((r) => r.action === action).length;
  } catch {
    return 0;
  }
}

export function getTotalUsageCount(userId: string): number {
  const month = getCurrentMonth();
  const key = getStorageKey(userId, month);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const records: UsageRecord[] = JSON.parse(raw);
    return records.length;
  } catch {
    return 0;
  }
}

export function getUsageByAction(userId: string): Record<UsageAction, number> {
  const month = getCurrentMonth();
  const key = getStorageKey(userId, month);

  const counts: Record<UsageAction, number> = {
    ai_request: 0,
    export_csv: 0,
    export_pdf_excel: 0,
    export_json: 0,
  };

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return counts;
    const records: UsageRecord[] = JSON.parse(raw);
    for (const record of records) {
      if (counts[record.action] !== undefined) {
        counts[record.action]++;
      }
    }
  } catch {
    // ignore
  }

  return counts;
}

export function getUsageHistory(userId: string, months: number = 3): Record<string, Record<UsageAction, number>> {
  const result: Record<string, Record<UsageAction, number>> = {};
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const storageKey = getStorageKey(userId, monthKey);

    const counts: Record<UsageAction, number> = {
      ai_request: 0,
      export_csv: 0,
      export_pdf_excel: 0,
      export_json: 0,
    };

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const records: UsageRecord[] = JSON.parse(raw);
        for (const record of records) {
          if (counts[record.action] !== undefined) {
            counts[record.action]++;
          }
        }
      }
    } catch {
      // ignore
    }

    result[monthKey] = counts;
  }

  return result;
}

export function resetUsage(userId: string): void {
  const month = getCurrentMonth();
  const key = getStorageKey(userId, month);
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function hasReachedLimit(userId: string, action: UsageAction, limit: number): boolean {
  if (limit === Infinity || limit <= 0) return false;
  return getUsageCount(userId, action) >= limit;
}
