export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = e.getTime() - s.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
}

export function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1] ?? 1);
  const d = Number(parts[2] ?? 1);
  return new Date(y, m - 1, d);
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = daysInMonth(y, m);
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export function sameMonth(dateStr: string, year: number, month: number): boolean {
  const [y, m] = dateStr.split('-').map(Number);
  return y === year && m === month;
}

export function isInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}

export function monthDiff(start: string, end: string): number {
  const [sy = '0', sm = '0'] = start.split('-');
  const [ey = '0', em = '0'] = end.split('-');
  return (Number(ey) - Number(sy)) * 12 + (Number(em) - Number(sm));
}

export function daysRemainingInMonth(): number {
  const now = new Date();
  const totalDays = daysInMonth(now.getFullYear(), now.getMonth() + 1);
  return Math.max(0, totalDays - now.getDate() + 1);
}

export function todayISO(): string {
  return formatDateISO(new Date());
}
