"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { AccessReviewEntry } from "../types";

const Document = gql`
  query AccessReview {
    accessReview {
      membershipId
      memberName
      roles
      sensitivePermissions
      lastReviewedAt
    }
  }
`;

type Response = { accessReview: AccessReviewEntry[] };

export const getAccessReviewAction = async () => {
  try {
    const client = await serverCookieGqlClient();
    const { accessReview } = await client.request<Response>(Document);
    return { success: true as const, data: accessReview };
  } catch (error) {
    console.log(error);
    return { success: false as const, error, data: [] as AccessReviewEntry[] };
  }
};
