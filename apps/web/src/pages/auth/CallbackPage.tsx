import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logger } from '@/core/logger';

export function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (!accessToken) {
        setError('Invalid verification link.');
        return;
      }

      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken ?? '' })
        .then(({ error: sessionError }) => {
          if (sessionError) {
            logger.error('Callback setSession error', 'Callback', undefined, { message: sessionError.message });
            setError(sessionError.message);
            return;
          }
          if (type === 'recovery') {
            navigate('/auth/update-password', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Failed to verify link.';
          logger.error('Callback setSession threw', 'Callback', err);
          setError(message);
        });
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/auth/login', { replace: true });
        }
      });
    }
  }, [navigate]);

  if (error) {
    return (
      <div className="text-center space-y-4">
        <div className="rounded-full bg-red-100 p-3 mx-auto w-fit dark:bg-red-900">
          <svg className="h-8 w-8 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Verification failed</h2>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  );
}
