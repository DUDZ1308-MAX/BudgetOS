import type {
  CategoryBudget,
  TransactionSummary,
  Rollover,
  CategoryBudgetResult,
  OverallBudgetSummary,
} from '@budgetos/shared';

export interface BudgetInput {
  budgets: CategoryBudget[];
  transactions: TransactionSummary[];
  previousMonthRollovers: Rollover[];
  totalIncome: number;
}

export type { CategoryBudget, TransactionSummary, Rollover, CategoryBudgetResult, OverallBudgetSummary };
