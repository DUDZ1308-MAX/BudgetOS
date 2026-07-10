import { z } from 'zod';

export const safeNumber = z.number().finite().safe();
export const nonNegativeNumber = safeNumber.min(0);
export const positiveNumber = safeNumber.min(0.01);
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');
export const idString = z.string().min(1, 'ID must not be empty');
export const nameString = z.string().min(1, 'Name must not be empty').max(200);

export const accountSchema = z.object({
  id: idString,
  user_id: idString,
  name: nameString,
  type: z.enum(['checking', 'savings', 'credit', 'investment', 'loan', 'cash']),
  balance: safeNumber,
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
});

export const categorySchema = z.object({
  id: idString,
  user_id: idString,
  name: nameString,
  type: z.enum(['income', 'expense']),
  is_archived: z.boolean().default(false),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const transactionSchema = z.object({
  id: idString,
  user_id: idString,
  account_id: idString,
  category_id: idString.nullable().default(null),
  amount: z.number().finite(),
  date: dateString,
  merchant: z.string().nullable().default(null),
  note: z.string().nullable().default(null),
  is_archived: z.boolean().default(false),
  is_recurring: z.boolean().default(false),
  recurring_id: z.string().nullable().default(null),
});

export const budgetSchema = z.object({
  id: idString,
  user_id: idString,
  category_id: idString,
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  amount: nonNegativeNumber,
  rollover: z.boolean().default(false),
  created_at: z.string().optional(),
});

export const savingsGoalSchema = z.object({
  id: idString,
  user_id: idString,
  name: nameString,
  target_amount: positiveNumber,
  current_amount: nonNegativeNumber.default(0),
  target_date: dateString.nullable().default(null),
  priority: z.number().int().min(1).max(5).default(3),
  status: z.enum(['active', 'completed', 'cancelled', 'archived']).default('active'),
  created_at: z.string().optional(),
});

export const contributionSchema = z.object({
  id: idString,
  goal_id: idString,
  amount: positiveNumber,
  date: dateString,
  notes: z.string().nullable().default(null),
  created_at: z.string().optional(),
});

export const mortgageSchema = z.object({
  id: idString,
  user_id: idString,
  name: nameString,
  principal: positiveNumber,
  annual_rate: z.number().min(0).max(100),
  term_years: z.number().int().min(1).max(50),
  start_date: dateString,
  extra_payment: nonNegativeNumber.default(0),
  created_at: z.string().optional(),
});

export const extraPaymentSchema = z.object({
  id: idString,
  mortgage_id: idString,
  amount: positiveNumber,
  date: dateString,
  notes: z.string().nullable().default(null),
  created_at: z.string().optional(),
});
