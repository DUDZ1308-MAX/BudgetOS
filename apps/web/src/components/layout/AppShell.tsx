import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { SkipNav } from '@/components/ui/SkipNav';
import { NetworkStatus } from '@/components/ui/NetworkStatus';
import { ToastContainer } from '@/components/ui/Toast';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { AnnouncementBanner } from '@/components/ui/AnnouncementBanner';
import { FeedbackWidget } from '@/components/ui/FeedbackWidget';
import { OnboardingWizard } from '@/components/ui/OnboardingWizard';
import { WhatsNewModal } from '@/components/ui/WhatsNewModal';
import { DebugPanel } from '@/core/dev/DebugPanel';
import { useDemoStore } from '@/stores/demoMode';
import { useOnboardingStore } from '@/stores/onboarding';
import { useAuthStore } from '@/stores/auth';
import { useFeatureFlagsStore } from '@/stores/featureFlags';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const isDemo = useDemoStore((s) => s.isDemo);
  const { start } = useOnboardingStore();

  useEffect(() => {
    if (!user || isDemo) return;
    const timer = setTimeout(() => start(), 1000);
    return () => clearTimeout(timer);
  }, [user, isDemo, start]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <SkipNav />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DemoBanner />
        <AnnouncementBanner />
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main id="main-content" role="main" className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          <NetworkStatus />
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
        <MobileNav />
      </div>
      <FeedbackWidget />
      <OnboardingWizard />
      <WhatsNewModal />
      <ToastContainer />
      <DebugPanel />
    </div>
  );
}
