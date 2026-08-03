import type { CoachContextTier, CoachIntent } from './types';

// ============================================================================
// Deterministic intent detection — application-side routing (Phase 8).
//
// The AI must NOT be the only thing deciding which financial data is loaded.
// We classify the user's question first, then load only the context tiers that
// intent needs (Phase 4 — context size management).
// ============================================================================

interface IntentRule {
  intent: CoachIntent;
  patterns: RegExp[];
}

const RULES: IntentRule[] = [
  {
    intent: 'what_if_scenario',
    patterns: [
      /what if/i,
      /if i (pay|save|increase|reduce|add|put|contribute)/i,
      /scenario/i,
      /hypothetical/i,
      /extra \$?\s?(\d+)/i,
      /pay(?: off)? (?:my )?(?:mortgage|loan) (?:faster|sooner|early)|accelerate/i,
      /increase (?:my )?(?:mortgage payment|savings contribution|contribution|saving)/i,
      /reduce (?:my )?(?:dining|spending|expenses) by/i,
      /how much (?:could|would) i save/i,
    ],
  },
  {
    intent: 'forecast',
    patterns: [
      /90[- ]day|60[- ]day|30[- ]day/i,
      /projected balance/i,
      /next 90|next 30|next 60/i,
      /balance (?:drop|drop below|run out|go negative|dip)/i,
      /enough money/i,
      /run out of money/i,
      /lowest (?:balance|point)/i,
      /cash flow forecast/i,
      /when (?:will|does) my balance/i,
    ],
  },
  {
    intent: 'retirement',
    patterns: [
      /retire/i,
      /retirement/i,
      /401k|401\(k\)|rrsp|tfsa|ira\b/i,
      /nest egg/i,
      /years until/i,
    ],
  },
  {
    intent: 'mortgage',
    patterns: [
      /mortgage/i,
      /pay off (?:my )?(?:mortgage|loan|home)/i,
      /payoff/i,
      /amortization/i,
      /interest (?:rate|saved|cost)|how much interest/i,
      /home loan/i,
    ],
  },
  {
    intent: 'savings',
    patterns: [
      /savings? goal/i,
      /saving for/i,
      /contribution/i,
      /reach (?:my )?goal|on track to reach|goal/i,
      /how much (?:should i|do i need to) save/i,
      /ahead of schedule|behind schedule/i,
    ],
  },
  {
    intent: 'financial_health',
    patterns: [
      /health score/i,
      /financial health/i,
      /why is (?:my )?score/i,
      /improve (?:my )?score/i,
      /health/i,
    ],
  },
  {
    intent: 'budget_analysis',
    patterns: [
      /budget/i,
      /on track/i,
      /over[- ]budget/i,
      /left to spend|remaining/i,
      /within (?:my )?budget/i,
      /track.*spending|spending.*track/i,
      /am i (?:ok|doing|fine)/i,
    ],
  },
  {
    intent: 'cash_flow',
    patterns: [
      /cash flow/i,
      /bills/i,
      /will i have enough/i,
      /afford/i,
      /cash (?:in|flow)/i,
    ],
  },
  {
    intent: 'spending_analysis',
    patterns: [
      /spend|spent|spending/i,
      /grocery|groceries|dining|eating out|transport/i,
      /category/i,
      /biggest expense|top expense/i,
      /where (?:am|did) i/i,
      /why did i/i,
      /increase|decreased|went up|went down/i,
    ],
  },
];

const TIER_FOR_INTENT: Record<CoachIntent, CoachContextTier[]> = {
  spending_analysis: ['basic', 'spending', 'budget'],
  budget_analysis: ['basic', 'budget', 'spending'],
  cash_flow: ['basic', 'forecast'],
  forecast: ['basic', 'forecast'],
  mortgage: ['basic', 'debt', 'goal'],
  savings: ['basic', 'goal'],
  retirement: ['basic', 'goal'],
  financial_health: ['basic', 'health', 'spending'],
  what_if_scenario: ['basic', 'forecast', 'debt', 'goal'],
  general_finance: ['basic', 'spending', 'budget', 'forecast', 'health'],
};

export function detectIntent(message: string): CoachIntent {
  const text = message.trim();
  if (!text) return 'general_finance';
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) return rule.intent;
    }
  }
  return 'general_finance';
}

export function tiersForIntent(intent: CoachIntent): CoachContextTier[] {
  return TIER_FOR_INTENT[intent];
}

export function intentLabel(intent: CoachIntent): string {
  switch (intent) {
    case 'spending_analysis': return 'spending analysis';
    case 'budget_analysis': return 'budget analysis';
    case 'cash_flow': return 'cash flow';
    case 'forecast': return 'forecast';
    case 'mortgage': return 'mortgage';
    case 'savings': return 'savings';
    case 'retirement': return 'retirement';
    case 'financial_health': return 'financial health';
    case 'what_if_scenario': return 'what-if scenario';
    default: return 'general finance';
  }
}
