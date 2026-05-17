"use server";

import { unstable_cache } from "next/cache";
import {
  createGqlClientWithCookieHeader,
  readSessionCookieHeader,
} from "@/lib/graphql/server-cookie-graphql-client";
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
 * Inner cached fetch. The cookie header is passed in from the caller so that
 * Next's `unstable_cache` does not see a dynamic `cookies()` call inside.
 */
const fetchEnrollments = async (
  studentId: string,
  cookieHeader: string,
): Promise<EnrollmentItem[]> => {
  const client = createGqlClientWithCookieHeader(cookieHeader);
  const { enrollmentsByStudentId } =
    await client.request<GetEnrollmentsResponse>(GetEnrollmentsDocument, {
      studentId,
    });
  return enrollmentsByStudentId;
};

export const getStudentEnrollmentsAction = async (studentId: string) => {
  try {
    // Multi-Tenant-Safety: orgId muss Teil des Cache-Keys sein.
    // cookies() darf NICHT innerhalb unstable_cache laufen — daher hier lesen.
    const [userRes, cookieHeader] = await Promise.all([
      getCurrentUserAction(),
      readSessionCookieHeader(),
    ]);
    const orgId = userRes?.data?.orgId ?? "no-org";

    const cached = unstable_cache(
      async (sid: string, _orgKey: string) =>
        fetchEnrollments(sid, cookieHeader),
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
