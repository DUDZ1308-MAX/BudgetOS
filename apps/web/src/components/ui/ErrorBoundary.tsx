import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/core/logger';
import { monitor } from '@/core/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('ErrorBoundary caught an error', 'ErrorBoundary', error, { componentStack: info.componentStack });
    monitor.error(error, 'ErrorBoundary');
    this.props.onError?.(error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
          <div className="mb-4 text-5xl text-slate-300 dark:text-slate-600">!</div>
          <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">Something went wrong</h3>
          <p className="mb-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
