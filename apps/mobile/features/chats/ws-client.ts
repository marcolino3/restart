import { createClient, type Client } from "graphql-ws";
import { getCookie } from "@/lib/auth-client";
import { API_BASE_URL } from "@/lib/env";

/**
 * graphql-ws client for chat subscriptions in React Native.
 *
 * Unlike the browser, RN does not send the session cookie on the WS upgrade
 * request (there is no cookie store; better-auth keeps it in SecureStore). So
 * we pass the serialized cookie via connectionParams, and the backend
 * onConnect reads it from there (see chats/pubsub/ws-auth.util.ts). getCookie()
 * is read per-connect so reconnects always use the current session.
 */
export function createChatWsClient(): Client {
  const wsUrl = `${API_BASE_URL}/graphql`.replace(/^http/, "ws");
  return createClient({
    url: wsUrl,
    lazy: true,
    retryAttempts: Infinity,
    connectionParams: () => {
      const cookie = getCookie();
      return cookie ? { cookie } : {};
    },
  });
}
