import { GraphQLClient } from "graphql-request";

import { authCredentials, authHeaders } from "./auth-headers";
import { API_BASE_URL } from "./env";
import { ACTIVE_ORG_COOKIE } from "@restart/shared-auth-client";

// The active org, kept in module scope. React Native has no cookie store, so
// the Active-Org cookie the server sets on /api/org/switch is NOT persisted or
// resent automatically. We hold it here and attach it as the Active-Org header
// on every request (the backend customSession plugin reads that header too).
let activeOrgId: string | null = null;

export const setActiveOrg = (orgId: string | null) => {
  activeOrgId = orgId;
};

export const gqlClient = new GraphQLClient(`${API_BASE_URL}/graphql`, {
  // Native replays the session as an explicit Cookie header with the cookie
  // jar disabled; web lets the browser send its httpOnly cookie instead. See
  // auth-headers.ts / auth-headers.web.ts for why each side needs the other's
  // opposite.
  credentials: authCredentials,
  requestMiddleware: (request) => {
    // request.headers is a Headers instance in graphql-request 7; spreading it
    // yields {}, so copy it explicitly before adding ours.
    const base: Record<string, string> = {};
    if (request.headers instanceof Headers) {
      request.headers.forEach((v, k) => {
        base[k] = v;
      });
    } else if (request.headers) {
      Object.assign(base, request.headers as Record<string, string>);
    }
    return {
      ...request,
      headers: {
        ...base,
        // Apollo CSRF prevention needs a JSON content-type or the preflight
        // header; send both.
        "content-type": "application/json",
        "apollo-require-preflight": "true",
        ...authHeaders(),
        ...(activeOrgId
          ? { [ACTIVE_ORG_COOKIE.toLowerCase()]: activeOrgId }
          : {}),
      },
    };
  },
});
