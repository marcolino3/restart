"use server";

import { unstable_cache } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { studentEnrollmentsTag } from "../lib/enrollment-cache-tags";

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

/**
 * Inner uncached fetch. Cookies are read here (cannot run inside unstable_cache).
 */
const fetchEnrollments = async (
  studentId: string,
): Promise<EnrollmentItem[]> => {
  const client = await serverCookieGqlClient();
  const { enrollmentsByStudentId } =
    await client.request<GetEnrollmentsResponse>(GetEnrollmentsDocument, {
      studentId,
    });
  return enrollmentsByStudentId;
};

export const getStudentEnrollmentsAction = async (studentId: string) => {
  try {
    // Multi-Tenant-Safety: orgId muss Teil des Cache-Keys sein.
    const userRes = await getCurrentUserAction();
    const orgId = userRes?.data?.orgId ?? "no-org";

    const cached = unstable_cache(
      async (sid: string, _orgKey: string) => fetchEnrollments(sid),
      ["student-enrollments", studentId, orgId],
      { tags: [studentEnrollmentsTag(studentId)] },
    );

    const data = await cached(studentId, orgId);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load enrollments" };
  }
};
