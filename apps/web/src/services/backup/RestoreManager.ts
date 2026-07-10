import { supabase } from '@/lib/supabase';
import type { BackupData } from './BackupManager';

export interface RestorePreview {
  totalEntities: number;
  totalRecords: number;
  byEntity: Record<string, { incoming: number; existing: number }>;
  conflicts: number;
}

export interface RestoreResult {
  success: boolean;
  restored: number;
  skipped: number;
  errors: string[];
}

export type RestoreMode = 'replace' | 'merge';

export class RestoreManager {
  async preview(backup: BackupData, userId: string): Promise<RestorePreview> {
    const existing = await this.fetchExistingCounts(userId);
    const byEntity: Record<string, { incoming: number; existing: number }> = {};
    let totalRecords = 0;

    for (const [entity, records] of Object.entries(backup as unknown as Record<string, unknown>)) {
      if (entity === '_meta' || !Array.isArray(records)) continue;
      byEntity[entity] = {
        incoming: records.length,
        existing: existing[entity] ?? 0,
      };
      totalRecords += records.length;
    }

    const conflicts = Object.values(byEntity).filter(
      (e) => e.incoming > 0 && e.existing > 0,
    ).length;

    return {
      totalEntities: Object.keys(byEntity).length,
      totalRecords,
      byEntity,
      conflicts,
    };
  }

  async restore(
    backup: BackupData,
    userId: string,
    mode: RestoreMode = 'merge',
    onProgress?: (current: number, total: number) => void,
  ): Promise<RestoreResult> {
    const entityOrder = ['categories', 'accounts', 'transactions', 'budgets', 'savings_goals', 'mortgages'];
    let restored = 0;
    let skipped = 0;
    const errors: string[] = [];

    const total = entityOrder.length;

    for (let i = 0; i < entityOrder.length; i++) {
      const entity = entityOrder[i]!;
      const records = (backup as unknown as Record<string, unknown>)[entity] as Record<string, unknown>[] | undefined;
      if (!records || records.length === 0) {
        onProgress?.(i + 1, total);
        continue;
      }

      try {
        if (mode === 'replace') {
          const { error: delErr } = await supabase
            .from(entity)
            .delete()
            .eq('user_id', userId);
          if (delErr) {
            errors.push(`${entity}: Failed to clear existing data — ${delErr.message}`);
            skipped += records.length;
            onProgress?.(i + 1, total);
            continue;
          }
        }

        const { error: insertErr } = await supabase
          .from(entity)
          .upsert(
            records.map((r) => ({ ...r, user_id: userId })),
            { onConflict: 'id', ignoreDuplicates: mode === 'merge' },
          );

        if (insertErr) {
          errors.push(`${entity}: Insert error — ${insertErr.message}`);
          skipped += records.length;
        } else {
          restored += records.length;
        }
      } catch (err) {
        errors.push(`${entity}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        skipped += records.length;
      }

      onProgress?.(i + 1, total);
    }

    return {
      success: errors.length === 0,
      restored,
      skipped,
      errors,
    };
  }

  private async fetchExistingCounts(userId: string): Promise<Record<string, number>> {
    const tables = ['transactions', 'categories', 'budgets', 'savings_goals', 'mortgages', 'accounts'];
    const entries = await Promise.all(
      tables.map(async (t) => {
        const { count } = await supabase
          .from(t)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        return [t, count ?? 0] as [string, number];
      }),
    );
    return Object.fromEntries(entries);
  }
}

export const restoreManager = new RestoreManager();
