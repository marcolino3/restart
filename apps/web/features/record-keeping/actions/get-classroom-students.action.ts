"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { ClassroomStudentDTO } from "../types";

type Response = {
  activeEnrollmentsBySchoolClassId: Array<{
    id: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
};

const Document = gql`
  query GetClassroomStudents($schoolClassId: ID!) {
    activeEnrollmentsBySchoolClassId(schoolClassId: $schoolClassId) {
      id
      student {
        id
        firstName
        lastName
      }
    }
  }
`;

export const getClassroomStudentsAction = async (
  schoolClassId: string,
): Promise<
  | { success: true; data: ClassroomStudentDTO[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const { activeEnrollmentsBySchoolClassId } =
      await client.request<Response>(Document, { schoolClassId });
    const data: ClassroomStudentDTO[] = activeEnrollmentsBySchoolClassId
      .map((e) => ({
        enrollmentId: e.id,
        studentId: e.student.id,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
      }))
      .sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
        ),
      );
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load students" };
  }
};
