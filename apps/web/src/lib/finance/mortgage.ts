export interface MortgageInput {
  principal: number;
  annualRate: number;
  termYears: number;
  startDate: string;
  extraPayments?: ExtraPaymentInput[];
}

export interface ExtraPaymentInput {
  month: number;
  amount: number;
}

export interface AmortizationRow {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface MortgageResult {
  monthlyPayment: number;
  schedule: AmortizationRow[];
  totalPayments: number;
  totalPrincipal: number;
  totalInterest: number;
  payoffDate: string | null;
  payoffMonths: number;
  interestSaved: number;
}

export interface MortgageDashboard {
  totalPaymentsMade: number;
  paidSoFar: { principal: number; interest: number };
  progressPct: number;
  totalCost: number;
  remainingBalance: number;
}

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  if (annualRate === 0) return principal / (termYears * 12);
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const factor = Math.pow(1 + monthlyRate, numPayments);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
  startDate: string,
  extraPayments: ExtraPaymentInput[] = [],
): AmortizationRow[] {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const extraMap = new Map(extraPayments.map((ep) => [ep.month, ep.amount]));

  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  const start = new Date(startDate);

  for (let month = 1; month <= termYears * 12; month++) {
    if (balance <= 0) break;

    const interest = balance * monthlyRate;
    let principalPaid = monthlyPayment - interest;
    let payment = monthlyPayment;

    const extra = extraMap.get(month) ?? 0;
    if (extra > 0) {
      principalPaid += extra;
      payment += extra;
    }

    principalPaid = Math.min(principalPaid, balance);
    balance -= principalPaid;
    totalInterest += interest;

    const date = new Date(start.getFullYear(), start.getMonth() + month, start.getDate());
    const dateStr = date.toISOString().split('T')[0] ?? '';

    schedule.push({
      month,
      date: dateStr,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      remainingBalance: Math.round(Math.max(0, balance) * 100) / 100,
    });
  }

  return schedule;
}

export function calculateInterestSaved(
  schedule: AmortizationRow[],
  originalTotalInterest: number,
): number {
  const actualInterest = schedule.reduce((s, r) => s + r.interest, 0);
  return Math.max(0, Math.round((originalTotalInterest - actualInterest) * 100) / 100);
}

export function calculatePayoffDate(schedule: AmortizationRow[]): string | null {
  if (schedule.length === 0) return null;
  return schedule[schedule.length - 1]!.date;
}

export function calculateRemainingBalance(schedule: AmortizationRow[], month: number): number {
  const row = schedule.find((r) => r.month === month);
  if (row) return row.remainingBalance;
  if (schedule.length === 0) return 0;
  return schedule[schedule.length - 1]!.remainingBalance;
}

export function calculateExtraPaymentScenario(
  principal: number,
  annualRate: number,
  termYears: number,
  startDate: string,
  extraPayment: ExtraPaymentInput[],
): MortgageResult | null {
  return computeMortgage({ principal, annualRate, termYears, startDate, extraPayments: extraPayment });
}

export function calculateInvestVsMortgage(
  principal: number,
  annualRate: number,
  termYears: number,
  investReturnRate: number,
  extraPayment: number,
): { mortgageSaved: number; investmentEarned: number; betterOption: 'mortgage' | 'invest' } {
  const base = computeMortgage({ principal, annualRate, termYears, startDate: new Date().toISOString().split('T')[0] ?? '' })!;
  const withExtra = computeMortgage({
    principal, annualRate, termYears,
    startDate: new Date().toISOString().split('T')[0] ?? '',
    extraPayments: [{ month: 1, amount: extraPayment }],
  })!;

  const mortgageSaved = base.totalInterest - withExtra.totalInterest;

  const monthlyReturnRate = investReturnRate / 100 / 12;
  let investmentBalance = 0;
  for (let i = 0; i < termYears * 12; i++) {
    investmentBalance += extraPayment;
    investmentBalance *= (1 + monthlyReturnRate);
  }
  const investmentEarned = Math.round((investmentBalance - extraPayment * termYears * 12) * 100) / 100;

  return {
    mortgageSaved: Math.max(0, Math.round(mortgageSaved * 100) / 100),
    investmentEarned: Math.round(investmentEarned * 100) / 100,
    betterOption: mortgageSaved > investmentEarned ? 'mortgage' : 'invest',
  };
}

export function computeMortgageDashboard(result: MortgageResult): MortgageDashboard {
  const paidSoFar = result.schedule.reduce(
    (acc, row) => {
      if (row.remainingBalance > 0) {
        acc.principal += row.principal;
        acc.interest += row.interest;
      }
      return acc;
    },
    { principal: 0, interest: 0 },
  );

  const totalPaymentsMade = result.schedule.filter((r) => r.remainingBalance <= 0).length;
  const progressPct = result.totalPrincipal > 0
    ? Math.min(100, (paidSoFar.principal / result.totalPrincipal) * 100)
    : 0;

  return {
    totalPaymentsMade,
    paidSoFar,
    progressPct: Math.round(progressPct * 100) / 100,
    totalCost: Math.round((result.totalPrincipal + result.totalInterest) * 100) / 100,
    remainingBalance: result.schedule.length > 0
      ? result.schedule[result.schedule.length - 1]!.remainingBalance
      : result.totalPrincipal,
  };
}

export function computeMortgage(input: MortgageInput): MortgageResult | null {
  const { principal, annualRate, termYears, startDate, extraPayments } = input;
  if (principal <= 0 || annualRate < 0 || termYears <= 0) return null;

  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const schedule = generateAmortizationSchedule(principal, annualRate, termYears, startDate, extraPayments);

  const totalPrincipal = principal;
  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
  const totalPayments = schedule.reduce((s, r) => s + r.payment, 0);
  const payoffDate = calculatePayoffDate(schedule);
  const payoffMonths = schedule.length;

  const noExtraSchedule = generateAmortizationSchedule(principal, annualRate, termYears, startDate);
  const originalTotalInterest = noExtraSchedule.reduce((s, r) => s + r.interest, 0);
  const interestSaved = calculateInterestSaved(schedule, originalTotalInterest);

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    schedule,
    totalPayments: Math.round(totalPayments * 100) / 100,
    totalPrincipal: Math.round(totalPrincipal * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    payoffDate,
    payoffMonths,
    interestSaved: Math.round(interestSaved * 100) / 100,
  };
}
