"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type EnrollmentItem = {
  id: string;
  enrolledAt: string;
  leftAt?: string | null;
  schoolClass: {
    id: string;
    name: string;
    gradeLevels?: { id: string; name: string }[];
  };
};

type GetEnrollmentsResponse = {
  enrollmentsByStudentId: EnrollmentItem[];
};

const GetEnrollmentsDocument = gql`
  query GetEnrollmentsByStudentId($studentId: ID!) {
    enrollmentsByStudentId(studentId: $studentId) {
      id
      enrolledAt
      leftAt
      schoolClass {
        id
        name
        gradeLevels {
          id
          name
        }
      }
    }
  }
`;

export const getStudentEnrollmentsAction = async (studentId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { enrollmentsByStudentId } =
      await client.request<GetEnrollmentsResponse>(GetEnrollmentsDocument, {
        studentId,
      });
    return { success: true as const, data: enrollmentsByStudentId };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load enrollments" };
  }
};
