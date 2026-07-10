import type { Transaction, Account, Category } from '@budgetos/database';
import { TransactionRow } from './TransactionRow';
import { EmptyState } from './EmptyState';
import { VirtualizedTransactionList } from './VirtualizedTransactionList';

const VIRTUALIZE_THRESHOLD = 50;

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onArchive: (id: string) => void;
}

export function TransactionList({ transactions, accounts, categories, onArchive }: TransactionListProps) {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountsMap: Record<string, { name: string }> = {};
  for (const a of accounts) accountsMap[a.id] = { name: a.name };
  const categoriesMap: Record<string, { name: string; icon?: string | null }> = {};
  for (const c of categories) categoriesMap[c.id] = { name: c.name, icon: c.icon };

  if (transactions.length === 0) {
    return <EmptyState />;
  }

  if (transactions.length > VIRTUALIZE_THRESHOLD) {
    return (
      <VirtualizedTransactionList
        transactions={transactions}
        accountsMap={accountsMap}
        categoriesMap={categoriesMap}
        onArchive={onArchive}
      />
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((txn) => {
        const category = txn.category_id ? categoryMap.get(txn.category_id) : undefined;
        return (
          <TransactionRow
            key={txn.id}
            transaction={txn}
            accountName={txn.account_id ? accountMap.get(txn.account_id) ?? null : null}
            categoryName={category?.name ?? null}
            categoryIcon={category?.icon ?? null}
            onArchive={onArchive}
          />
        );
      })}
    </div>
  );
}
