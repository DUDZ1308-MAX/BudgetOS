export interface ConsistencyIssue {
  severity: 'error' | 'warning';
  entity: string;
  message: string;
  autoRepairable: boolean;
  repair?: () => void;
}

export type ConsistencyReporter = (issues: ConsistencyIssue[]) => void;

export function checkTransactionConsistency(
  transactions: { id: string; account_id: string | null; category_id: string | null }[],
  accountIds: Set<string>,
  categoryIds: Set<string>,
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  for (const txn of transactions) {
    if (txn.account_id && !accountIds.has(txn.account_id)) {
      issues.push({
        severity: 'warning',
        entity: `transaction:${txn.id}`,
        message: `Transaction ${txn.id} references missing account ${txn.account_id}`,
        autoRepairable: false,
      });
    }
  }
  return issues;
}

export function checkBudgetConsistency(
  budgets: { id: string; category_id: string; amount: number; spent?: number }[],
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  for (const b of budgets) {
    if (typeof b.spent === 'number' && b.spent > b.amount * 1.5) {
      issues.push({
        severity: 'warning',
        entity: `budget:${b.id}`,
        message: `Budget ${b.id} spent ${b.spent} vs budgeted ${b.amount} (over 150%)`,
        autoRepairable: false,
      });
    }
  }
  return issues;
}

export function checkSavingsConsistency(
  goals: { id: string; target_amount: number; current_amount: number }[],
  contributions: { goal_id: string; amount: number }[],
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const contribByGoal = new Map<string, number>();
  for (const c of contributions) {
    contribByGoal.set(c.goal_id, (contribByGoal.get(c.goal_id) ?? 0) + c.amount);
  }
  for (const goal of goals) {
    const contribTotal = contribByGoal.get(goal.id) ?? 0;
    if (goal.current_amount > goal.target_amount) {
      issues.push({
        severity: 'warning',
        entity: `savings_goal:${goal.id}`,
        message: `Goal "${goal.id}" current (${goal.current_amount}) exceeds target (${goal.target_amount})`,
        autoRepairable: true,
      });
    }
    if (contribTotal > 0 && Math.abs(contribTotal - goal.current_amount) > 0.01) {
      issues.push({
        severity: 'error',
        entity: `savings_goal:${goal.id}`,
        message: `Goal "${goal.id}" current_amount (${goal.current_amount}) differs from contribution total (${contribTotal})`,
        autoRepairable: true,
      });
    }
  }
  return issues;
}

export function checkMortgageConsistency(
  mortgages: { id: string; principal: number }[],
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  for (const m of mortgages) {
    if (m.principal <= 0) {
      issues.push({
        severity: 'error',
        entity: `mortgage:${m.id}`,
        message: `Mortgage "${m.id}" has non-positive principal (${m.principal})`,
        autoRepairable: false,
      });
    }
  }
  return issues;
}

export function runAllChecks(
  transactions: { id: string; account_id: string | null; category_id: string | null }[],
  accounts: { id: string }[],
  categories: { id: string }[],
  budgets: { id: string; category_id: string; amount: number; spent?: number }[],
  savingsGoals: { id: string; target_amount: number; current_amount: number }[],
  contributions: { goal_id: string; amount: number }[],
  mortgages: { id: string; principal: number }[],
): ConsistencyIssue[] {
  const accountIds = new Set(accounts.map((a) => a.id));
  const categoryIds = new Set(categories.map((c) => c.id));
  return [
    ...checkTransactionConsistency(transactions, accountIds, categoryIds),
    ...checkBudgetConsistency(budgets),
    ...checkSavingsConsistency(savingsGoals, contributions),
    ...checkMortgageConsistency(mortgages),
  ];
}
