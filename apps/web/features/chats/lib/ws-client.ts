import { createClient, type Client } from "graphql-ws";
import { getWsCookieAction } from "../actions/get-ws-cookie.action";

/**
 * Browser graphql-ws client for chat subscriptions. This is the only
 * client-side GraphQL path in the app — everything else goes through server
 * actions.
 *
 * Auth: the httpOnly session cookie only rides the WS upgrade automatically
 * when the WS endpoint is same-origin with the page. In local dev web and
 * backend are on different ports (cross-origin), so we fetch the cookie via a
 * server action and pass it in connectionParams — the same path the mobile
 * client uses; the backend onConnect reads it from there (ws-auth.util.ts).
 * connectionParams is read per (re)connect so it always uses the live session.
 *
 * Derives the ws(s):// endpoint from NEXT_PUBLIC_GRAPHQL_API_URL.
 */
export function createChatWsClient(): Client {
  const httpUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_API_URL ?? "http://localhost:4001/graphql";
  const wsUrl = httpUrl.replace(/^http/, "ws");
  return createClient({
    url: wsUrl,
    lazy: true,
    retryAttempts: Infinity,
    connectionParams: async () => {
      const cookie = await getWsCookieAction().catch(() => "");
      return cookie ? { cookie } : {};
    },
  });
}
