"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type StudentListItem = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  enrollmentDate?: string | null;
  exitDate?: string | null;
  isActive: boolean;
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
      enrollmentDate
      exitDate
      isActive
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
