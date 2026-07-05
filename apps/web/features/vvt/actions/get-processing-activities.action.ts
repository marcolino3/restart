"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { ProcessingActivity } from "../types";

const Document = gql`
  query ProcessingActivities {
    processingActivities {
      id
      name
      purpose
      legalBasis
      dataCategories
      dataSubjects
      recipients
      retentionNote
    }
  }
`;

type Response = { processingActivities: ProcessingActivity[] };

export const getProcessingActivitiesAction = async () => {
  try {
    const client = await serverCookieGqlClient();
    const { processingActivities } = await client.request<Response>(Document);
    return { success: true as const, data: processingActivities };
  } catch (error) {
    console.log(error);
    return { success: false as const, error, data: [] as ProcessingActivity[] };
  }
};
