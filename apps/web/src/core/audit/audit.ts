import { create } from 'zustand';

export type AuditAction = 'create' | 'update' | 'delete' | 'archive' | 'restore';
export type AuditEntity = 'transaction' | 'account' | 'budget' | 'category' | 'savings_goal' | 'contribution' | 'mortgage' | 'extra_payment' | 'recurring_transaction';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  timestamp: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  userId: string | null;
  description: string;
}

interface AuditState {
  entries: AuditEntry[];
  maxEntries: number;
  addEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  getRecent: (count?: number) => AuditEntry[];
  getByEntity: (entity: AuditEntity, entityId: string) => AuditEntry[];
  getByAction: (action: AuditAction) => AuditEntry[];
  clear: () => void;
}

let counter = 0;

export const useAuditStore = create<AuditState>((set, get) => ({
  entries: [],
  maxEntries: 5000,
  addEntry: (entry) => {
    const auditEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${++counter}`,
      timestamp: new Date().toISOString(),
    };
    set((s) => {
      const next = [auditEntry, ...s.entries];
      if (next.length > s.maxEntries) next.length = s.maxEntries;
      return { entries: next };
    });
  },
  getRecent: (count = 50) => get().entries.slice(0, count),
  getByEntity: (entity, entityId) =>
    get().entries.filter((e) => e.entity === entity && e.entityId === entityId),
  getByAction: (action) =>
    get().entries.filter((e) => e.action === action),
  clear: () => set({ entries: [] }),
}));
