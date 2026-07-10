import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/core/logger';
import { monitor } from '@/core/monitoring';

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const context = this.props.routeName ?? 'route';
    logger.error(`Route error: ${context}`, 'RouteErrorBoundary', error, {
      componentStack: info.componentStack,
    });
    monitor.error(error, context, { route: context });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center" role="alert">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
            This section encountered an error
          </h3>
          <p className="mb-6 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Something went wrong loading this page. You can try again or reload the application.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              Try again
            </button>
            <button
              onClick={this.handleReload}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Reload app
            </button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 max-w-lg text-left">
              <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">Error details</summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-red-600 dark:bg-slate-800 dark:text-red-400">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
