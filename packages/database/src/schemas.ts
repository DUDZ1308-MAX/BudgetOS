import { z } from 'zod';

const accountTypeEnum = z.enum(['checking', 'savings', 'credit', 'loan', 'investment', 'cash']);
const categoryTypeEnum = z.enum(['income', 'expense']);

export const accountInsertSchema = z.object({
  name: z.string().min(1).max(255),
  type: accountTypeEnum,
  balance: z.number().finite().default(0),
  currency: z.string().length(3).default('USD'),
  is_active: z.boolean().default(true),
});

export const accountUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: accountTypeEnum.optional(),
  balance: z.number().finite().optional(),
  currency: z.string().length(3).optional(),
  is_active: z.boolean().optional(),
});

export const categoryInsertSchema = z.object({
  name: z.string().min(1).max(255),
  type: categoryTypeEnum,
  icon: z.string().max(64).nullable().optional(),
  color: z.string().max(7).nullable().optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: categoryTypeEnum.optional(),
  icon: z.string().max(64).nullable().optional(),
  color: z.string().max(7).nullable().optional(),
  is_archived: z.boolean().optional(),
});

export const transactionInsertSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  amount: z.number().finite(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  merchant: z.string().max(255).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
});

export const transactionUpdateSchema = z.object({
  account_id: z.string().uuid().optional(),
  category_id: z.string().uuid().nullable().optional(),
  amount: z.number().finite().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional(),
  merchant: z.string().max(255).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  is_archived: z.boolean().optional(),
});

export const budgetInsertSchema = z.object({
  category_id: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  amount: z.number().finite().min(0),
  rollover: z.boolean().default(false),
});

export const budgetUpdateSchema = z.object({
  category_id: z.string().uuid().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  amount: z.number().finite().min(0).optional(),
  rollover: z.boolean().optional(),
});

export const transactionFiltersSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  is_archived: z.boolean().optional(),
});
