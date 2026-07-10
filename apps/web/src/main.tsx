import React from 'react';
import ReactDOM from 'react-dom/client';
import { useAuthStore } from '@/stores/auth';
import { SubscriptionService } from '@/billing/subscriptionService';
import { AppProviders } from '@/providers/AppProviders';
import '@/styles/globals.css';

// Initialize auth session and onAuthStateChange listener before first render
useAuthStore.getState().initialize();

// Initialize billing subscription state from localStorage
SubscriptionService.init();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>,
);
