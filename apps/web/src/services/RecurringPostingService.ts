import { supabase } from '@/lib/supabase';
import { calculateNextRun, isDue, checkDuplicateOccurrence } from '@/engine/RecurringEngine';
import { createTransaction, getDueRecurringTransactions, updateRecurringTransaction } from '@budgetos/database';
import type { RecurringTransaction } from '@budgetos/database';

export interface PostingPreview {
  recurringId: string;
  name: string;
  amount: number;
  type: string;
  date: string;
  accountId: string | null;
  categoryId: string | null;
  isDuplicate: boolean;
  skipped: boolean;
  reason?: string;
}

export class RecurringPostingService {
  static async getDue(userId: string, asOfDate?: string): Promise<RecurringTransaction[]> {
    const today = asOfDate ?? new Date().toISOString().split('T')[0] ?? '';
    const { data: dueRecurrings } = await getDueRecurringTransactions(supabase, userId, today);
    return dueRecurrings ?? [];
  }

  static async previewDue(userId: string, recurringIds?: string[]): Promise<PostingPreview[]> {
    const today = new Date().toISOString().split('T')[0] ?? '';
    const allDue = await this.getDue(userId, today);
    const items = recurringIds ? allDue.filter((r) => recurringIds.includes(r.id)) : allDue;

    const previews: PostingPreview[] = [];
    for (const recurring of items) {
      const alreadyPosted = await checkDuplicateOccurrence(supabase, recurring.id, today);
      previews.push({
        recurringId: recurring.id,
        name: recurring.name,
        amount: Math.abs(Number(recurring.amount)),
        type: recurring.type,
        date: today,
        accountId: recurring.account_id,
        categoryId: recurring.category_id,
        isDuplicate: alreadyPosted,
        skipped: alreadyPosted || !recurring.account_id,
        reason: alreadyPosted ? 'Already posted today' : !recurring.account_id ? 'No account linked' : undefined,
      });
    }
    return previews;
  }

  static async processDue(userId: string, recurringIds?: string[]): Promise<{ posted: number; skipped: number }> {
    const today = new Date().toISOString().split('T')[0] ?? '';

    let dueRecurrings: RecurringTransaction[];
    if (recurringIds) {
      const allDue = await this.getDue(userId, today);
      dueRecurrings = allDue.filter((r) => recurringIds.includes(r.id));
    } else {
      dueRecurrings = await this.getDue(userId, today);
    }

    if (dueRecurrings.length === 0) {
      return { posted: 0, skipped: 0 };
    }

    let posted = 0;
    let skipped = 0;

    for (const recurring of dueRecurrings) {
      try {
        const alreadyPosted = await checkDuplicateOccurrence(supabase, recurring.id, today);
        if (alreadyPosted) {
          skipped++;
          continue;
        }

        if (!recurring.account_id) {
          skipped++;
          continue;
        }

        await createTransaction(supabase, userId, {
          account_id: recurring.account_id,
          category_id: recurring.category_id,
          amount: recurring.amount,
          date: today,
          merchant: recurring.name,
          note: recurring.description,
          recurring_id: recurring.id,
        });

        const nextRun = calculateNextRun({
          startDate: recurring.start_date,
          endDate: recurring.end_date,
          frequency: recurring.frequency,
          intervalCount: recurring.interval_count,
          dayOfWeek: recurring.day_of_week,
          dayOfMonth: recurring.day_of_month,
          monthOfYear: recurring.month_of_year,
          lastRun: today,
        });

        const isCompleted = recurring.end_date ? nextRun > recurring.end_date : false;

        await updateRecurringTransaction(supabase, recurring.id, {
          last_run: today,
          next_run: nextRun,
          status: isCompleted ? 'completed' : 'active',
        });

        posted++;
      } catch {
        skipped++;
      }
    }

    return { posted, skipped };
  }
}
