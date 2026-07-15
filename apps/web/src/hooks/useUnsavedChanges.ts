import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  const lastMessageRef = useRef<string | null>(null);

  // Block browser navigation (refresh/close)
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Block in-app navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const message = 'You have unsaved changes. Are you sure you want to leave?';
      if (lastMessageRef.current !== message) {
        lastMessageRef.current = message;
        const result = window.confirm(message);
        if (result) {
          blocker.proceed();
        } else {
          blocker.reset();
        }
      }
    }
  }, [blocker]);

  return blocker;
}
