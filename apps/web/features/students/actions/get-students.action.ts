"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type StudentListItem = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  exitDate?: string | null;
  isActive: boolean;
  currentClass?: {
    id: string;
    name: string;
    color?: string | null;
    gradeLevels?: { id: string; name: string; color?: string | null }[] | null;
  } | null;
};

type GetStudentsResponse = {
  studentsByOrgId: StudentListItem[];
};

const GetStudentsDocument = gql`
  query GetStudents {
    studentsByOrgId {
      id
      firstName
      lastName
      dateOfBirth
      gender
      exitDate
      isActive
      currentClass {
        id
        name
        color
        gradeLevels {
          id
          name
          color
        }
      }
    }
  }
`;

export const getStudentsAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { studentsByOrgId } =
      await client.request<GetStudentsResponse>(GetStudentsDocument);
    return { success: true as const, data: studentsByOrgId };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
