/**
 * How an outgoing request carries the session, on web.
 *
 * The browser owns the session cookie — it is httpOnly, so script cannot read
 * it, and `Cookie` is a forbidden header that fetch refuses to set anyway.
 * Both halves of the native contract therefore invert: no explicit header,
 * and credentials must be "include" so the cookie rides along cross-origin
 * (the PWA and the API sit on different ports in dev, and on different
 * subdomains in production).
 *
 * For this to work the serving origin must be listed in the backend's
 * ALLOWED_ORIGINS — CORS, unlike cookie scope, distinguishes ports.
 */
export const authCredentials = "include" satisfies RequestCredentials;

export const authHeaders = (): Record<string, string> => ({});

/**
 * connectionParams for the graphql-ws client. The browser sends the session
 * cookie on the WS upgrade request itself, so nothing goes in the payload.
 */
export const wsConnectionParams = (): Record<string, string> => ({});
