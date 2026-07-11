"use server";

import { readSessionCookieHeader } from "@/lib/graphql/server-cookie-graphql-client";

/**
 * Returns the session cookie header for the graphql-ws handshake.
 *
 * The browser only sends httpOnly cookies on a WS upgrade when it is
 * same-origin with the GraphQL endpoint. In local dev the web app and backend
 * run on different ports (cross-origin), so the cookie is NOT sent and the
 * subscription would fail to authenticate. We therefore read the cookie
 * server-side and hand it to the client, which passes it via graphql-ws
 * connectionParams — the same path the mobile client uses. The backend
 * onConnect already accepts a connectionParams cookie (ws-auth.util.ts).
 *
 * Harmless in production (same-origin), where the cookie would also ride the
 * upgrade automatically.
 */
export async function getWsCookieAction(): Promise<string> {
  return readSessionCookieHeader();
}
