import {
  accountSchema, categorySchema, transactionSchema, budgetSchema,
  savingsGoalSchema, contributionSchema, mortgageSchema, extraPaymentSchema,
} from './schemas';
import type { z } from 'zod';

export type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: string[]; sanitized: Partial<T> };

function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
}

export function validateAccount(data: unknown) {
  const parsed = accountSchema.safeParse(data);
  if (parsed.success) return { valid: true as const, data: parsed.data };
  return { valid: false as const, errors: formatZodErrors(parsed.error), sanitized: parsed.error.issues.reduce<Record<string, unknown>>((acc, i) => { acc[i.path[0] as string] = (data as any)?.[i.path[0] as string] ?? undefined; return acc; }, {}) };
}

export function validateCategory(data: unknown) {
  const parsed = categorySchema.safeParse(data);
  if (parsed.success) return { valid: true as const, data: parsed.data };
  return { valid: false as const, errors: formatZodErrors(parsed.error), sanitized: {} };
}

export function validateTransaction(data: unknown) {
  const parsed = transactionSchema.safeParse(data);
  if (parsed.success) return { valid: true as const, data: parsed.data };
  return { valid: false as const, errors: formatZodErrors(parsed.error), sanitized: {} };
}

export function validateBudget(data: unknown) {
  const parsed = budgetSchema.safeParse(data);
  if (parsed.success) return { valid: true as const, data: parsed.data };
  return { valid: false as const, errors: formatZodErrors(parsed.error), sanitized: {} };
}

export function validateSavingsGoal(data: unknown) {
  const parsed = savingsGoalSchema.safeParse(data);
  if (parsed.success) return { valid: true as const, data: parsed.data };
  return { valid: false as const, errors: formatZodErrors(parsed.error), sanitized: {} };
}

export function validateContribution(data: unknown) {
  const parsed = contributionSchema.safeParse(data);
  if (parsed.success) return { valid: true as const, data: parsed.data };
  return { valid: false as const, errors: formatZodErrors(parsed.error), sanitized: {} };
}

export function validateMortgage(data: unknown) {
  const parsed = mortgageSchema.safeParse(data);
  if (parsed.success) return { valid: true as const, data: parsed.data };
  return { valid: false as const, errors: formatZodErrors(parsed.error), sanitized: {} };
}

export function validateExtraPayment(data: unknown) {
  const parsed = extraPaymentSchema.safeParse(data);
  if (parsed.success) return { valid: true as const, data: parsed.data };
  return { valid: false as const, errors: formatZodErrors(parsed.error), sanitized: {} };
}
