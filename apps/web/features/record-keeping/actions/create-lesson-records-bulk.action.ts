"use server";

import { updateTag } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { studentLessonRecordsTag } from "../lib/cache-tags";
import type { LessonRecordDTO, LessonRecordStatus } from "../types";

export type CreateLessonRecordsBulkInput = {
  lessonId: string;
  studentIds: string[];
  recordedAt: string;
  status: LessonRecordStatus;
  note?: string | null;
};

type Response = {
  createLessonRecordsBulk: LessonRecordDTO[];
};

const Document = gql`
  mutation CreateLessonRecordsBulk($input: CreateLessonRecordsBulkInput!) {
    createLessonRecordsBulk(input: $input) {
      id
      studentId
      lessonId
      recordedAt
      status
      note
    }
  }
`;

export const createLessonRecordsBulkAction = async (
  input: CreateLessonRecordsBulkInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { createLessonRecordsBulk } = await client.request<Response>(
      Document,
      { input },
    );

    // Invalidate the per-student record cache for every affected student
    // so their progress tab reflects the new entries immediately.
    for (const studentId of input.studentIds) {
      updateTag(studentLessonRecordsTag(studentId));
    }

    return { success: true as const, data: createLessonRecordsBulk };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
