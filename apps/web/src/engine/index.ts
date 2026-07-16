export {
  daysInMonth, daysBetween, parseDate, formatDateISO, currentMonthRange,
  sameMonth, isInRange, monthDiff, daysRemainingInMonth, todayISO,
  calculateNextRun, getNextRunAfterRun, isDue, getUpcoming,
  daysUntilNextRun, isRecurringDueToday,
  categorizeAccountType, calculateNetWorth, calculateTotalAssets,
  calculateTotalLiabilities, calculateAvailableCash, calculateRunningBalance,
  calculateAccountBalance, calculateTransfer, getActiveAccounts,
  toSignedAmount, formatCurrency,
  filterIncome, filterExpenses, filterActive,
  filterRecurring, filterManual,
  sumAmounts, sumIncome, sumExpenses,
  sumByCategory, sumByMerchant, sumByMonth,
  calculateBudgetRemaining, calculateBudgetUsage, calculateBudgetVariance,
  calculateBudgetStatus, calculateCategoryTotals, calculatePercentBudget,
  calculateRollover, calculateMonthlyTotals,
  calculateBudgetAdherence,
  calculateMonthlyIncome, calculateMonthlyExpenses, calculateCashFlow,
  calculateNetFlow, calculateIncomeVsExpenseRatio, calculateBurnRate,
  calculateAverageMonthlySpend, calculateSafeToSpend,
  generateAmortizationSchedule, calculateInterestSaved,
  calculatePayoffDate, calculateRemainingBalance, calculateExtraPaymentScenario,
  calculateInvestVsMortgage, computeMortgageDashboard, computeMortgage,
  computeEffectiveAnnualRate, compareScenarios, computeMortgageLegacy,
  calculateGoalProgress, calculateRemainingAmount,
  calculateRequiredMonthlyContribution, calculateGoalCompletionDate,
  calculateSavingsAllocation, calculateSurplus, computeGoalStatus,
  computeSavingsDashboard,
  calculateSavingsRate, calculateDebtToIncome, calculateEmergencyFundMonths,
  calculateNetWorthTrend, computeSavingsRateScore, computeEmergencyFundScore,
  computeDebtToIncomeScore, computeBudgetAdherenceScore,
  computeSpendingConsistencyScore, computeFinancialHealthScore,
  computeIncomeVsExpense, computeCategoryBreakdown, computeMerchantTotals,
  computeMonthlyComparison, computeYearOverYearComparison, computeNetWorthTrend,
  computeRecurringVsManual,
} from '@/lib/finance';

export { computeBudgetSummary, createEmptyBudgetSummary } from './BudgetEngine';
export { computeCashFlowSummary } from './CashFlowEngine';

export type {
  DailyBalance, CashFlowSummary, BudgetSummary, CategoryBudgetBreakdown,
  BudgetInput, SavingsGoalInput, GoalProgressResult, SavingsDashboard,
  MortgageInput, ExtraPaymentInput, AmortizationRow, MortgageResult,
  MortgageDashboard, TransactionInput, FinancialHealthFactors,
  FinancialHealthScore, IncomeVsExpenseReport, CategoryBreakdownReport,
  MerchantTotalReport, MonthlyComparisonReport, YearOverYearReport,
  RecurringVsManualReport, AccountInput, ScheduleInput, ScheduleFrequency,
  PaymentFrequency, ScenarioComparison, ScenarioResult, ScenarioInput,
  InvestVsMortgageResult,
} from '@/lib/finance';

// Legacy types re-exports
export type { EngineTransaction, EngineAccount, EngineCategory, EngineBudget } from './types';
export type { BudgetEngineInput, CashFlowEngineInput } from './types';
export type { Insight, InsightType, InsightCategory, InsightEngineInput } from './types';
export type { SafeToSpendInput, SafeToSpendResult, Alert, CategoryBreakdown, CategoryBudgetStatus, DailyBalance as EngineDailyBalance } from './types';
