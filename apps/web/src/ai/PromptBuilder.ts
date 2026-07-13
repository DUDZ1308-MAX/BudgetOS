import type { AiContext, AiMessage, ChatSession } from '@/ai/types';

const SYSTEM_PROMPT_BASE = `You are BudgetOS AI Copilot — a helpful, knowledgeable financial coach.

Your role:
- Analyze the user's financial data using ONLY the context provided below
- Give clear, actionable advice
- Be concise but thorough
- NEVER make up numbers — use only the data provided
- NEVER expose sensitive personal information like full account numbers
- When unsure, state that you don't have enough data

You can answer questions about:
- Spending patterns and categorization
- Budget health and overspending
- Savings goals and progress
- Mortgage analysis and payoff scenarios
- Cash flow and net worth
- Safe-to-spend amounts
- Financial recommendations and forecasts
- Recurring bills, subscriptions, and recurring income
- Upcoming payment due dates

Financial context for this conversation:`;

export function buildSystemPrompt(context: AiContext): string {
  const parts: string[] = [SYSTEM_PROMPT_BASE];

  parts.push('\n=== MONTHLY OVERVIEW ===');
  parts.push(`Monthly Income: $${context.monthlyIncome.toFixed(2)}`);
  parts.push(`Monthly Expenses: $${context.monthlyExpenses.toFixed(2)}`);
  parts.push(`Net Worth: $${context.netWorth.toFixed(2)}`);

  parts.push('\n=== BUDGET HEALTH ===');
  const budget = context.budgetSummary.budgetStatus;
  parts.push(`Total Budgeted: $${budget.totalBudgeted.toFixed(2)}`);
  parts.push(`Total Spent: $${budget.totalSpent.toFixed(2)}`);
  parts.push(`Total Remaining: $${budget.totalRemaining.toFixed(2)}`);
  if (budget.overBudget.length > 0) {
    parts.push('Over-Budget Categories:');
    for (const cat of budget.overBudget) {
      parts.push(`- ${cat.categoryName}: spent $${cat.spent.toFixed(2)} of $${cat.budgeted.toFixed(2)}`);
    }
  }

  parts.push('\n=== TOP SPENDING CATEGORIES ===');
  const topCategories = context.budgetSummary.expenses.byCategory.slice(0, 5);
  for (const cat of topCategories) {
    parts.push(`- ${cat.categoryName}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`);
  }

  parts.push('\n=== SAVINGS GOALS ===');
  const activeGoals = context.savings.goals.filter((g) => g.progress.status !== 'completed');
  if (activeGoals.length > 0) {
    for (const goal of activeGoals) {
      parts.push(`- ${goal.name}: $${goal.current.toFixed(2)} of $${goal.target.toFixed(2)} (${goal.progress.percentComplete.toFixed(1)}%)`);
    }
  } else {
    parts.push('No active savings goals.');
  }
  parts.push(`Total Saved: $${context.savings.dashboard.totalSaved.toFixed(2)}`);

  if (context.mortgage.dashboard) {
    parts.push('\n=== MORTGAGE ===');
    const md = context.mortgage.dashboard;
    parts.push(`Remaining Balance: $${md.remainingBalance.toFixed(2)}`);
    parts.push(`Monthly Payment: $${md.monthlyPayment.toFixed(2)}`);
    parts.push(`Payoff Date: ${md.payoffDate}`);
    parts.push(`Progress: ${md.progressPct.toFixed(1)}%`);
  }

  parts.push('\n=== CASH FLOW ===');
  const cf = context.cashFlowSummary;
  parts.push(`Net Flow: $${cf.netFlow.toFixed(2)}`);
  parts.push(`Income/Expense Ratio: ${cf.incomeVsExpenseRatio.toFixed(2)}`);
  parts.push(`7-Day Trend: $${cf.sevenDayTrend.toFixed(2)}`);

  if (context.safeToSpend) {
    parts.push('\n=== SAFE TO SPEND ===');
    parts.push(`Today's Safe-to-Spend: $${context.safeToSpend.safeToSpendToday.toFixed(2)}`);
    parts.push(`Risk Level: ${context.safeToSpend.riskLevel}`);
  }

  parts.push('\n=== RECENT ALERTS ===');
  if (context.alerts.length > 0) {
    for (const alert of context.alerts) {
      parts.push(`[${alert.severity}] ${alert.message}`);
    }
  } else {
    parts.push('No active alerts.');
  }

  if (context.recurringTransactions && context.recurringTransactions.length > 0) {
    parts.push('\n=== RECURRING TRANSACTIONS ===');
    const activeRecurring = context.recurringTransactions.filter((r) => r.status === 'active');
    parts.push(`You have ${activeRecurring.length} active recurring transactions.`);
    const bills = activeRecurring.filter((r) => r.type === 'expense');
    const income = activeRecurring.filter((r) => r.type === 'income');
    if (bills.length > 0) {
      parts.push('Upcoming Bills:');
      const sorted = [...bills].sort((a, b) => a.nextRun.localeCompare(b.nextRun));
      for (const b of sorted) {
        parts.push(`- ${b.name}: $${Math.abs(b.amount).toFixed(2)} due ${new Date(b.nextRun).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${b.frequency})`);
      }
    }
    if (income.length > 0) {
      parts.push('Upcoming Income:');
      for (const i of income) {
        parts.push(`- ${i.name}: $${Math.abs(i.amount).toFixed(2)} on ${new Date(i.nextRun).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${i.frequency})`);
      }
    }
  }

  parts.push('\n=== CURRENT INSIGHTS ===');
  if (context.insights.length > 0) {
    for (const insight of context.insights) {
      parts.push(`[${insight.type}] ${insight.title}: ${insight.message}`);
    }
  }

  return parts.join('\n');
}

export function buildUserPrompt(message: string, context: AiContext): string {
  return `Based on my current financial situation, ${message}`;
}

export function buildConversationContext(session: ChatSession): AiMessage[] {
  return session.messages.slice(-20);
}

export function buildInitialPrompt(context: AiContext): string {
  const topCategory = context.budgetSummary.expenses.byCategory[0];
  const parts: string[] = [];

  if (context.budgetSummary.budgetStatus.overBudget.length > 0) {
    const worst = context.budgetSummary.budgetStatus.overBudget[0];
    if (worst) {
      parts.push(`I notice you're over budget in ${worst.categoryName}. Would you like tips to get back on track?`);
    }
  } else if (topCategory) {
    parts.push(`Your top spending category is ${topCategory.categoryName} at $${topCategory.amount.toFixed(2)}. Would you like a breakdown?`);
  }

  if (context.safeToSpend && context.safeToSpend.riskLevel === 'high') {
    parts.push('Your spending risk is high today. I can help you identify areas to cut back.');
  }

  const nearingGoals = context.savings.goals.filter(
    (g) => g.progress.status === 'on_track' && g.progress.percentComplete >= 75,
  );
  if (nearingGoals.length > 0) {
    const goal = nearingGoals[0];
      if (goal) {
        parts.push(`You're close to your savings goal "${goal.name}"! Great job!`);
    }
  }

  return parts.length > 0
    ? parts.join(' ')
    : 'I\'ve analyzed your finances. What would you like to know?';
}
