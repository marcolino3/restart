"use server";

import { unstable_cache } from "next/cache";
import { gql } from "graphql-request";
import {
  createGqlClientWithCookieHeader,
  readSessionCookieHeader,
} from "@/lib/graphql/server-cookie-graphql-client";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { classroomEngagementTimelineTag } from "../lib/cache-tags";
import type { TimelineGranularity } from "./get-student-timeline.action";

export type EngagementTimelineBucket = {
  bucketStart: string;
  focused: number;
  interested: number;
  mechanical: number;
  resistant: number;
  total: number;
};

export type EngagementTimeline = {
  buckets: EngagementTimelineBucket[];
  totalObserved: number;
};

type Response = {
  classroomEngagementTimeline: EngagementTimeline;
};

const Document = gql`
  query ClassroomEngagementTimeline(
    $schoolClassId: ID!
    $from: String!
    $to: String!
    $granularity: TimelineGranularity!
  ) {
    classroomEngagementTimeline(
      schoolClassId: $schoolClassId
      from: $from
      to: $to
      granularity: $granularity
    ) {
      buckets {
        bucketStart
        focused
        interested
        mechanical
        resistant
        total
      }
      totalObserved
    }
  }
`;

const fetchTimeline = async (
  schoolClassId: string,
  from: string,
  to: string,
  granularity: TimelineGranularity,
  cookieHeader: string,
): Promise<EngagementTimeline> => {
  const client = createGqlClientWithCookieHeader(cookieHeader);
  const { classroomEngagementTimeline } = await client.request<Response>(
    Document,
    { schoolClassId, from, to, granularity },
  );
  return classroomEngagementTimeline;
};

export const getClassroomEngagementTimelineAction = async (
  schoolClassId: string,
  from: string,
  to: string,
  granularity: TimelineGranularity = "WEEK",
): Promise<
  | { success: true; data: EngagementTimeline }
  | { success: false; error?: string }
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
      [
        "classroom-engagement-timeline",
        schoolClassId,
        from,
        to,
        granularity,
        orgId,
      ],
      { tags: [classroomEngagementTimelineTag(schoolClassId)] },
    );

    const data = await cached(schoolClassId, from, to, granularity, orgId);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to load engagement timeline",
    };
  }
};
