export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  }
  return fallback;
}

export function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

export function safeString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  return fallback;
}

export function safeDate(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return fallback;
}

export function safeDivide(a: number, b: number, fallback = 0): number {
  if (b === 0 || !Number.isFinite(b)) return fallback;
  const result = a / b;
  return Number.isFinite(result) ? result : fallback;
}

export function safePercent(part: number, total: number): number {
  if (total <= 0 || !Number.isFinite(part)) return 0;
  const pct = (part / total) * 100;
  return Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
}

export function safeSubtract(a: number, b: number): number {
  const result = a - b;
  return Number.isFinite(result) ? Math.max(0, result) : 0;
}
