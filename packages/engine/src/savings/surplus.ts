export interface SurplusInput {
  totalIncome: number;
  totalExpenses: number;
  sinkingFunds: number;
}

export function calculateSurplus(input: SurplusInput): number {
  return input.totalIncome - input.totalExpenses - input.sinkingFunds;
}
