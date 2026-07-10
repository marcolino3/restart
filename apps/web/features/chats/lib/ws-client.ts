import { createClient, type Client } from "graphql-ws";

/**
 * Browser graphql-ws client for chat subscriptions. This is the only
 * client-side GraphQL path in the app — everything else goes through server
 * actions. The session cookie is httpOnly and rides on the WS upgrade request
 * automatically (same-origin), so we pass no connectionParams; the backend
 * onConnect resolves the session from the upgrade request's Cookie header.
 *
 * Derives the ws(s):// endpoint from NEXT_PUBLIC_GRAPHQL_API_URL.
 */
export function createChatWsClient(): Client {
  const httpUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_API_URL ?? "http://localhost:4001/graphql";
  const wsUrl = httpUrl.replace(/^http/, "ws");
  return createClient({
    url: wsUrl,
    // Reconnect with backoff is built in; keep the socket lazy so it only
    // opens when a subscription is active.
    lazy: true,
    retryAttempts: Infinity,
  });
}
