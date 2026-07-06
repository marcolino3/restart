"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { Task } from "../types";

type Response = { tasksByProject: Task[] };

const Document = gql`
  query TasksByProject($projectId: ID!) {
    tasksByProject(projectId: $projectId) {
      id
      title
      description
      status
      priority
      dueDate
      dueTime
      completedAt
      checklist {
        id
        label
        done
      }
      notes {
        id
        text
        authorName
        createdAt
      }
      createdByMembershipId
      sortOrder
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

export const getProjectTasksAction = async (projectId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { tasksByProject } = await client.request<Response>(Document, {
      projectId,
    });
    return { success: true as const, data: tasksByProject };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
