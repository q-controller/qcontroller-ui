import { createContext, useContext } from 'react';
import type { Identity } from '@/common/auth-client';

export interface AuthContextValue {
  identity: Identity | null;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  identity: null,
  logout: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
