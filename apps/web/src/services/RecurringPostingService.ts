import { supabase } from '@/lib/supabase';
import { calculateNextRun, isDue } from '@/engine/RecurringEngine';
import { createTransaction, getDueRecurringTransactions, updateRecurringTransaction } from '@budgetos/database';

export class RecurringPostingService {
  static async processDue(userId: string): Promise<{ posted: number; skipped: number }> {
    const today = new Date().toISOString().split('T')[0] ?? '';

    const { data: dueRecurrings } = await getDueRecurringTransactions(supabase, userId, today);
    if (!dueRecurrings || dueRecurrings.length === 0) {
      return { posted: 0, skipped: 0 };
    }

    let posted = 0;
    let skipped = 0;

    for (const recurring of dueRecurrings) {
      try {
        const alreadyPosted = await this.checkDuplicate(supabase, recurring.id, today);
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

  private static async checkDuplicate(client: typeof supabase, recurringId: string, date: string): Promise<boolean> {
    const { data } = await client
      .from('transactions')
      .select('id')
      .eq('recurring_id', recurringId)
      .eq('date', date)
      .maybeSingle();
    return !!data;
  }
}
