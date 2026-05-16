import { GraphQLClient } from "graphql-request";

import { authClient } from "./auth-client";
import { API_BASE_URL } from "./env";
import { ACTIVE_ORG_COOKIE } from "@restart/shared-auth-client";

export const gqlClient = new GraphQLClient(`${API_BASE_URL}/graphql`, {
  requestMiddleware: (request) => {
    const cookie = authClient.getCookie();
    return {
      ...request,
      headers: {
        ...(request.headers as Record<string, string>),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    };
  },
});

export const setActiveOrg = (orgId: string | null) => {
  if (orgId) {
    gqlClient.setHeader(ACTIVE_ORG_COOKIE.toLowerCase(), orgId);
  } else {
    gqlClient.setHeader(ACTIVE_ORG_COOKIE.toLowerCase(), "");
  }
};
