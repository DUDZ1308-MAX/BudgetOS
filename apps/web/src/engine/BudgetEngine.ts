import type { BudgetSummary, BudgetEngineInput, CategoryBreakdown, CategoryBudgetStatus, Alert } from './types';
import { daysBetween, categorizeAccountType, parseDate, daysInMonth } from './utils';

export function computeBudgetSummary(input: BudgetEngineInput): BudgetSummary {
  if (!input) return createEmptyBudgetSummary();
  const { transactions = [], accounts = [], categories = [], budgets = [], dateRange } = input;
  const start = dateRange?.start || '';
  const end = dateRange?.end || '';

  if (!start || !end) return createEmptyBudgetSummary();

  const startDate = parseDate(start);
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1;

  let totalIncome = 0;
  let totalExpenses = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  const expenseByCategory = new Map<string | null, { amount: number; count: number }>();

  for (const txn of transactions) {
    if (txn.is_archived) continue;
    if (txn.date < start || txn.date > end) continue;

    if (txn.amount >= 0) {
      totalIncome += txn.amount;
      incomeCount++;
    } else {
      totalExpenses += txn.amount;
      expenseCount++;
      const catId = txn.category_id;
      const existing = expenseByCategory.get(catId);
      if (existing) {
        existing.amount += txn.amount;
        existing.count++;
      } else {
        expenseByCategory.set(catId, { amount: txn.amount, count: 1 });
      }
    }
  }

  const absTotalExpenses = Math.abs(totalExpenses);
  const netIncome = totalIncome - absTotalExpenses;
  const dayCount = daysBetween(start, end);
  const averageDailyIncome = dayCount > 0 ? totalIncome / dayCount : 0;
  const averageDailySpending = dayCount > 0 ? absTotalExpenses / dayCount : 0;

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat.name);
  }

  const expenseByCategoryArray: CategoryBreakdown[] = [];
  for (const [catId, data] of expenseByCategory) {
    const absAmount = Math.abs(data.amount);
    expenseByCategoryArray.push({
      categoryId: catId,
      categoryName: catId ? (categoryMap.get(catId) ?? 'Unknown') : 'Uncategorized',
      amount: absAmount,
      percentage: absTotalExpenses > 0 ? (absAmount / absTotalExpenses) * 100 : 0,
      transactionCount: data.count,
    });
  }
  expenseByCategoryArray.sort((a, b) => b.amount - a.amount);

  const budgetMap = new Map<string, { amount: number; rollover: boolean }>();
  for (const budget of budgets) {
    if (budget.year === year && budget.month === month) {
      budgetMap.set(budget.category_id, { amount: budget.amount, rollover: budget.rollover });
    }
  }

  const budgetStatuses: CategoryBudgetStatus[] = [];
  const overBudget: CategoryBudgetStatus[] = [];
  const underBudget: CategoryBudgetStatus[] = [];
  let totalBudgeted = 0;
  let totalBudgetSpent = 0;

  for (const cat of categories) {
    if (cat.type !== 'expense' || cat.is_archived) continue;
    const budget = budgetMap.get(cat.id);
    const budgeted = budget?.amount ?? 0;
    const expenseData = expenseByCategory.get(cat.id);
    const spent = expenseData ? Math.abs(expenseData.amount) : 0;

    if (budgeted > 0) {
      totalBudgeted += budgeted;
      totalBudgetSpent += spent;
      const remaining = budgeted - spent;
      const percentUsed = (spent / budgeted) * 100;

      let status: 'under' | 'on_track' | 'at_limit' | 'over';
      if (percentUsed > 100) status = 'over';
      else if (percentUsed >= 90) status = 'at_limit';
      else if (percentUsed >= 75) status = 'on_track';
      else status = 'under';

      const budgetStatus: CategoryBudgetStatus = {
        categoryId: cat.id,
        categoryName: cat.name,
        budgeted,
        spent,
        remaining,
        percentUsed,
        status,
      };

      budgetStatuses.push(budgetStatus);
      if (status === 'over') overBudget.push(budgetStatus);
      if (status === 'under' || status === 'on_track') underBudget.push(budgetStatus);
    }
  }

  const totalBudgetRemaining = totalBudgeted - totalBudgetSpent;
  const daysLeftInMonth = daysInMonth(year, month) - startDate.getDate() + 1;
  const safeToSpendToday = daysLeftInMonth > 0 && totalBudgetRemaining > 0
    ? totalBudgetRemaining / daysLeftInMonth
    : 0;

  let totalAssets = 0;
  let totalLiabilities = 0;
  let accountCount = 0;
  for (const acct of accounts) {
    if (!acct.is_active) continue;
    accountCount++;
    const acctType = categorizeAccountType(acct.type);
    if (acctType === 'asset') totalAssets += acct.balance;
    else totalLiabilities += acct.balance;
  }
  const netWorth = totalAssets + totalLiabilities;
  const remainingCash = totalAssets - Math.abs(totalLiabilities);
  const currentBalance = totalAssets + totalLiabilities;

  const projectedEndBalance = currentBalance + (netIncome / dayCount) * daysLeftInMonth;

  const surplus = Math.max(0, totalIncome * 0.2);
  const recommendedSavings = Math.min(surplus, Math.max(0, netIncome));
  const savingsRate = totalIncome > 0 ? (recommendedSavings / totalIncome) * 100 : 0;

  const alerts: Alert[] = [];

  for (const cat of budgetStatuses) {
    if (cat.status === 'over') {
      alerts.push({
        type: 'overspend',
        severity: 'high',
        message: `Overspent in ${cat.categoryName}: spent $${cat.spent.toFixed(2)} against $${cat.budgeted.toFixed(2)} budget`,
        category: cat.categoryName,
        amount: cat.spent - cat.budgeted,
      });
    } else if (cat.status === 'at_limit') {
      alerts.push({
        type: 'overspend',
        severity: 'medium',
        message: `Near budget limit in ${cat.categoryName}: used ${cat.percentUsed.toFixed(0)}% of $${cat.budgeted.toFixed(2)} budget`,
        category: cat.categoryName,
      });
    }
  }

  if (currentBalance < 0) {
    alerts.push({
      type: 'low_balance',
      severity: 'high',
      message: 'Your total account balance is negative',
      amount: currentBalance,
    });
  }

  if (totalExpenses < 0 && totalIncome > 0) {
    const expenseRatio = absTotalExpenses / totalIncome;
    if (expenseRatio > 0.9) {
      alerts.push({
        type: 'low_balance',
        severity: 'high',
        message: 'Spending exceeds 90% of income',
        amount: absTotalExpenses,
      });
    } else if (expenseRatio > 0.75) {
      alerts.push({
        type: 'low_balance',
        severity: 'medium',
        message: 'Spending exceeds 75% of income',
        amount: absTotalExpenses,
      });
    }
  }

  const avgExpense = expenseCount > 0 ? absTotalExpenses / expenseCount : 0;
  for (const cat of expenseByCategoryArray) {
    const catData = expenseByCategory.get(cat.categoryId);
    if (catData && avgExpense > 0) {
      const catAvg = cat.amount / catData.count;
      if (catAvg > avgExpense * 2 && catData.count >= 3) {
        alerts.push({
          type: 'unusual_spending',
          severity: 'medium',
          message: `Unusually high spending in ${cat.categoryName}: avg $${catAvg.toFixed(2)} per transaction`,
          category: cat.categoryName,
          amount: catAvg,
        });
      }
    }
  }

  return {
    income: {
      total: totalIncome,
      averageDaily: averageDailyIncome,
    },
    expenses: {
      total: absTotalExpenses,
      byCategory: expenseByCategoryArray,
    },
    cashFlow: {
      netIncome,
      dailySpendingAllowance: averageDailySpending,
      safeToSpendToday,
      projectedEndBalance,
    },
    budgetStatus: {
      categories: budgetStatuses,
      overBudget,
      underBudget,
      totalBudgeted,
      totalSpent: totalBudgetSpent,
      totalRemaining: totalBudgetRemaining,
    },
    accounts: {
      netWorth,
      remainingCash,
      totalAssets,
      totalLiabilities,
      accountCount,
    },
    savingsCapacity: {
      recommendedAmount: recommendedSavings,
      savingsRate,
      surplus,
    },
    alerts,
  };
}

function createEmptyBudgetSummary(): BudgetSummary {
  return {
    income: { total: 0, averageDaily: 0 },
    expenses: { total: 0, byCategory: [] },
    cashFlow: { netIncome: 0, dailySpendingAllowance: 0, safeToSpendToday: 0, projectedEndBalance: 0 },
    budgetStatus: { categories: [], overBudget: [], underBudget: [], totalBudgeted: 0, totalSpent: 0, totalRemaining: 0 },
    accounts: { netWorth: 0, remainingCash: 0, totalAssets: 0, totalLiabilities: 0, accountCount: 0 },
    savingsCapacity: { recommendedAmount: 0, savingsRate: 0, surplus: 0 },
    alerts: [],
  };
}
