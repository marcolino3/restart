// Same-origin, relative path to the better-auth Apple OAuth endpoint. The
// ingress routes `/api` to the backend, so this resolves same-origin and keeps
// the built frontend image domain-agnostic.
export const APPLE_LOGIN_API = "/api/auth/apple";
