import { computeMortgage as computeMortgageNew, computeMortgageDashboard as computeMortgageDashboardNew } from '@/lib/finance';
import type { MortgageInput, ExtraPaymentInput, MortgageResult, PaymentFrequency } from '@/lib/finance';

export type MortgageCalcResult = MortgageResult;

export interface OldMortgageDashboard {
  monthlyPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  payoffDate: string | null;
  progressPct: number;
  remainingBalance: number;
  principalPaid: number;
  interestPaid: number;
  paidSoFar: { principal: number; interest: number };
  equityBuilt: number;
  originalAmount: number;
}

export function computeMortgage(input: {
  principal: number;
  annualRate: number;
  termYears: number;
  amortizationYears?: number;
  startDate: string;
  paymentFrequency?: PaymentFrequency;
  compoundSemiAnnual?: boolean;
  extraPayments?: { amount: number; date?: string; month?: number; type?: string }[];
}): MortgageResult | null {
  const extraPayments: ExtraPaymentInput[] | undefined = input.extraPayments?.map((ep) => {
    const type = ep.type ?? 'one_time';
    if (type === 'one_time' || ep.month != null) {
      return { type: 'one_time' as const, amount: ep.amount, startMonth: ep.month ?? 1 };
    }
    if (type === 'monthly_fixed') {
      return { type: 'monthly_fixed' as const, amount: ep.amount };
    }
    if (type === 'annual_lump') {
      return { type: 'annual_lump' as const, amount: ep.amount };
    }
    return { type: 'one_time' as const, amount: ep.amount, startMonth: 1 };
  });

  return computeMortgageNew({
    principal: input.principal,
    annualRate: input.annualRate,
    amortizationYears: input.amortizationYears ?? input.termYears,
    startDate: input.startDate,
    paymentFrequency: input.paymentFrequency ?? 'monthly',
    extraPayments: extraPayments && extraPayments.length > 0 ? extraPayments : undefined,
    isCompoundSemiAnnual: input.compoundSemiAnnual ?? true,
  });
}

export function computeMortgageDashboard(result: MortgageResult): OldMortgageDashboard {
  const dashboard = computeMortgageDashboardNew(result);

  return {
    monthlyPayment: result.paymentAmount,
    totalPrincipal: result.totalPrincipal,
    totalInterest: result.totalInterest,
    payoffDate: result.payoffDate,
    progressPct: dashboard.progressPct,
    remainingBalance: dashboard.remainingBalance,
    principalPaid: dashboard.paidSoFar.principal,
    interestPaid: dashboard.paidSoFar.interest,
    paidSoFar: dashboard.paidSoFar,
    equityBuilt: dashboard.equityBuilt,
    originalAmount: dashboard.originalAmount,
  };
}

export { monthDiff } from '@/lib/finance';
