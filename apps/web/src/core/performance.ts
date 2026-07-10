export function memoize<T extends (...args: any[]) => any>(fn: T, keyFn?: (...args: Parameters<T>) => string): T {
  const cache = new Map<string, ReturnType<T>>();
  const getKey = keyFn ?? ((...args: Parameters<T>) => JSON.stringify(args));
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(...args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    if (result !== null && result !== undefined) {
      cache.set(key, result);
    }
    return result;
  }) as T;
}

export function memoizeWithLimit<T extends (...args: any[]) => any>(fn: T, maxSize = 50, keyFn?: (...args: Parameters<T>) => string): T {
  const cache = new Map<string, ReturnType<T>>();
  const keyOrder: string[] = [];
  const getKey = keyFn ?? ((...args: Parameters<T>) => JSON.stringify(args));
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(...args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    if (result !== null && result !== undefined) {
      if (keyOrder.length >= maxSize) {
        const oldest = keyOrder.shift()!;
        cache.delete(oldest);
      }
      keyOrder.push(key);
      cache.set(key, result);
    }
    return result;
  }) as T;
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delayMs: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delayMs);
  };
}

export function throttle<T extends (...args: any[]) => any>(fn: T, limitMs: number): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limitMs);
    }
  };
}

export function clearMemoCache(fn: Function): void {
  (fn as any)._cache?.clear();
}
