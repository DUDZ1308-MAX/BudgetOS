// Dates
export * from './dates';

// Recurring
export * from './recurring';

// Accounts
export * from './accounts';

// Transactions
export { toSignedAmount, formatCurrency, filterIncome, filterExpenses, filterActive, filterRecurring, filterManual, sumAmounts, sumIncome, sumExpenses, sumByCategory, sumByMerchant, sumByMonth } from './transactions';
export type { TransactionInput } from './transactions';

// Budget
export { calculateBudgetRemaining, calculateBudgetUsage, calculateBudgetVariance, calculateBudgetStatus, calculateCategoryTotals, calculatePercentBudget, calculateRollover, calculateMonthlyTotals, computeBudgetSummary, calculateBudgetAdherence } from './budget';
export type { BudgetInput, CategoryBudgetBreakdown, BudgetSummary } from './budget';

// Cash Flow
export { calculateMonthlyIncome, calculateMonthlyExpenses, calculateCashFlow, calculateNetFlow, calculateIncomeVsExpenseRatio, calculateBurnRate, calculateAverageMonthlySpend, calculateSafeToSpend, computeCashFlowSummary } from './cashFlow';
export type { DailyBalance, CashFlowSummary } from './cashFlow';

// Mortgage
export {
  generateAmortizationSchedule,
  calculateInterestSaved,
  calculatePayoffDate,
  calculateRemainingBalance,
  calculateExtraPaymentScenario,
  calculateInvestVsMortgage,
  computeMortgageDashboard,
  computeMortgage,
  computeEffectiveAnnualRate,
  compareScenarios,
  computeMortgageLegacy,
} from './mortgage';
export type {
  PaymentFrequency,
  MortgageInput,
  ExtraPaymentInput,
  AmortizationRow,
  MortgageResult,
  MortgageDashboard,
  ScenarioComparison,
  ScenarioResult,
  ScenarioInput,
  InvestVsMortgageResult,
} from './mortgage';

// Savings
export { calculateGoalProgress, calculateRemainingAmount, calculateRequiredMonthlyContribution, calculateGoalCompletionDate, calculateSavingsAllocation, calculateSurplus, computeGoalStatus, computeSavingsDashboard } from './savings';
export type { SavingsGoalInput, GoalProgressResult, SavingsDashboard } from './savings';

// Financial Health
export { calculateSavingsRate, calculateDebtToIncome, calculateEmergencyFundMonths, calculateNetWorthTrend, computeSavingsRateScore, computeEmergencyFundScore, computeDebtToIncomeScore, computeBudgetAdherenceScore, computeSpendingConsistencyScore, computeFinancialHealthScore } from './financialHealth';
export type { FinancialHealthFactors, FinancialHealthScore } from './financialHealth';

// Reports
export { computeIncomeVsExpense, computeCategoryBreakdown, computeMerchantTotals, computeMonthlyComparison, computeYearOverYearComparison, computeNetWorthTrend, computeRecurringVsManual } from './reports';
export type { IncomeVsExpenseReport, CategoryBreakdownReport, MerchantTotalReport, MonthlyComparisonReport, YearOverYearReport, RecurringVsManualReport } from './reports';
