import { create } from 'zustand';
import { useAuditStore, type AuditEntry } from '@/core/audit';

export type UserStatus = 'active' | 'suspended' | 'disabled';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  status: UserStatus;
  subscriptionTier: string;
  createdAt: string;
  lastActiveAt: string;
  isAdmin: boolean;
}

export interface SystemHealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  updatedAt: string;
}

const DEFAULT_HEALTH_METRICS: SystemHealthMetric[] = [
  { name: 'API Response Time', value: 145, unit: 'ms', status: 'healthy', updatedAt: new Date().toISOString() },
  { name: 'Error Rate (24h)', value: 0.02, unit: '%', status: 'healthy', updatedAt: new Date().toISOString() },
  { name: 'Active Users', value: 0, unit: 'users', status: 'healthy', updatedAt: new Date().toISOString() },
  { name: 'Storage Used', value: 0, unit: 'MB', status: 'healthy', updatedAt: new Date().toISOString() },
  { name: 'AI Requests (24h)', value: 0, unit: 'requests', status: 'healthy', updatedAt: new Date().toISOString() },
  { name: 'Sync Queue Size', value: 0, unit: 'items', status: 'healthy', updatedAt: new Date().toISOString() },
];

interface AdminState {
  users: AdminUser[];
  healthMetrics: SystemHealthMetric[];
  auditLogFilter: { action?: string; entity?: string; search?: string };
  isAdminUser: boolean;
  addUser: (user: AdminUser) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  setUsers: (users: AdminUser[]) => void;
  updateHealthMetric: (name: string, updates: Partial<SystemHealthMetric>) => void;
  setHealthMetrics: (metrics: SystemHealthMetric[]) => void;
  setAuditLogFilter: (filter: { action?: string; entity?: string; search?: string }) => void;
  clearAuditLogFilter: () => void;
  getFilteredAuditLog: () => AuditEntry[];
  setIsAdminUser: (isAdmin: boolean) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  healthMetrics: DEFAULT_HEALTH_METRICS,
  auditLogFilter: {},
  isAdminUser: false,

  addUser: (user) => set((s) => ({ users: [...s.users.filter((u) => u.id !== user.id), user] })),
  updateUserStatus: (userId, status) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === userId ? { ...u, status } : u)),
    })),
  setUsers: (users) => set({ users }),
  updateHealthMetric: (name, updates) =>
    set((s) => ({
      healthMetrics: s.healthMetrics.map((m) =>
        m.name === name ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m,
      ),
    })),
  setHealthMetrics: (metrics) => set({ healthMetrics: metrics }),
  setAuditLogFilter: (filter) => set({ auditLogFilter: filter }),
  clearAuditLogFilter: () => set({ auditLogFilter: {} }),
  getFilteredAuditLog: () => {
    const { entries } = useAuditStore.getState();
    const filter = get().auditLogFilter;
    return entries.filter((e) => {
      if (filter.action && e.action !== filter.action) return false;
      if (filter.entity && e.entity !== filter.entity) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        if (!e.description.toLowerCase().includes(q) && !e.entityId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },
  setIsAdminUser: (isAdmin) => set({ isAdminUser: isAdmin }),
}));
