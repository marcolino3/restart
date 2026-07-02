"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { Task } from "../types";

type Response = { tasksByProtocol: Task[] };

const Document = gql`
  query TasksByProtocol($protocolId: ID!) {
    tasksByProtocol(protocolId: $protocolId) {
      id
      title
      description
      status
      priority
      dueDate
      project {
        id
        title
      }
      assignees {
        id
        membershipId
        membership {
          id
          user {
            firstName
            lastName
          }
          userEmail {
            email
          }
        }
      }
    }
  }
`;

export const getProtocolTasksAction = async (protocolId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { tasksByProtocol } = await client.request<Response>(Document, {
      protocolId,
    });
    return { success: true as const, data: tasksByProtocol };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
