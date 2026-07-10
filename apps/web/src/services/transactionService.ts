import { z } from 'zod';

export const transactionFormSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().min(1, 'Category is required'),
  account_id: z.string().min(1, 'Account is required'),
  date: z.string().min(1, 'Date is required'),
  merchant: z.string().optional(),
  note: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;

export function toSignedAmount(amount: number, type: 'income' | 'expense'): number {
  return type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
}

export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCurrency(value: number): string {
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
}
