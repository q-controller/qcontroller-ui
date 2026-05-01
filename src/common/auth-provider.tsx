import { useEffect, useState, useCallback } from 'react';
import { Center, Loader } from '@mantine/core';
import {
  getAuthConfig,
  getMe,
  logout as logoutCall,
  type AuthConfig,
  type Identity,
} from '@/common/auth-client';
import { AuthContext } from '@/common/auth-context';
import { setOnUnauthorized } from '@/common/auth-middleware';
import Login from '@/components/Login';

type Status = 'loading' | 'authed' | 'unauthed' | 'disabled';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cfg = await getAuthConfig();
        if (cancelled) return;
        setConfig(cfg);
        if (!cfg.providers || cfg.providers.length === 0) {
          setStatus('disabled');
          return;
        }
        const me = await getMe();
        if (cancelled) return;
        if (me) {
          setIdentity(me);
          setStatus('authed');
        } else {
          setIdentity(null);
          setStatus('unauthed');
        }
      } catch {
        if (!cancelled) setStatus('unauthed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setIdentity(null);
      setStatus('unauthed');
    });
    return () => setOnUnauthorized(() => {});
  }, []);

  const logout = useCallback(async () => {
    const { logoutUrl } = await logoutCall();
    if (logoutUrl) {
      window.location.href = logoutUrl;
      return;
    }
    setIdentity(null);
    setStatus('unauthed');
  }, []);

  if (status === 'loading') {
    return (
      <Center mih="100vh">
        <Loader />
      </Center>
    );
  }

  if (status === 'unauthed') {
    return <Login providers={config?.providers ?? []} />;
  }

  return (
    <AuthContext.Provider value={{ identity, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
