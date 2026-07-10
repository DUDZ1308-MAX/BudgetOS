import { useDemoStore } from '@/stores/demoMode';
import { useToastStore } from '@/stores/toast';

export function useDemoGuard() {
  const isDemo = useDemoStore((s) => s.isDemo);
  const addToast = useToastStore((s) => s.addToast);

  const guard = (action: string): boolean => {
    if (isDemo) {
      addToast('info', `Sign up to use ${action} — demo data is read-only.`);
      return false;
    }
    return true;
  };

  return { isDemo, guard };
}
