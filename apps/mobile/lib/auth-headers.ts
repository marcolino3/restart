import { authClient } from "./auth-client";

/**
 * How an outgoing request carries the session, on native.
 *
 * React Native has no cookie store the way a browser does, so the session
 * lives in SecureStore (via the expo plugin) and has to be replayed as an
 * explicit Cookie header. `credentials: "omit"` is required alongside it:
 * RN's fetch has a native shared cookie jar (iOS NSHTTPCookieStorage /
 * Android OkHttp) that would otherwise override the manual header with
 * whatever it cached from an earlier Set-Cookie — producing "No active
 * session" even when getCookie() returns a valid cookie.
 *
 * The web build resolves auth-headers.web.ts instead, where the browser owns
 * the cookie and both of these invert.
 */
export const authCredentials = "omit" satisfies RequestCredentials;

export const authHeaders = (): Record<string, string> => {
  const cookie = authClient.getCookie();
  return cookie ? { Cookie: cookie } : {};
};

/**
 * connectionParams for the graphql-ws client. RN sends no cookie on the WS
 * upgrade, so the session travels in the payload instead and the backend's
 * onConnect reads it from there. Evaluated per connect so reconnects pick up
 * the current session.
 */
export const wsConnectionParams = (): Record<string, string> => {
  const cookie = authClient.getCookie();
  return cookie ? { cookie } : {};
};
