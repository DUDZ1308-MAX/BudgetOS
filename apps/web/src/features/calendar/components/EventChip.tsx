import type { CalendarEvent } from '@/lib/dashboard/types';

const typeColors: Record<string, string> = {
  income: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  expense: 'bg-red-500/20 text-red-400 border-red-500/30',
  mortgage: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  contribution: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  transfer: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  bill: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  payment: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

export function EventChip({ event, compact }: { event: CalendarEvent; compact?: boolean }) {
  const colors = typeColors[event.type] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  if (compact) {
    return (
      <div
        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium border ${colors} cursor-pointer hover:opacity-80 transition-opacity`}
        title={`${event.title}: $${event.amount.toFixed(2)}`}
      >
        {event.title}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs border ${colors} cursor-pointer hover:opacity-80 transition-opacity`}
      title={`${event.title}: $${event.amount.toFixed(2)}`}
    >
      <span className="truncate font-medium">{event.title}</span>
      <span className="tabular-nums ml-2 font-semibold">${event.amount.toFixed(0)}</span>
    </div>
  );
}
