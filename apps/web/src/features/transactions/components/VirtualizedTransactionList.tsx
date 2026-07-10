import { useState, useRef, useCallback, useEffect } from 'react';
import type { Transaction } from '@budgetos/database';
import { TransactionRow } from './TransactionRow';

const ROW_HEIGHT = 64;
const OVERSCAN = 5;

interface Props {
  transactions: Transaction[];
  accountsMap: Record<string, { name: string }>;
  categoriesMap: Record<string, { name: string; icon?: string | null }>;
  onArchive: (id: string) => void;
}

export function VirtualizedTransactionList({ transactions, accountsMap, categoriesMap, onArchive }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = transactions.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(transactions.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
  const visibleItems = transactions.slice(startIndex, endIndex);
  const offsetY = startIndex * ROW_HEIGHT;

  if (transactions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-auto"
      style={{ height: '100%', minHeight: '400px' }}
      role="list"
      aria-label="Transactions"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((txn) => (
            <div key={txn.id} style={{ height: ROW_HEIGHT }} role="listitem">
              <TransactionRow
                transaction={txn}
                accountName={txn.account_id ? accountsMap[txn.account_id]?.name ?? 'Unknown' : 'Unknown'}
                categoryName={txn.category_id ? categoriesMap[txn.category_id]?.name ?? 'Uncategorized' : 'Uncategorized'}
                categoryIcon={txn.category_id ? categoriesMap[txn.category_id]?.icon ?? null : null}
                onArchive={onArchive}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
