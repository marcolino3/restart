"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { RetentionPolicy } from "../types";

const RetentionPoliciesDocument = gql`
  query RetentionPolicies {
    retentionPolicies {
      id
      entityType
      retentionMonths
      action
      description
      isEnabled
      dueCount
    }
  }
`;

type Response = { retentionPolicies: RetentionPolicy[] };

export const getRetentionPoliciesAction = async () => {
  try {
    const client = await serverCookieGqlClient();
    const { retentionPolicies } = await client.request<Response>(
      RetentionPoliciesDocument,
    );
    return { success: true as const, data: retentionPolicies };
  } catch (error) {
    console.log(error);
    return { success: false as const, error, data: [] as RetentionPolicy[] };
  }
};
