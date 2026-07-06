"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { ProjectDetail } from "../types";

type Response = { projectById: ProjectDetail };

const Document = gql`
  query ProjectById($id: ID!) {
    projectById(id: $id) {
      id
      title
      description
      status
      color
      dueDate
      isArchived
      createdAt
      taskStats {
        total
        done
      }
      members {
        id
        role
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

export const getProjectAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { projectById } = await client.request<Response>(Document, { id });
    return { success: true as const, data: projectById };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
