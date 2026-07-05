"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { DataBreachIncident } from "../types";

const DataBreachesDocument = gql`
  query DataBreaches($status: DataBreachStatus) {
    dataBreaches(status: $status) {
      id
      title
      description
      detectedAt
      status
      riskLevel
      affectedScope
      affectedCount
      authorityNotifiedAt
      subjectsNotifiedAt
      measures
      closedAt
      notes
      authorityNotificationDueAt
      assigneeMembership {
        id
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

type Response = { dataBreaches: DataBreachIncident[] };

export const getDataBreachesAction = async (status?: string) => {
  try {
    const client = await serverCookieGqlClient();
    const { dataBreaches } = await client.request<Response>(
      DataBreachesDocument,
      status ? { status } : {},
    );
    return { success: true as const, data: dataBreaches };
  } catch (error) {
    console.log(error);
    return {
      success: false as const,
      error,
      data: [] as DataBreachIncident[],
    };
  }
};
