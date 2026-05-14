"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type EmployeeNoteItem = {
  id: string;
  category: string;
  title: string;
  content: string;
  isConfidential: boolean;
  date: string;
  createdAt: string;
  authorMembership: {
    id: string;
    user?: {
      firstName: string;
      lastName: string;
    } | null;
  };
};

type GetEmployeeNotesResponse = {
  employeeNotesByEmployeeId: EmployeeNoteItem[];
};

const GetEmployeeNotesDocument = gql`
  query GetEmployeeNotesByEmployeeId($employeeId: ID!) {
    employeeNotesByEmployeeId(employeeId: $employeeId) {
      id
      category
      title
      content
      isConfidential
      date
      createdAt
      authorMembership {
        id
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

export const getEmployeeNotesAction = async (employeeId: string) => {
  const client = await serverCookieGqlClient();

  try {
    const { employeeNotesByEmployeeId } =
      await client.request<GetEmployeeNotesResponse>(
        GetEmployeeNotesDocument,
        { employeeId },
      );

    return { success: true as const, data: employeeNotesByEmployeeId };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load notes" };
  }
};
