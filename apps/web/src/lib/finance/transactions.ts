export interface TransactionInput {
  id: string;
  account_id: string | null;
  category_id: string | null;
  amount: number;
  date: string;
  merchant: string | null;
  note: string | null;
  is_archived: boolean;
  type?: 'income' | 'expense' | 'transfer';
  recurring_id?: string | null;
}

export function toSignedAmount(amount: number, type: 'income' | 'expense'): number {
  if (type === 'expense') return -Math.abs(amount);
  return Math.abs(amount);
}

export function absAmount(amount: number): number {
  return Math.abs(amount);
}

export function filterIncome(transactions: TransactionInput[]): TransactionInput[] {
  return transactions.filter((t) => !t.is_archived && (t.type === 'income' || t.amount > 0));
}

export function filterExpenses(transactions: TransactionInput[]): TransactionInput[] {
  return transactions.filter((t) => !t.is_archived && (t.type === 'expense' || t.amount < 0));
}

export function filterActive(transactions: TransactionInput[]): TransactionInput[] {
  return transactions.filter((t) => !t.is_archived);
}

export function filterRecurring(transactions: TransactionInput[]): TransactionInput[] {
  return transactions.filter((t) => !!t.recurring_id);
}

export function filterManual(transactions: TransactionInput[]): TransactionInput[] {
  return transactions.filter((t) => !t.recurring_id);
}

export function sumAmounts(transactions: TransactionInput[]): number {
  return filterActive(transactions).reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function sumIncome(transactions: TransactionInput[]): number {
  return filterIncome(transactions).reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function sumExpenses(transactions: TransactionInput[]): number {
  return filterExpenses(transactions).reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function sumByCategory(
  transactions: TransactionInput[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const t of filterActive(transactions)) {
    const catId = t.category_id ?? '__uncategorized__';
    result[catId] = (result[catId] ?? 0) + Math.abs(t.amount);
  }
  return result;
}

export function sumByMerchant(
  transactions: TransactionInput[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const t of filterActive(transactions)) {
    const merchant = t.merchant ?? '__unknown__';
    result[merchant] = (result[merchant] ?? 0) + Math.abs(t.amount);
  }
  return result;
}

export function sumByMonth(
  transactions: TransactionInput[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const t of filterActive(transactions)) {
    const monthKey = t.date.slice(0, 7);
    result[monthKey] = (result[monthKey] ?? 0) + Math.abs(t.amount);
  }
  return result;
}

export function formatCurrency(value: number): string {
  return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
