import type { EngineTransaction, EngineAccount, CashFlowSummary, DailyBalance } from './types';

function calculateIncomeVsExpenseRatio(totalIncome: number, totalExpenses: number): number {
  if (totalExpenses === 0) return totalIncome > 0 ? Infinity : 0;
  return totalIncome / totalExpenses;
}

export function computeCashFlowSummary(input: {
  transactions: EngineTransaction[];
  accounts: EngineAccount[];
}): CashFlowSummary {
  const activeTransactions = (input.transactions ?? []).filter((t) => !t.is_archived);

  const dailyMap = new Map<string, { income: number; expenses: number }>();
  const allTxns = [...activeTransactions].sort((a, b) => a.date.localeCompare(b.date));

  for (const t of allTxns) {
    const day = dailyMap.get(t.date) || { income: 0, expenses: 0 };
    if (t.amount > 0) {
      day.income += Math.abs(t.amount);
    } else {
      day.expenses += Math.abs(t.amount);
    }
    dailyMap.set(t.date, day);
  }

  const initialBalance = (input.accounts ?? [])
    .filter((a) => a.is_active)
    .reduce((s, a) => s + a.balance, 0);

  const sortedDays = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  const dailyBalances: DailyBalance[] = [];
  let running = initialBalance;

  for (const [date, { income, expenses }] of sortedDays) {
    running = running + income - expenses;
    dailyBalances.push({ date, income, expenses, runningBalance: running, net: income - expenses });
  }

  const totalIncome = allTxns.filter((t) => t.amount > 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpenses = allTxns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const netFlow = totalIncome - totalExpenses;

  // Calculate 7-day and 30-day trends
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDayTxns = allTxns.filter((t) => {
    const d = new Date(t.date);
    return d >= sevenDaysAgo && d <= now;
  });
  const thirtyDayTxns = allTxns.filter((t) => {
    const d = new Date(t.date);
    return d >= thirtyDaysAgo && d <= now;
  });

  const sevenDayIncome = sevenDayTxns.filter((t) => t.amount > 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const sevenDayExpenses = sevenDayTxns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const sevenDayTrend = sevenDayIncome - sevenDayExpenses;

  const thirtyDayIncome = thirtyDayTxns.filter((t) => t.amount > 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const thirtyDayExpenses = thirtyDayTxns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const thirtyDayTrend = thirtyDayIncome - thirtyDayExpenses;

  const incomeVsExpenseRatio = calculateIncomeVsExpenseRatio(totalIncome, totalExpenses);

  return {
    dailyBalances,
    totalIncome,
    totalExpenses,
    netFlow,
    sevenDayTrend,
    thirtyDayTrend,
    incomeVsExpenseRatio,
  };
}
