export interface AccountInput {
  id: string;
  name: string;
  type: string;
  balance: number;
  is_active: boolean;
}

export function categorizeAccountType(type: string): 'asset' | 'liability' {
  const t = type.toLowerCase();
  if (['credit', 'loan'].includes(t)) return 'liability';
  return 'asset';
}

export function calculateNetWorth(accounts: AccountInput[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function calculateTotalAssets(accounts: AccountInput[]): number {
  return accounts
    .filter((a) => categorizeAccountType(a.type) === 'asset')
    .reduce((sum, a) => sum + a.balance, 0);
}

export function calculateTotalLiabilities(accounts: AccountInput[]): number {
  return Math.abs(
    accounts
      .filter((a) => categorizeAccountType(a.type) === 'liability')
      .reduce((sum, a) => sum + a.balance, 0),
  );
}

export function calculateAvailableCash(accounts: AccountInput[]): number {
  const assets = calculateTotalAssets(accounts);
  const liabilities = calculateTotalLiabilities(accounts);
  return assets - liabilities;
}

export function calculateRunningBalance(
  currentBalance: number,
  amount: number,
  type: 'income' | 'expense' | 'transfer',
): number {
  if (type === 'income') return currentBalance + Math.abs(amount);
  if (type === 'expense') return currentBalance - Math.abs(amount);
  return currentBalance;
}

export function calculateAccountBalance(
  transactions: { amount: number; type: string }[],
): number {
  return transactions.reduce((balance, txn) => {
    if (txn.type === 'income') return balance + Math.abs(txn.amount);
    if (txn.type === 'expense') return balance - Math.abs(txn.amount);
    return balance;
  }, 0);
}

export function calculateTransfer(
  fromBalance: number,
  toBalance: number,
  amount: number,
): { fromBalance: number; toBalance: number } {
  return {
    fromBalance: fromBalance - Math.abs(amount),
    toBalance: toBalance + Math.abs(amount),
  };
}

export function getActiveAccounts(accounts: AccountInput[]): AccountInput[] {
  return accounts.filter((a) => a.is_active);
}
