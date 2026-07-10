import { Suspense, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  name?: string;
}

export function SuspenseWrapper({ children, name }: Props) {
  return (
    <Suspense fallback={<PageSkeleton name={name} />}>
      {children}
    </Suspense>
  );
}

function PageSkeleton({ name }: { name?: string }) {
  return (
    <div className="animate-pulse space-y-4 p-6" role="status" aria-label={`Loading ${name ?? 'page'}`}>
      <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 w-96 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
