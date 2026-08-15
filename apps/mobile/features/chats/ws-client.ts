import { createClient, type Client } from "graphql-ws";
import { wsConnectionParams } from "@/lib/auth-headers";
import { API_BASE_URL } from "@/lib/env";

/**
 * graphql-ws client for chat subscriptions.
 *
 * Unlike the browser, RN does not send the session cookie on the WS upgrade
 * request (there is no cookie store; better-auth keeps it in SecureStore). So
 * we pass the serialized cookie via connectionParams, and the backend
 * onConnect reads it from there (see chats/pubsub/ws-auth.util.ts). It is read
 * per-connect so reconnects always use the current session. On web the browser
 * sends the cookie on the upgrade itself and the params stay empty.
 */
export function createChatWsClient(): Client {
  const wsUrl = `${API_BASE_URL}/graphql`.replace(/^http/, "ws");
  return createClient({
    url: wsUrl,
    lazy: true,
    retryAttempts: Infinity,
    connectionParams: wsConnectionParams,
  });
}
