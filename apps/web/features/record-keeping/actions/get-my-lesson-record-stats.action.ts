"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

export type MyLessonRecordStats = {
  todayCount: number;
  weekCount: number;
  weekDelta: number;
  studentsReached: number;
  lessonsCount: number;
  lastRecordedAt: string | null;
};

type Response = {
  myLessonRecordStats: MyLessonRecordStats;
};

const Document = gql`
  query MyLessonRecordStats {
    myLessonRecordStats {
      todayCount
      weekCount
      weekDelta
      studentsReached
      lessonsCount
      lastRecordedAt
    }
  }
`;

export const getMyLessonRecordStatsAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { myLessonRecordStats } = await client.request<Response>(Document);
    return { success: true as const, data: myLessonRecordStats };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
