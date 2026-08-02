"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

export type RecentLessonRecordStudent = {
  id: string;
  firstName: string;
  lastName: string;
};

export type RecentLessonRecordItem = {
  lessonId: string;
  lessonName: string | null;
  areaName: string | null;
  studentCount: number;
  students: RecentLessonRecordStudent[];
  recordIds: string[];
  status: string;
  durationMinutes: number | null;
  recordedAt: string;
};

type Response = {
  recentLessonRecords: RecentLessonRecordItem[];
};

const Document = gql`
  query RecentLessonRecords($limit: Int, $locale: String) {
    recentLessonRecords(limit: $limit, locale: $locale) {
      lessonId
      lessonName
      areaName
      studentCount
      students {
        id
        firstName
        lastName
      }
      recordIds
      status
      durationMinutes
      recordedAt
    }
  }
`;

/**
 * The caller's own last recording acts (grouped bulk-entries, not raw rows —
 * see RecentLessonRecordOutput on the backend). Not cached: this list must
 * reflect a just-completed bulk-create immediately, and the query is cheap
 * (scoped to the caller's own records).
 */
export const getRecentLessonRecordsAction = async (
  limit: number,
  locale: string,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { recentLessonRecords } = await client.request<Response>(Document, {
      limit,
      locale,
    });
    return { success: true as const, data: recentLessonRecords };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
