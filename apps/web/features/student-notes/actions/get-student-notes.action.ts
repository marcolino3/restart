"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type StudentNoteItem = {
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

type GetStudentNotesResponse = {
  studentNotesByStudentId: StudentNoteItem[];
};

const GetStudentNotesDocument = gql`
  query GetStudentNotesByStudentId($studentId: ID!) {
    studentNotesByStudentId(studentId: $studentId) {
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

export const getStudentNotesAction = async (studentId: string) => {
  const client = await serverCookieGqlClient();

  try {
    const { studentNotesByStudentId } =
      await client.request<GetStudentNotesResponse>(GetStudentNotesDocument, {
        studentId,
      });

    return { success: true as const, data: studentNotesByStudentId };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load notes" };
  }
};
