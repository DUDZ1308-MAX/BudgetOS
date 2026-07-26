import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/ui/RouteErrorBoundary';
import { NetworkStatus } from '@/components/ui/NetworkStatus';
import { router } from '@/router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export function AppProviders() {
  return (
    <ErrorBoundary>
      <NetworkStatus />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouteErrorBoundary>
            <RouterProvider router={router} />
          </RouteErrorBoundary>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
