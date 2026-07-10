import { calculateFullAmortization } from '@budgetos/engine';
import type { ExtraPayment } from '@budgetos/shared';

export interface AmortizationRow {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  totalInterestToDate: number;
  remainingBalance: number;
  extraPayment: number;
}

export interface MortgageCalcResult {
  monthlyPayment: number;
  schedule: AmortizationRow[];
  totalPayments: number;
  totalPrincipal: number;
  totalInterest: number;
  payoffDate: string;
  payoffMonths: number;
  interestSaved: number;
}

export interface MortgageDashboard {
  remainingBalance: number;
  monthlyPayment: number;
  payoffDate: string;
  totalInterest: number;
  totalPrincipal: number;
  interestPaid: number;
  principalPaid: number;
  progressPct: number;
  totalCost: number;
}

export function computeMortgage(params: {
  principal: number;
  annualRate: number;
  termYears: number;
  startDate: string;
  extraPayments?: { amount: number; date?: string }[];
}): MortgageCalcResult | null {
  if (params.principal <= 0 || params.annualRate < 0 || params.termYears <= 0) return null;

  const extraPayments: ExtraPayment[] = (params.extraPayments ?? []).map((ep) => ({
    type: 'one_time' as const,
    amount: ep.amount,
    startMonth: ep.date ? monthDiff(params.startDate, ep.date) : undefined,
  }));

  try {
    const engineResult = calculateFullAmortization({
      principal: params.principal,
      annualRate: params.annualRate,
      termYears: params.termYears,
      startDate: params.startDate,
      extraPayments,
    });
    if (!engineResult || !engineResult.success) return null;
    const result = engineResult.data;
    return {
      monthlyPayment: result.monthlyPayment,
      schedule: result.schedule.map((r: any) => ({
        month: r.month, date: r.date, payment: r.payment,
        principal: r.principal, interest: r.interest,
        totalInterestToDate: r.totalInterestToDate,
        remainingBalance: r.remainingBalance,
        extraPayment: r.extraPayment ?? 0,
      })),
      totalPayments: result.totalPayments,
      totalPrincipal: result.totalPrincipal,
      totalInterest: result.totalInterest,
      payoffDate: result.payoffDate,
      payoffMonths: result.payoffMonths,
      interestSaved: result.interestSaved ?? 0,
    };
  } catch {
    return null;
  }
}

export function computeMortgageDashboard(result: MortgageCalcResult): MortgageDashboard {
  const totalPrincipal = result.totalPrincipal;
  const totalPaymentsMade = result.schedule.filter(r => r.remainingBalance <= 0).length;
  const paidSoFar = result.schedule.slice(0, Math.max(totalPaymentsMade, 1)).reduce(
    (s, r) => ({ principal: s.principal + r.principal, interest: s.interest + r.interest }),
    { principal: 0, interest: 0 }
  );
  const firstRow = result.schedule[0];
  const remainingBalance = firstRow ? firstRow.remainingBalance : 0;
  const progressPct = totalPrincipal > 0 ? (paidSoFar.principal / totalPrincipal) * 100 : 0;

  return {
    remainingBalance,
    monthlyPayment: result.monthlyPayment,
    payoffDate: result.payoffDate,
    totalInterest: result.totalInterest,
    totalPrincipal,
    interestPaid: paidSoFar.interest,
    principalPaid: paidSoFar.principal,
    progressPct,
    totalCost: totalPrincipal + result.totalInterest,
  };
}

function monthDiff(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth();
}
