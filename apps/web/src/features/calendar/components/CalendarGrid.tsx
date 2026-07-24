import { useMemo } from 'react';
import type { CalendarEvent } from '@/lib/dashboard/types';
import { EventChip } from './EventChip';

interface CalendarGridProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({ year, month, events, selectedDate, onSelectDate }: CalendarGridProps) {
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      cells.push({
        date: new Date(year, month - 1, d).toISOString().slice(0, 10),
        day: d,
        isCurrentMonth: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: new Date(year, month, d).toISOString().slice(0, 10),
        day: d,
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        date: new Date(year, month + 1, d).toISOString().slice(0, 10),
        day: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month]);

  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const existing = map.get(e.date);
      if (existing) existing.push(e);
      else map.set(e.date, [e]);
    }
    return map;
  }, [events]);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-semibold text-gray-500 py-2 uppercase tracking-wider">
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-white/5 rounded-lg overflow-hidden">
        {days.map(({ date, day, isCurrentMonth }) => {
          const dayEvents = eventMap.get(date) ?? [];
          const isSelected = date === selectedDate;
          const isToday = date === todayStr;

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`
                min-h-[80px] p-1.5 flex flex-col gap-0.5 text-left transition-colors
                ${isCurrentMonth ? 'bg-white/5' : 'bg-white/[0.02]'}
                ${isSelected ? 'ring-2 ring-cyan-400 ring-inset' : ''}
                ${isToday ? 'bg-cyan-500/10' : ''}
                hover:bg-white/10 cursor-pointer
              `}
            >
              <span
                className={`
                  text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-cyan-500 text-white' : ''}
                  ${!isCurrentMonth ? 'text-gray-600' : 'text-gray-300'}
                `}
              >
                {day}
              </span>
              <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventChip key={e.id} event={e} compact />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-gray-500 font-medium pl-1">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
