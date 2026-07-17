import { calculateFullAmortization } from '@budgetos/engine';

export interface MortgageResult {
  paymentAmount: number;
  totalPrincipal: number;
  totalInterest: number;
  payoffDate: string | null;
  payoffMonths: number;
  schedule: { month: number; payment: number; principal: number; interest: number; remainingBalance: number }[];
}

export interface MortgageDashboard {
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
  paymentFrequency?: string;
  compoundSemiAnnual?: boolean;
  extraPayments?: { amount: number; date?: string; month?: number; type?: string }[];
}): MortgageResult | null {
  const extraPayments = (input.extraPayments ?? []).map((ep) => {
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

  const result = calculateFullAmortization({
    principal: input.principal,
    annualRate: input.annualRate,
    termYears: input.termYears,
    startDate: input.startDate,
    extraPayments: extraPayments && extraPayments.length > 0 ? extraPayments : [],
  });

  if (!result.success) return null;

  const data = result.data;
  const lastRow = data.schedule.length > 0 ? data.schedule[data.schedule.length - 1] : null;
  const remainingBalance = lastRow ? lastRow.remainingBalance : input.principal;
  const principalPaid = input.principal - remainingBalance;

  return {
    paymentAmount: data.monthlyPayment,
    totalPrincipal: input.principal,
    totalInterest: data.totalInterest,
    payoffDate: data.payoffDate,
    payoffMonths: data.payoffMonths,
    schedule: data.schedule,
  };
}

export function computeMortgageDashboard(result: MortgageResult): MortgageDashboard {
  const principalPaid = result.totalPrincipal - (result.schedule.length > 0 ? result.schedule[result.schedule.length - 1].remainingBalance : result.totalPrincipal);
  const interestPaid = result.totalInterest - (result.schedule.length > 0 ? result.schedule[result.schedule.length - 1].remainingBalance * 0 : 0);
  const remainingBalance = result.schedule.length > 0 ? result.schedule[result.schedule.length - 1].remainingBalance : result.totalPrincipal;
  const progressPct = (principalPaid / result.totalPrincipal) * 100;
  const equityBuilt = principalPaid;
  const paidSoFar = { principal: principalPaid, interest: result.totalInterest - (result.totalPrincipal - principalPaid) };

  return {
    monthlyPayment: result.paymentAmount,
    totalPrincipal: result.totalPrincipal,
    totalInterest: result.totalInterest,
    payoffDate: result.payoffDate,
    progressPct,
    remainingBalance,
    principalPaid,
    interestPaid: result.totalInterest,
    paidSoFar,
    equityBuilt,
    originalAmount: result.totalPrincipal,
  };
}

export function monthDiff(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
}
