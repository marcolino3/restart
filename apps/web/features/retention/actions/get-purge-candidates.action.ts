"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { PurgeCandidate } from "../purge-types";

const Document = gql`
  query PurgeCandidates {
    purgeCandidates {
      id
      entityType
      subjectLabel
      dueSince
      action
      status
      reviewedAt
      executedAt
      note
    }
  }
`;

type Response = { purgeCandidates: PurgeCandidate[] };

export const getPurgeCandidatesAction = async () => {
  try {
    const client = await serverCookieGqlClient();
    const { purgeCandidates } = await client.request<Response>(Document);
    return { success: true as const, data: purgeCandidates };
  } catch (error) {
    console.log(error);
    return { success: false as const, error, data: [] as PurgeCandidate[] };
  }
};
