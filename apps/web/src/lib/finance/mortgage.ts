/**
 * Canadian-First Mortgage Engine
 *
 * Key features:
 * - Canadian semi-annual compounding for fixed-rate mortgages
 * - All payment frequencies (monthly, semi-monthly, bi-weekly, accelerated bi-weekly, weekly, accelerated weekly)
 * - Currency-safe arithmetic (rounds to cents at each step)
 * - Comprehensive extra payment support
 * - Scenario comparison
 * - Investment vs mortgage analysis
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaymentFrequency =
  | 'monthly'
  | 'semi_monthly'
  | 'bi_weekly'
  | 'accelerated_bi_weekly'
  | 'weekly'
  | 'accelerated_weekly';

export interface MortgageInput {
  principal: number;
  annualRate: number;
  amortizationYears: number;
  termYears?: number; // optional, defaults to amortizationYears
  startDate: string;
  paymentFrequency: PaymentFrequency;
  extraPayments?: ExtraPaymentInput[];
  isCompoundSemiAnnual?: boolean; // default true for Canadian fixed
}

export interface ExtraPaymentInput {
  type: 'monthly_fixed' | 'annual_lump' | 'one_time' | 'biweekly';
  amount: number;
  startMonth?: number; // for one_time
}

export interface AmortizationRow {
  month: number;
  paymentNumber: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  remainingBalance: number;
  extraPayment: number;
}

export interface MortgageResult {
  paymentAmount: number;
  paymentFrequency: PaymentFrequency;
  paymentsPerYear: number;
  totalPayments: number;
  schedule: AmortizationRow[];
  totalPrincipal: number;
  totalInterest: number;
  totalCost: number;
  payoffDate: string;
  payoffMonths: number;
  interestSaved: number;
  effectiveAnnualRate: number;
  monthlyEquivalent: number;
}

export interface MortgageDashboard {
  totalPaymentsMade: number;
  paidSoFar: { principal: number; interest: number };
  progressPct: number;
  totalCost: number;
  remainingBalance: number;
  equityBuilt: number;
  principalPaidPct: number;
  originalAmount: number;
}

export interface ScenarioComparison {
  scenarios: ScenarioResult[];
  bestPayoffDate: string;
  bestInterestSaved: number;
}

export interface ScenarioResult {
  label: string;
  result: MortgageResult;
  input: MortgageInput;
}

export interface InvestVsMortgageResult {
  mortgageSaved: number;
  investmentEarned: number;
  betterOption: 'mortgage' | 'invest';
  monthlyInvestmentBalance: number[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYMENTS_PER_YEAR: Record<PaymentFrequency, number> = {
  monthly: 12,
  semi_monthly: 24,
  bi_weekly: 26,
  accelerated_bi_weekly: 26,
  weekly: 52,
  accelerated_weekly: 52,
};

const MONTHS_PER_YEAR = 12;

// ---------------------------------------------------------------------------
// Core Math Helpers (currency-safe)
// ---------------------------------------------------------------------------

/** Round to 2 decimal places (cents) */
function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Convert nominal annual rate (as percentage, e.g. 5.5) compounded semi-annually
 * to effective monthly rate.
 * Canadian fixed-rate mortgages compound semi-annually by law.
 *
 * effective_monthly = (1 + (nominal/100)/2)^(1/6) - 1
 */
function semiAnnualToEffectiveMonthly(nominalAnnualRate: number): number {
  const decimalRate = nominalAnnualRate / 100;
  const semiAnnualRate = decimalRate / 2;
  return Math.pow(1 + semiAnnualRate, 1 / 6) - 1;
}

/**
 * Convert nominal annual rate (as percentage) compounded monthly.
 * Used for variable-rate mortgages or US-style calculations.
 */
function monthlyCompoundingRate(nominalAnnualRate: number): number {
  return (nominalAnnualRate / 100) / MONTHS_PER_YEAR;
}

/**
 * Get the effective periodic rate for a given frequency.
 * For Canadian fixed: compound semi-annually, then convert to payment period.
 */
function getPeriodicRate(
  annualRate: number,
  frequency: PaymentFrequency,
  isSemiAnnualCompound: boolean,
): number {
  if (annualRate === 0) return 0;

  if (isSemiAnnualCompound) {
    // Canadian: semi-annual compounding
    const effectiveMonthly = semiAnnualToEffectiveMonthly(annualRate);
    const paymentsPerYear = PAYMENTS_PER_YEAR[frequency];

    // Convert effective monthly to effective periodic rate for the payment frequency
    // effective_periodic = (1 + effective_monthly)^(12/payments_per_year) - 1
    return Math.pow(1 + effectiveMonthly, MONTHS_PER_YEAR / paymentsPerYear) - 1;
  } else {
    // Simple monthly compounding (variable rate / US-style)
    const monthlyRate = monthlyCompoundingRate(annualRate);
    const paymentsPerYear = PAYMENTS_PER_YEAR[frequency];

    // Simple division for simple compounding
    return monthlyRate * (MONTHS_PER_YEAR / paymentsPerYear);
  }
}

/**
 * Calculate payment amount for a given frequency using Canadian semi-annual compounding.
 * Uses the standard annuity formula adapted for the periodic rate.
 *
 * For accelerated frequencies, the payment is derived from the monthly payment:
 * - accelerated_bi_weekly: monthly / 2
 * - accelerated_weekly: monthly / 4
 */
function calculatePaymentAmount(
  principal: number,
  annualRate: number,
  amortizationYears: number,
  frequency: PaymentFrequency,
  isSemiAnnualCompound: boolean,
): number {
  if (annualRate === 0) {
    const totalPayments = amortizationYears * PAYMENTS_PER_YEAR[frequency];
    return roundCents(principal / totalPayments);
  }

  // For accelerated frequencies, calculate monthly payment first, then derive
  if (frequency === 'accelerated_bi_weekly' || frequency === 'accelerated_weekly') {
    const monthlyPayment = calculatePaymentAmount(
      principal,
      annualRate,
      amortizationYears,
      'monthly',
      isSemiAnnualCompound,
    );
    if (frequency === 'accelerated_bi_weekly') {
      return roundCents(monthlyPayment / 2);
    } else {
      return roundCents(monthlyPayment / 4);
    }
  }

  const periodicRate = getPeriodicRate(annualRate, frequency, isSemiAnnualCompound);
  const totalPayments = amortizationYears * PAYMENTS_PER_YEAR[frequency];

  // Standard annuity formula: PMT = PV * r * (1+r)^n / ((1+r)^n - 1)
  const factor = Math.pow(1 + periodicRate, totalPayments);
  return roundCents((principal * periodicRate * factor) / (factor - 1));
}

/**
 * Calculate the monthly equivalent payment for display/comparison.
 */
function calculateMonthlyEquivalent(
  paymentAmount: number,
  frequency: PaymentFrequency,
): number {
  const paymentsPerYear = PAYMENTS_PER_YEAR[frequency];
  return roundCents((paymentAmount * paymentsPerYear) / MONTHS_PER_YEAR);
}

// ---------------------------------------------------------------------------
// Extra Payment Logic
// ---------------------------------------------------------------------------

function getExtraForMonth(
  extraPayments: ExtraPaymentInput[],
  month: number,
  basePayment: number,
  frequency: PaymentFrequency,
): number {
  let extra = 0;
  const paymentsPerYear = PAYMENTS_PER_YEAR[frequency];

  for (const ep of extraPayments) {
    switch (ep.type) {
      case 'monthly_fixed':
        // Monthly fixed extra is added every payment period
        extra += ep.amount;
        break;

      case 'annual_lump':
        // Annual lump sum: applied every 12 months
        if (month % 12 === 0) {
          extra += ep.amount;
        }
        break;

      case 'one_time':
        // One-time payment at specific month
        if (ep.startMonth !== undefined && ep.startMonth === month) {
          extra += ep.amount;
        }
        break;

      case 'biweekly':
        // Biweekly extra: convert to per-payment amount
        // If user gives biweekly amount, divide by payments per year ratio
        extra += ep.amount * (paymentsPerYear / 26);
        break;
    }
  }

  return extra;
}

// ---------------------------------------------------------------------------
// Main Calculation Functions
// ---------------------------------------------------------------------------

/**
 * Generate a full amortization schedule with Canadian semi-annual compounding.
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  amortizationYears: number,
  startDate: string,
  frequency: PaymentFrequency = 'monthly',
  extraPayments: ExtraPaymentInput[] = [],
  isSemiAnnualCompound: boolean = true,
): AmortizationRow[] {
  const paymentAmount = calculatePaymentAmount(
    principal,
    annualRate,
    amortizationYears,
    frequency,
    isSemiAnnualCompound,
  );

  const periodicRate = getPeriodicRate(annualRate, frequency, isSemiAnnualCompound);
  const paymentsPerYear = PAYMENTS_PER_YEAR[frequency];
  const totalPossiblePayments = amortizationYears * paymentsPerYear;

  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  let currentMonth = 0;
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);

  for (let paymentNum = 1; paymentNum <= totalPossiblePayments; paymentNum++) {
    if (balance <= 0.005) break; // effectively zero (avoid floating point dust)

    const interest = roundCents(balance * periodicRate);
    let extraThisPayment = getExtraForMonth(extraPayments, paymentNum, paymentAmount, frequency);

    // Calculate principal portion
    let principalPortion: number;
    let actualPayment: number;

    if (balance + interest <= paymentAmount + extraThisPayment) {
      // Final payment - pay off remaining balance
      principalPortion = balance;
      actualPayment = roundCents(interest + principalPortion);
      balance = 0;
    } else {
      principalPortion = roundCents(paymentAmount + extraThisPayment - interest);
      actualPayment = roundCents(paymentAmount + extraThisPayment);
      balance = roundCents(balance - principalPortion);
    }

    cumulativePrincipal = roundCents(cumulativePrincipal + principalPortion);
    cumulativeInterest = roundCents(cumulativeInterest + interest);

    // Track the actual calendar month for this payment
    if (frequency === 'monthly') {
      currentMonth = paymentNum;
    } else if (frequency === 'semi_monthly') {
      // Semi-monthly: 2 per month, so payment 1-2 = month 1, 3-4 = month 2, etc.
      currentMonth = Math.ceil(paymentNum / 2);
    } else {
      // For weekly/bi-weekly frequencies, calculate from the date
      const monthIndex = Math.floor((paymentNum - 1) * (MONTHS_PER_YEAR / paymentsPerYear));
      currentMonth = monthIndex + 1;
    }

    const dateStr = addMonthsToDate(startDate, currentMonth - 1);

    schedule.push({
      month: currentMonth,
      paymentNumber: paymentNum,
      date: dateStr,
      payment: actualPayment,
      principal: principalPortion,
      interest,
      cumulativePrincipal,
      cumulativeInterest,
      remainingBalance: Math.max(0, balance),
      extraPayment: extraThisPayment,
    });
  }

  // Handle remaining balance due to rounding
  if (balance > 0.005 && schedule.length > 0) {
    const lastRow = schedule[schedule.length - 1]!;
    lastRow.principal = roundCents(lastRow.principal + balance);
    lastRow.payment = roundCents(lastRow.payment + balance);
    lastRow.remainingBalance = 0;
    lastRow.cumulativePrincipal = roundCents(lastRow.cumulativePrincipal + balance);
    balance = 0;
  }

  return schedule;
}

/**
 * Add months to a date string, returning YYYY-MM-DD.
 */
function addMonthsToDate(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const totalMonths = (year! * 12 + (month! - 1)) + months;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  const lastDay = new Date(newYear, newMonth, 0).getDate();
  const clampedDay = Math.min(day!, lastDay);
  return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

/**
 * Calculate interest saved compared to a baseline (no extra payments).
 */
export function calculateInterestSaved(
  schedule: AmortizationRow[],
  originalTotalInterest: number,
): number {
  const actualInterest = schedule.reduce((s, r) => s + r.interest, 0);
  return roundCents(Math.max(0, originalTotalInterest - actualInterest));
}

/**
 * Get the payoff date from a schedule.
 */
export function calculatePayoffDate(schedule: AmortizationRow[]): string | null {
  if (schedule.length === 0) return null;
  return schedule[schedule.length - 1]!.date;
}

/**
 * Get remaining balance at a specific payment number.
 */
export function calculateRemainingBalance(schedule: AmortizationRow[], paymentNumber: number): number {
  const row = schedule.find((r) => r.paymentNumber === paymentNumber);
  if (row) return row.remainingBalance;
  if (schedule.length === 0) return 0;
  return schedule[schedule.length - 1]!.remainingBalance;
}

/**
 * Compute the effective annual rate (EAR) from nominal rate (as percentage).
 */
export function computeEffectiveAnnualRate(
  annualRate: number,
  isSemiAnnualCompound: boolean,
): number {
  if (annualRate === 0) return 0;
  const decimalRate = annualRate / 100;

  if (isSemiAnnualCompound) {
    // EAR = (1 + nominal/2)^2 - 1
    return Math.pow(1 + decimalRate / 2, 2) - 1;
  } else {
    // EAR = (1 + nominal/12)^12 - 1
    return Math.pow(1 + decimalRate / 12, 12) - 1;
  }
}

/**
 * Full mortgage computation with all metrics.
 */
export function computeMortgage(input: MortgageInput): MortgageResult | null {
  const {
    principal,
    annualRate,
    amortizationYears,
    termYears,
    startDate,
    paymentFrequency = 'monthly',
    extraPayments = [],
    isCompoundSemiAnnual = true,
  } = input;

  if (principal <= 0 || annualRate < 0 || amortizationYears <= 0) return null;
  if (annualRate > 100) return null;
  if (amortizationYears > 50) return null;

  const paymentAmount = calculatePaymentAmount(
    principal,
    annualRate,
    amortizationYears,
    paymentFrequency,
    isCompoundSemiAnnual,
  );

  const schedule = generateAmortizationSchedule(
    principal,
    annualRate,
    amortizationYears,
    startDate,
    paymentFrequency,
    extraPayments,
    isCompoundSemiAnnual,
  );

  const totalPrincipal = principal;
  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
  const totalCost = roundCents(totalPrincipal + totalInterest);
  const payoffDate = calculatePayoffDate(schedule) ?? startDate;

  // Calculate actual payoff months from the last payment's month index
  const lastRow = schedule[schedule.length - 1];
  const payoffMonths = lastRow ? lastRow.month : 0;

  // Calculate interest saved vs baseline (no extra payments)
  const baselineSchedule = generateAmortizationSchedule(
    principal,
    annualRate,
    amortizationYears,
    startDate,
    paymentFrequency,
    [],
    isCompoundSemiAnnual,
  );
  const baselineInterest = baselineSchedule.reduce((s, r) => s + r.interest, 0);
  const interestSaved = calculateInterestSaved(schedule, baselineInterest);

  const effectiveAnnualRate = computeEffectiveAnnualRate(annualRate, isCompoundSemiAnnual);
  const monthlyEquivalent = calculateMonthlyEquivalent(paymentAmount, paymentFrequency);

  return {
    paymentAmount,
    paymentFrequency,
    paymentsPerYear: PAYMENTS_PER_YEAR[paymentFrequency],
    totalPayments: schedule.length,
    schedule,
    totalPrincipal: roundCents(totalPrincipal),
    totalInterest: roundCents(totalInterest),
    totalCost,
    payoffDate,
    payoffMonths,
    interestSaved,
    effectiveAnnualRate,
    monthlyEquivalent,
  };
}

/**
 * Compute dashboard metrics for a mortgage result.
 *
 * Remaining balance = ending balance of the latest completed payment (not the final
 * row of the full schedule, which is always 0).
 */
export function computeMortgageDashboard(result: MortgageResult): MortgageDashboard {
  // Determine current payment position from the start date
  const startDate = new Date(result.schedule[0]?.date ?? new Date());
  const now = new Date();
  const monthsElapsed =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());
  const currentPaymentNumber = Math.min(
    Math.max(0, monthsElapsed),
    result.schedule.length,
  );

  // Sum principal and interest up to the current payment
  const paidSoFar = result.schedule.reduce(
    (acc, row) => {
      if (currentPaymentNumber > 0 && row.paymentNumber <= currentPaymentNumber) {
        acc.principal = roundCents(acc.principal + row.principal);
        acc.interest = roundCents(acc.interest + row.interest);
      }
      return acc;
    },
    { principal: 0, interest: 0 },
  );

  const totalPaymentsMade = currentPaymentNumber;

  const progressPct = result.totalPrincipal > 0
    ? Math.min(100, roundCents((paidSoFar.principal / result.totalPrincipal) * 100))
    : 0;

  // Remaining balance = ending balance of the current payment row
  // If no payments made yet (currentPaymentNumber = 0), remaining balance = full principal
  const currentRow = currentPaymentNumber > 0
    ? result.schedule.find((r) => r.paymentNumber === currentPaymentNumber)
    : undefined;
  const remainingBalance = currentRow
    ? currentRow.remainingBalance
    : result.totalPrincipal;

  const equityBuilt = roundCents(result.totalPrincipal - remainingBalance);
  const principalPaidPct = roundCents((paidSoFar.principal / result.totalPrincipal) * 100);

  if (import.meta.env?.DEV) {
    const balanceCheck = roundCents(equityBuilt + remainingBalance);
    if (Math.abs(balanceCheck - result.totalPrincipal) > 1) {
      console.error(
        `[mortgage] Invariant violated: equityBuilt(${equityBuilt}) + remainingBalance(${remainingBalance}) = ${balanceCheck} ≠ totalPrincipal(${result.totalPrincipal})`,
      );
    }
    const progressCheck = roundCents((paidSoFar.principal / result.totalPrincipal) * 100);
    if (Math.abs(progressCheck - progressPct) > 0.01) {
      console.error(
        `[mortgage] Progress mismatch: paidSoFar.principal/totalPrincipal = ${progressCheck}% ≠ progressPct = ${progressPct}%`,
      );
    }
  }

  return {
    totalPaymentsMade,
    paidSoFar,
    progressPct,
    totalCost: result.totalCost,
    remainingBalance,
    equityBuilt,
    principalPaidPct: Math.min(100, principalPaidPct),
    originalAmount: result.totalPrincipal,
  };
}

/**
 * Calculate extra payment scenario.
 */
export function calculateExtraPaymentScenario(
  principal: number,
  annualRate: number,
  amortizationYears: number,
  startDate: string,
  extraPayments: ExtraPaymentInput[],
  frequency: PaymentFrequency = 'monthly',
  isSemiAnnualCompound: boolean = true,
): MortgageResult | null {
  return computeMortgage({
    principal,
    annualRate,
    amortizationYears,
    startDate,
    paymentFrequency: frequency,
    extraPayments,
    isCompoundSemiAnnual: isSemiAnnualCompound,
  });
}

/**
 * Compare investing extra payments vs putting them toward mortgage.
 */
export function calculateInvestVsMortgage(
  principal: number,
  annualRate: number,
  amortizationYears: number,
  investReturnRate: number,
  extraPayment: number,
  frequency: PaymentFrequency = 'monthly',
  isSemiAnnualCompound: boolean = true,
): InvestVsMortgageResult {
  const base = computeMortgage({
    principal,
    annualRate,
    amortizationYears,
    startDate: new Date().toISOString().split('T')[0] ?? '',
    paymentFrequency: frequency,
    extraPayments: [],
    isCompoundSemiAnnual: isSemiAnnualCompound,
  });

  const withExtra = computeMortgage({
    principal,
    annualRate,
    amortizationYears,
    startDate: new Date().toISOString().split('T')[0] ?? '',
    paymentFrequency: frequency,
    extraPayments: [{ type: 'monthly_fixed', amount: extraPayment }],
    isCompoundSemiAnnual: isSemiAnnualCompound,
  });

  if (!base || !withExtra) {
    return {
      mortgageSaved: 0,
      investmentEarned: 0,
      betterOption: 'mortgage',
      monthlyInvestmentBalance: [],
    };
  }

  const mortgageSaved = roundCents(base.totalInterest - withExtra.totalInterest);

  // Calculate investment growth with compound returns
  const monthlyReturnRate = investReturnRate / 100 / 12;
  const totalMonths = amortizationYears * 12;
  let investmentBalance = 0;
  const monthlyBalances: number[] = [];

  for (let i = 0; i < totalMonths; i++) {
    investmentBalance += extraPayment;
    investmentBalance *= 1 + monthlyReturnRate;
    monthlyBalances.push(roundCents(investmentBalance));
  }

  const investmentEarned = roundCents(investmentBalance - extraPayment * totalMonths);

  return {
    mortgageSaved,
    investmentEarned,
    betterOption: mortgageSaved > investmentEarned ? 'mortgage' : 'invest',
    monthlyInvestmentBalance: monthlyBalances,
  };
}

/**
 * Compare multiple mortgage scenarios.
 */
export function compareScenarios(scenarios: ScenarioInput[]): ScenarioComparison {
  const results: ScenarioResult[] = scenarios.map((scenario) => ({
    label: scenario.label,
    result: computeMortgage(scenario)!,
    input: scenario,
  })).filter((r) => r.result !== null) as ScenarioResult[];

  if (results.length === 0) {
    return {
      scenarios: [],
      bestPayoffDate: '',
      bestInterestSaved: 0,
    };
  }

  // Find best scenario (earliest payoff, then lowest interest)
  const sorted = [...results].sort((a, b) => {
    if (a.result.payoffMonths !== b.result.payoffMonths) {
      return a.result.payoffMonths - b.result.payoffMonths;
    }
    return a.result.totalInterest - b.result.totalInterest;
  });

  return {
    scenarios: results,
    bestPayoffDate: sorted[0]!.result.payoffDate,
    bestInterestSaved: sorted[0]!.result.interestSaved,
  };
}

// Re-export types for backward compatibility
export type { MortgageInput as LegacyMortgageInput };

/**
 * Legacy wrapper: computeMortgage with old interface.
 * Maps old MortgageInput to new interface.
 */
export function computeMortgageLegacy(input: {
  principal: number;
  annualRate: number;
  termYears: number;
  startDate: string;
  extraPayments?: { month: number; amount: number }[];
}): MortgageResult | null {
  const legacyExtra: ExtraPaymentInput[] = (input.extraPayments ?? []).map((ep) => ({
    type: 'one_time' as const,
    amount: ep.amount,
    startMonth: ep.month,
  }));

  return computeMortgage({
    principal: input.principal,
    annualRate: input.annualRate,
    amortizationYears: input.termYears,
    startDate: input.startDate,
    paymentFrequency: 'monthly',
    extraPayments: legacyExtra,
    isCompoundSemiAnnual: false, // legacy used monthly compounding
  });
}

export interface ScenarioInput {
  label: string;
  principal: number;
  annualRate: number;
  amortizationYears: number;
  startDate: string;
  paymentFrequency: PaymentFrequency;
  extraPayments?: ExtraPaymentInput[];
  isCompoundSemiAnnual?: boolean;
}
