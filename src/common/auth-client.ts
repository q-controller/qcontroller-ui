import {
  AuthServiceApi,
  Configuration,
  ResponseError,
  type ServicesAuthV1AuthProvider,
  type ServicesAuthV1GetConfigResponse,
  type ServicesAuthV1Identity,
  type ServicesAuthV1LogoutResponse,
} from '@/generated/controller-client/src';
import { authMiddleware, csrfHeaderMiddleware } from '@/common/auth-middleware';

// Re-export the generated types under their semantic names so the rest of
// the SPA doesn't carry the long namespaced identifiers around. These are
// type-only re-exports — no runtime cost, no duplicate definitions.
export type Identity = ServicesAuthV1Identity;
export type AuthProvider = ServicesAuthV1AuthProvider;
export type AuthConfig = ServicesAuthV1GetConfigResponse;
export type LogoutResponse = ServicesAuthV1LogoutResponse;

const api = new AuthServiceApi(
  new Configuration({
    basePath: '',
    middleware: [csrfHeaderMiddleware, authMiddleware],
  })
);

export async function getAuthConfig(): Promise<AuthConfig> {
  return api.authServiceGetConfig();
}

export async function getMe(): Promise<Identity | null> {
  try {
    const resp = await api.authServiceGetMe();
    return resp.identity ?? null;
  } catch (err) {
    if (err instanceof ResponseError && err.response.status === 401) {
      return null;
    }
    throw err;
  }
}

export async function logout(): Promise<LogoutResponse> {
  try {
    return await api.authServiceLogout();
  } catch {
    return { logoutUrl: '' };
  }
}

export function loginUrl(providerName: string): string {
  return `/auth/login?provider=${encodeURIComponent(providerName)}`;
}
