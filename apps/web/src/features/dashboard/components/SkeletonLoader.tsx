interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
  variant?: 'text' | 'card' | 'circle';
}

export function SkeletonLoader({ lines = 1, className = '', variant = 'text' }: SkeletonLoaderProps) {
  if (variant === 'circle') {
    return (
      <div className={`h-10 w-10 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700 ${className}`} role="status" aria-label="Loading" />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`space-y-3 ${className}`} role="status" aria-label="Loading">
        <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-1/2 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-8 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700"
          style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
        />
      ))}
    </div>
  );
}
