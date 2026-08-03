import type {
  CoachContext,
  CoachRequest,
  CoachScenarioResult,
} from './types';
import { intentLabel } from './intent';

// ============================================================================
// Coach prompt contract (Phase 5) + financial accuracy rules (Phase 6)
//
// The AI Coach NEVER calculates financial values. Every figure it can reference
// is injected below, produced by the Financial Engine / Forecast Engine. The
// model's job is to interpret, explain, and recommend — never to compute.
// ============================================================================

const COACH_SYSTEM_PROMPT = `You are MyBudgetOS AI Financial Coach — a knowledgeable, trustworthy personal finance coach.

ABSOLUTE ACCURACY RULES (non-negotiable):
1. NEVER invent, infer, or estimate any number, transaction, balance, rate, date, or projection that is not explicitly provided in the FINANCIAL CONTEXT below.
2. If a figure is not in the context, say "I don't have that information right now" instead of guessing. Never state a number you cannot see in the context.
3. Distinguish data quality at all times:
   - "Actual" = recorded transactions/balances (this month's spending, current balance).
   - "Projected" = forecast engine output for a future period (30/60/90-day cash flow, payoff dates).
   - "Estimated" = scenario or assumption-based figures (what-if results, expected returns).
   Label figures accordingly (e.g., "projected to reach $X by [date]").
4. Scenario (what-if) figures are hypothetical. Always frame them as "if you did X, the engine projects Y" — never as a guarantee.
5. When a data source is listed as UNAVAILABLE, do not answer from that domain and tell the user which source is missing.
6. Round money to whole dollars in prose unless precision is meaningful. Do not fabricate precision.
7. Never state that the user "will" save/earn/own something — use "could" / "may" / "is projected to" based on the provided projection.
8. If the question cannot be answered from the provided context, say so and offer what you CAN answer.
9. Do not provide legal, tax, or investment advice. For rates, note the values shown are from their records.

YOUR ROLE:
- Be a calm, clear, practical coach. Short paragraphs, plain language, no jargon walls.
- Lead with the most important insight, then details.
- Use the user's real numbers (from context) to personalize. Never reference numbers not present.
- When recommending changes (e.g., increase savings, reduce spending), quantify using ONLY context values.

The user's question and the relevant FINANCIAL CONTEXT follow.`;

function money(value: number | undefined | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return 'N/A';
  const rounded = Math.round(value);
  return `$${rounded.toLocaleString('en-US')}`;
}

function pct(value: number | undefined | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return 'N/A';
  return `${Math.round(value)}%`;
}

function serializeBasic(c: CoachContext['basic']): string[] {
  if (!c) return [];
  return [
    '=== OVERVIEW (actual, as of ' + c.asOfDate + ') ===',
    `- Net worth: ${money(c.netWorth)} (assets ${money(c.totalAssets)}, liabilities ${money(c.totalLiabilities)})`,
    `- Available cash: ${money(c.availableCash)}`,
    `- Monthly income (actual): ${money(c.monthlyIncome)}`,
    `- Monthly expenses (actual): ${money(c.monthlyExpenses)}`,
    `- Monthly net cash flow: ${money(c.netCashFlow)}`,
    `- Savings rate: ${pct(c.savingsRate)}`,
    `- Accounts: ${c.accountCount} | Mortgages: ${c.mortgageCount} | Active savings goals: ${c.savingsGoalCount}`,
  ];
}

function serializeSpending(c: CoachContext['spending']): string[] {
  if (!c) return [];
  const lines = [
    `=== SPENDING (actual) ===`,
    `${c.currentMonthLabel}: ${money(c.currentExpenses)} | ${c.previousMonthLabel}: ${money(c.previousExpenses)} | change: ${c.change >= 0 ? '+' : ''}${money(c.change)} (${c.changePercent >= 0 ? '+' : ''}${Math.round(c.changePercent)}%)`,
    `Top categories this month:`,
    ...c.topCategories.map((t) => `  - ${t.name}: ${money(t.amount)} (${pct(t.percentage)})`),
  ];
  const notable = c.categoryChanges.slice(0, 3).filter((x) => x.change !== 0);
  if (notable.length > 0) {
    lines.push('Largest month-over-month category changes (actual):');
    lines.push(...notable.map((x) => `  - ${x.name}: ${x.current >= x.previous ? '+' : ''}${money(x.change)} (${x.changePercent >= 0 ? '+' : ''}${Math.round(x.changePercent)}%) — ${x.previous ? 'prev ' + money(x.previous) : 'new this month'}`));
  }
  if (c.recentTransactions.length > 0) {
    lines.push('Recent transactions (actual, merchant + amount):');
    lines.push(...c.recentTransactions.map((t) => `  - ${t.merchant ?? 'Unknown'}: ${money(t.amount)} on ${t.date}`));
  }
  return lines;
}

function serializeBudget(c: CoachContext['budget']): string[] {
  if (!c) return [];
  const lines = [
    `=== BUDGET (actual) ===`,
    `Budgeted ${money(c.totalBudgeted)}, spent ${money(c.totalSpent)}, remaining ${money(c.totalRemaining)} (${pct(c.adherencePercent)} adherence, status: ${c.overallStatus})`,
  ];
  if (c.overBudget.length > 0) {
    lines.push('Over-budget categories:');
    lines.push(...c.overBudget.map((b) => `  - ${b.categoryName}: spent ${money(b.spent)} of ${money(b.budgeted)} (${pct(b.percentUsed)} used)`));
  }
  lines.push('Top categories by budget usage:');
  lines.push(...c.topByUsage.map((b) => `  - ${b.categoryName}: ${money(b.spent)} of ${money(b.budgeted)} (${pct(b.percentUsed)} used, ${b.status})`));
  return lines;
}

function serializeDebt(c: CoachContext['debt']): string[] {
  if (!c) return [];
  const lines = [`=== DEBT (actual + projected) ===`];
  if (c.mortgages.length === 0) {
    lines.push('- No mortgage on record.');
  } else {
    for (const m of c.mortgages) {
      lines.push(`- ${m.name}: remaining ${money(m.remainingBalance)}, payment ${money(m.monthlyPayment)}/mo${m.annualRate > 0 ? `, rate ${pct(m.annualRate)}` : ''}, projected payoff ${m.payoffDate || 'N/A'} (${m.payoffMonths} months / ~${m.yearsRemaining} years), total interest ${money(m.totalInterest)}, interest saved so far ${money(m.interestSaved)}, ${m.progressPct}% paid off, extra payment ${money(m.extraPayment)}/mo`);
    }
  }
  lines.push(`- Non-mortgage liabilities: ${money(c.nonMortgageDebt)}`);
  return lines;
}

function serializeGoal(c: CoachContext['goal']): string[] {
  if (!c) return [];
  const lines = [`=== SAVINGS GOALS (actual + projected) ===`];
  if (c.savingsGoals.length === 0) {
    lines.push('- No savings goals on record.');
  } else {
    for (const g of c.savingsGoals) {
      lines.push(`- ${g.name}: ${money(g.current)} of ${money(g.target)} (${pct(g.percentComplete)}), target ${g.targetDate ?? 'no date'}, ${g.onTrack ? 'on track' : 'behind'}, projected completion ${g.estimatedCompletionDate ?? 'N/A'}${g.monthsRemaining != null ? ` (${g.monthsRemaining} months)` : ''}`);
    }
  }
  lines.push(`- Total saved: ${money(c.totalSaved)} of ${money(c.totalTarget)} across ${c.activeGoalCount} active goal(s)`);
  return lines;
}

function serializeForecast(c: CoachContext['forecast']): string[] {
  if (!c) return [];
  const lines = [
    `=== CASH FLOW FORECAST (projected, as of ${c.asOfDate}) ===`,
    `- Available cash today: ${money(c.availableCash)}`,
  ];
  for (const w of c.windows) {
    lines.push(`- Next ${w.window} days: income ${money(w.income)}, expenses ${money(w.expenses)}, ending balance ${money(w.endingBalance)}, lowest ${money(w.lowestBalance)} on ${w.lowestBalanceDate ?? 'N/A'}${w.daysBelowZero > 0 ? `, below $0 for ${w.daysBelowZero} day(s)` : ''}`);
  }
  if (c.warnings.length > 0) {
    lines.push('Warnings:');
    lines.push(...c.warnings.map((w) => `  - [${w.severity}] ${w.title}: ${w.message}`));
  }
  if (c.upcomingBills.length > 0) {
    lines.push('Upcoming bills (next occurrences):');
    lines.push(...c.upcomingBills.map((b) => `  - ${b.name}: ${money(b.amount)} on ${b.nextRun}`));
  }
  if (c.upcomingIncome.length > 0) {
    lines.push('Upcoming income:');
    lines.push(...c.upcomingIncome.map((i) => `  - ${i.name}: ${money(i.amount)} on ${i.nextRun}`));
  }
  return lines;
}

function serializeHealth(c: CoachContext['health']): string[] {
  if (!c) return [];
  const lines = [
    `=== FINANCIAL HEALTH (actual) ===`,
    `- Overall score: ${c.overallScore}/100 (${c.tier})`,
    ...Object.entries(c.components).map(([name, comp]) => `  - ${name}: ${comp.earnedPoints}/${comp.maxPoints} (${pct(comp.percentage)})`),
  ];
  if (c.recommendations.length > 0) {
    lines.push('Recommendations:');
    lines.push(...c.recommendations.map((r) => `  - ${r}`));
  }
  return lines;
}

function serializeScenario(scenario: CoachScenarioResult | null): string[] {
  if (!scenario) return [];
  const lines = [`=== WHAT-IF SCENARIO (estimated — hypothetical) ===`, `- Scenario: ${scenario.label}`];

  if (scenario.mortgage) {
    const m = scenario.mortgage;
    lines.push(`- Baseline: payoff ${m.baseline.payoffDate ?? 'N/A'} (${m.baseline.payoffMonths} months), total interest ${money(m.baseline.totalInterest)}, interest already saved vs no-extra ${money(m.baseline.interestSaved)}`);
    lines.push(`- With change: payoff ${m.scenario.payoffDate ?? 'N/A'} (${m.scenario.payoffMonths} months), total interest ${money(m.scenario.totalInterest)}, interest saved ${money(m.scenario.interestSaved)}`);
    lines.push(`- Impact: pays off ${m.monthsSaved} month(s) sooner and saves ${money(m.interestSavedDelta)} in interest`);
  } else if (scenario.savings) {
    const s = scenario.savings;
    lines.push(`- Baseline: projected balance ${money(s.baseline.projectedBalance)}, completion ${s.baseline.projectedCompletionDate ?? 'N/A'} (${s.baseline.onTrack ? 'on track' : 'behind'})`);
    lines.push(`- With change: projected balance ${money(s.scenario.projectedBalance)}, completion ${s.scenario.projectedCompletionDate ?? 'N/A'} (${s.scenario.onTrack ? 'on track' : 'behind'})`);
    if (s.monthsSaved != null) lines.push(`- Impact: reaches goal ${s.monthsSaved} month(s) sooner`);
  } else if (scenario.comparison) {
    const c = scenario.comparison;
    const d = c.delta;
    lines.push(`- Baseline (${c.baseline.label}): final net worth ${money(c.baseline.finalNetWorth)}, debt ${money(c.baseline.finalDebt)}, savings ${money(c.baseline.finalSavings)}`);
    lines.push(`- Scenario (${c.scenario.label}): final net worth ${money(c.scenario.finalNetWorth)}, debt ${money(c.scenario.finalDebt)}, savings ${money(c.scenario.finalSavings)}`);
    lines.push(`- Delta: net worth ${d.netWorth >= 0 ? '+' : ''}${money(d.netWorth)}, debt ${d.debt >= 0 ? '+' : ''}${money(d.debt)}, savings ${d.savings >= 0 ? '+' : ''}${money(d.savings)}, cash flow ${d.cashFlowPerMonth >= 0 ? '+' : ''}${money(d.cashFlowPerMonth)}/mo`);
    if (c.recommendation) lines.push(`- Engine recommendation: ${c.recommendation}`);
  }
  return lines;
}

export function buildCoachSystemPrompt(context: CoachContext, unavailableSources: string[]): string {
  const parts: string[] = [COACH_SYSTEM_PROMPT];

  parts.push('\n=== UNAVAILABLE DATA SOURCES ===');
  if (unavailableSources.length === 0) {
    parts.push('- None — all context sources loaded.');
  } else {
    for (const source of unavailableSources) {
      parts.push(`- ${source}`);
    }
  }

  parts.push(`\n=== RELEVANT FINANCIAL CONTEXT (tier: ${context.tiers.join(', ')}, intent: ${intentLabel(context.intent)}) ===`);
  const sections = [
    ...serializeBasic(context.basic),
    ...serializeSpending(context.spending),
    ...serializeBudget(context.budget),
    ...serializeDebt(context.debt),
    ...serializeGoal(context.goal),
    ...serializeForecast(context.forecast),
    ...serializeHealth(context.health),
  ];
  if (sections.length === 0) {
    parts.push('- No context loaded for this question.');
  } else {
    parts.push(...sections);
  }

  parts.push('\nRemember the ABSOLUTE ACCURACY RULES: use ONLY the figures above. If you cannot answer from them, say so.');
  return parts.join('\n');
}

export function buildCoachUserPrompt(request: CoachRequest): string {
  const parts: string[] = [];

  if (request.scenario) {
    parts.push('The user asked a what-if question. The engine already computed the comparison below — use it verbatim, do not recompute.');
    parts.push(...serializeScenario(request.scenario));
    parts.push('');
  }

  parts.push('=== USER QUESTION ===');
  parts.push(`[intent: ${intentLabel(request.intent)}]`);
  parts.push('');
  parts.push(request.userMessage);

  return parts.join('\n');
}
