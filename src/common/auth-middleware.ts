import type {
  Middleware as ControllerMiddleware,
  RequestContext,
  ResponseContext,
} from '@/generated/controller-client/src/runtime';
import type { Middleware as ImageMiddleware } from '@/generated/image-client/src/runtime';

// Both generated clients ship structurally identical Middleware types.
// Declaring as the intersection lets us hand the same object to both API
// constructors without a cast — and turns any future divergence into a
// compile error instead of silent runtime drift.
type Middleware = ControllerMiddleware & ImageMiddleware;

let onUnauthorized: () => void = () => {};

export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

// authMiddleware fires onUnauthorized whenever any API call returns 401,
// so the AuthProvider can swap to the login screen.
export const authMiddleware: Middleware = {
  post: async (ctx: ResponseContext) => {
    if (ctx.response.status === 401) {
      onUnauthorized();
    }
    return ctx.response;
  },
};

// csrfHeaderMiddleware sets X-Requested-With on every request. The server
// requires it on POST/PUT/PATCH/DELETE for cookie-authenticated calls; cross
// origin attackers cannot set it without a CORS preflight that the server
// does not grant. See src/pkg/auth/middleware.go RequireCSRFHeader.
export const csrfHeaderMiddleware: Middleware = {
  pre: async (ctx: RequestContext) => {
    const headers = new Headers(ctx.init.headers);
    headers.set('X-Requested-With', 'XMLHttpRequest');
    return {
      url: ctx.url,
      init: { ...ctx.init, headers },
    };
  },
};
