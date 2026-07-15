interface EmptyStateProps {
  message: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

export function EmptyState({ message, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
      {description && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
