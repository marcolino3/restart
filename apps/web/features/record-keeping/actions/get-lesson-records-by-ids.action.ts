"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { LessonRecordStatus } from "../types";

export type LessonRecordByIdItem = {
  id: string;
  studentId: string;
  lessonId: string;
  recordedAt: string;
  status: LessonRecordStatus;
  durationMinutes: number | null;
  note: string | null;
  student: { firstName: string; lastName: string } | null;
};

type Response = {
  lessonRecordsByIds: LessonRecordByIdItem[];
};

const Document = gql`
  query LessonRecordsByIds($ids: [ID!]!) {
    lessonRecordsByIds(ids: $ids) {
      id
      studentId
      lessonId
      recordedAt
      status
      durationMinutes
      note
      student {
        firstName
        lastName
      }
    }
  }
`;

/** Loads one recording ACT (a group of `lesson_records` rows) for the edit view. */
export const getLessonRecordsByIdsAction = async (ids: string[]) => {
  const client = await serverCookieGqlClient();
  try {
    const { lessonRecordsByIds } = await client.request<Response>(Document, {
      ids,
    });
    return { success: true as const, data: lessonRecordsByIds };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
