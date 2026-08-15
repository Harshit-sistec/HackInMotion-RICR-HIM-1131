import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/store/AuthContext';
import type { User } from '@/types';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({
  onSuccess,
  onError,
}: {
  onSuccess: (user: User) => void;
  onError: (message: string) => void;
}) {
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (!window.google || !containerRef.current) {
        setTimeout(tryInit, 100);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          try {
            const user = await loginWithGoogle(response.credential);
            onSuccess(user);
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Google sign-in failed.');
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
      setReady(true);
    };

    tryInit();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) return null;

  return (
    <div className="flex justify-center">
      <div
        ref={containerRef}
        className={ready ? '' : 'h-11 w-full max-w-[320px] animate-pulse rounded-xl bg-white/5'}
      />
    </div>
  );
}
