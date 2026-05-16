/**
 * Constants and types shared by the web (cookie-based) and mobile
 * (SecureStore + Bearer token) better-auth clients.
 *
 * Each app instantiates its own client via `createAuthClient()` from the
 * appropriate better-auth subpath (`better-auth/react` for web,
 * `@better-auth/expo/client` for mobile) and wires in its own plugins —
 * the surface here is intentionally minimal.
 */

export const AUTH_API_PATH = "/api/auth";

export const ACTIVE_ORG_COOKIE = "Active-Org";

export type Locale = "en" | "de";

export interface SharedSessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface SharedSession {
  user: SharedSessionUser;
  activeOrganizationId: string | null;
  permissions: string[];
}
