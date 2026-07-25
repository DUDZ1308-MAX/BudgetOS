export interface NetWorth3DData {
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface CashFlow3DData {
  income: number;
  expenses: number;
  savings: number;
  remaining: number;
}

export interface SpendingCategory3D {
  name: string;
  amount: number;
  color: string;
  percent: number;
}

export interface BudgetProgress3DData {
  budgeted: number;
  spent: number;
  remaining: number;
  label: string;
  percentUsed: number;
}

export interface FinancialHealth3DData {
  score: number;
  maxScore: number;
  label: string;
  components: Array<{ label: string; score: number; maxScore: number; color: string }>;
}

export type ViewMode = '2d' | '3d';
