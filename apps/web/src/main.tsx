import React from 'react';
import ReactDOM from 'react-dom/client';
import { useAuthStore } from '@/stores/auth';
import { SubscriptionService } from '@/billing/subscriptionService';
import { initGlobalErrorCapture } from '@/core/monitoring/globalErrorCapture';
import { AppProviders } from '@/providers/AppProviders';
import '@/styles/globals.css';

// Initialize auth session and onAuthStateChange listener before first render
useAuthStore.getState().initialize();

// Initialize billing subscription state from localStorage
SubscriptionService.init();

// Initialize global error capture for production monitoring
initGlobalErrorCapture();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>,
);
