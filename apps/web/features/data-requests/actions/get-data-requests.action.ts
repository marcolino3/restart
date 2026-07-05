"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { DataSubjectRequest } from "../types";

const DataSubjectRequestsDocument = gql`
  query DataSubjectRequests($status: DataSubjectRequestStatus) {
    dataSubjectRequests(status: $status) {
      id
      type
      status
      subjectType
      subjectId
      subjectName
      contactEmail
      receivedAt
      dueDate
      resolvedAt
      resolutionNote
      notes
      assigneeMembershipId
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

type Response = { dataSubjectRequests: DataSubjectRequest[] };

export const getDataRequestsAction = async (status?: string) => {
  try {
    const client = await serverCookieGqlClient();
    const { dataSubjectRequests } = await client.request<Response>(
      DataSubjectRequestsDocument,
      status ? { status } : {},
    );
    return { success: true as const, data: dataSubjectRequests };
  } catch (error) {
    console.log(error);
    return {
      success: false as const,
      error,
      data: [] as DataSubjectRequest[],
    };
  }
};
