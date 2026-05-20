"use server";

import { unstable_cache } from "next/cache";
import { gql } from "graphql-request";
import {
  createGqlClientWithCookieHeader,
  readSessionCookieHeader,
} from "@/lib/graphql/server-cookie-graphql-client";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { studentTimelineTag } from "../lib/cache-tags";

export type TimelineGranularity = "DAY" | "WEEK" | "MONTH";

export type StudentTimelineBucket = {
  bucketStart: string;
  planning: number;
  introduced: number;
  practiced: number;
  mastered: number;
  needsMore: number;
  total: number;
};

export type StudentTimeline = {
  buckets: StudentTimelineBucket[];
  totalIntroductionsInRange: number;
  daysSinceLastIntroduction: number | null;
};

type Response = {
  studentLessonRecordTimeline: StudentTimeline;
};

const Document = gql`
  query StudentLessonRecordTimeline(
    $studentId: ID!
    $from: String!
    $to: String!
    $granularity: TimelineGranularity!
  ) {
    studentLessonRecordTimeline(
      studentId: $studentId
      from: $from
      to: $to
      granularity: $granularity
    ) {
      buckets {
        bucketStart
        planning
        introduced
        practiced
        mastered
        needsMore
        total
      }
      totalIntroductionsInRange
      daysSinceLastIntroduction
    }
  }
`;

const fetchTimeline = async (
  studentId: string,
  from: string,
  to: string,
  granularity: TimelineGranularity,
  cookieHeader: string,
): Promise<StudentTimeline> => {
  const client = createGqlClientWithCookieHeader(cookieHeader);
  const { studentLessonRecordTimeline } = await client.request<Response>(
    Document,
    { studentId, from, to, granularity },
  );
  return studentLessonRecordTimeline;
};

export const getStudentTimelineAction = async (
  studentId: string,
  from: string,
  to: string,
  granularity: TimelineGranularity = "WEEK",
): Promise<
  { success: true; data: StudentTimeline } | { success: false; error?: string }
> => {
  try {
    const [userRes, cookieHeader] = await Promise.all([
      getCurrentUserAction(),
      readSessionCookieHeader(),
    ]);
    const orgId = userRes?.data?.orgId ?? "no-org";

    const cached = unstable_cache(
      async (
        sid: string,
        f: string,
        t: string,
        g: TimelineGranularity,
        _orgKey: string,
      ) => fetchTimeline(sid, f, t, g, cookieHeader),
      ["student-timeline", studentId, from, to, granularity, orgId],
      { tags: [studentTimelineTag(studentId)] },
    );

    const data = await cached(studentId, from, to, granularity, orgId);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load timeline" };
  }
};
