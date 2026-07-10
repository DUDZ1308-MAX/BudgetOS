import { z } from 'zod';

export const accountFormSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(255),
  type: z.enum(['checking', 'savings', 'cash', 'credit', 'loan', 'investment']),
  balance: z.number().finite().default(0),
});

export type AccountFormData = z.infer<typeof accountFormSchema>;
