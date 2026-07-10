export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
}

export type PageMeta = {
  title: string;
  description: string;
};

// ============================================================
// Dashboard types
// ============================================================

export interface DashboardStats {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  remainingCash: number;
  accountCount: number;
}

export interface AccountSummary {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface TransactionSummary {
  id: string;
  amount: number;
  date: string;
  merchant: string | null;
  categoryName: string | null;
  accountName: string | null;
}

import type { Insight, SafeToSpendResult } from '@/engine/types';

export interface DashboardData {
  stats: DashboardStats;
  accounts: AccountSummary[];
  recentTransactions: TransactionSummary[];
  insights: Insight[];
  safeToSpend: SafeToSpendResult;
}
