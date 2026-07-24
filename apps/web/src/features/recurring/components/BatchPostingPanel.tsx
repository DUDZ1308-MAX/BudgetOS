import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { RecurringPostingService } from '@/services/RecurringPostingService';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import type { PostingPreview } from '@/services/RecurringPostingService';

interface Props {
  userId: string;
  onComplete: () => void;
}

export function BatchPostingPanel({ userId, onComplete }: Props) {
  const [previews, setPreviews] = useState<PostingPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<{ posted: number; skipped: number } | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const items = await RecurringPostingService.previewDue(userId);
      setPreviews(items);
      setSelectedIds(new Set(items.filter((i) => !i.skipped).map((i) => i.recurringId)));
      setShowPreview(true);
      setResult(null);
    } catch (err) {
      addToast('error', 'Failed to load due transactions');
    } finally {
      setLoading(false);
    }
  }, [userId, addToast]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === previews.filter((p) => !p.skipped).length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(previews.filter((p) => !p.skipped).map((p) => p.recurringId)));
    }
  }, [previews, selectedIds]);

  const handleRunSelected = useCallback(async () => {
    if (selectedIds.size === 0) {
      addToast('info', 'No transactions selected');
      return;
    }
    setPosting(true);
    try {
      const res = await RecurringPostingService.processDue(userId, [...selectedIds]);
      setResult(res);
      addToast('success', `Posted ${res.posted} transaction${res.posted !== 1 ? 's' : ''}${res.skipped > 0 ? ` (${res.skipped} skipped)` : ''}`);
      if (res.posted > 0) onComplete();
      loadPreview();
    } catch (err) {
      addToast('error', 'Failed to post transactions');
    } finally {
      setPosting(false);
    }
  }, [userId, selectedIds, addToast, onComplete, loadPreview]);

  const handleRunAll = useCallback(async () => {
    const allIds = previews.filter((p) => !p.skipped).map((p) => p.recurringId);
    setSelectedIds(new Set(allIds));
    setPosting(true);
    try {
      const res = await RecurringPostingService.processDue(userId, allIds);
      setResult(res);
      addToast('success', `Posted ${res.posted} transaction${res.posted !== 1 ? 's' : ''}${res.skipped > 0 ? ` (${res.skipped} skipped)` : ''}`);
      if (res.posted > 0) onComplete();
      loadPreview();
    } catch (err) {
      addToast('error', 'Failed to post transactions');
    } finally {
      setPosting(false);
    }
  }, [userId, previews, addToast, onComplete, loadPreview]);

  const dueCount = previews.filter((p) => !p.skipped).length;
  const skippedCount = previews.filter((p) => p.skipped).length;

  return (
    <div>
      <button
        onClick={loadPreview}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Run Due Transactions'}
      </button>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300">
                Preview — {dueCount} due{skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}
              </h3>
              <div className="flex items-center gap-2">
                {result && (
                  <span className="text-xs text-emerald-400">
                    ✓ Posted {result.posted}
                  </span>
                )}
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Close
                </button>
              </div>
            </div>

            {previews.length > 0 && (
              <div className="mb-3 flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === previews.filter((p) => !p.skipped).length && previews.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-600"
                  />
                  Select all
                </label>
              </div>
            )}

            <div className="space-y-1 max-h-60 overflow-y-auto mb-3">
              {previews.map((p) => (
                <div
                  key={p.recurringId}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    p.skipped ? 'opacity-50' : 'hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.recurringId)}
                    onChange={() => toggleSelect(p.recurringId)}
                    disabled={p.skipped}
                    className="rounded border-gray-600"
                  />
                  <span className="flex-1 font-medium text-gray-200 truncate">{p.name}</span>
                  <span className={`text-xs font-semibold ${p.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {p.type === 'income' ? '+' : '-'}${p.amount.toFixed(2)}
                  </span>
                  {p.reason && (
                    <span className="text-[10px] text-gray-500 italic">{p.reason}</span>
                  )}
                </div>
              ))}
              {previews.length === 0 && (
                <p className="text-sm text-gray-500 py-4 text-center">No transactions due</p>
              )}
            </div>

            {previews.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunSelected}
                  disabled={posting || selectedIds.size === 0}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {posting ? 'Posting...' : `Run Selected (${selectedIds.size})`}
                </button>
                <button
                  onClick={handleRunAll}
                  disabled={posting || dueCount === 0}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {posting ? 'Posting...' : `Run All Due (${dueCount})`}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
