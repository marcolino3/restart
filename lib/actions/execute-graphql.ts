// lib/actions/execute-graphql.ts

import { createGraphQLClient } from "@/lib/graphql/create-graphql-client";
import { getAccessToken } from "@/lib/auth/get-access-token";
import { ActionResponse } from "@/lib/actions/action-response";
import { GraphQLClient, ClientError } from "graphql-request";

export async function executeGraphQL<T>(
  query: (client: GraphQLClient) => Promise<T>
): Promise<ActionResponse<T>> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: "Nicht autorisiert" };
  }

  const client = await createGraphQLClient(accessToken);

  try {
    const result = await query(client);
    return { success: true, data: result };
  } catch (error) {
    const err = error as ClientError;
    const message =
      err.response?.errors?.[0]?.message ?? err.message ?? "Unbekannter Fehler";
    return { success: false, error: message };
  }
}
