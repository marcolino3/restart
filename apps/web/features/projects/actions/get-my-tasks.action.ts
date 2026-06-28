"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { Task } from "../types";

type Response = { myTasks: Task[] };

const Document = gql`
  query MyTasks {
    myTasks {
      id
      title
      description
      status
      priority
      dueDate
      sortOrder
      project {
        id
        title
        color
      }
      protocol {
        id
        title
      }
      assignees {
        id
        membershipId
        membership {
          id
          userId
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

export const getMyTasksAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { myTasks } = await client.request<Response>(Document);
    return { success: true as const, data: myTasks };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
