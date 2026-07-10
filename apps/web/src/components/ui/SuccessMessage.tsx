interface Props {
  message: string;
  onDismiss?: () => void;
}

export function SuccessMessage({ message, onDismiss }: Props) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950" role="status">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="flex-1 text-sm font-medium text-emerald-800 dark:text-emerald-200">{message}</p>
        {onDismiss && (
          <button onClick={onDismiss} className="text-emerald-400 hover:text-emerald-600" aria-label="Dismiss">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
