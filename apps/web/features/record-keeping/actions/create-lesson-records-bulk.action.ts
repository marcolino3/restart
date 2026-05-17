"use server";

import { updateTag } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import {
  classroomAttentionTag,
  classroomHeatmapTag,
  studentLessonRecordsTag,
} from "../lib/cache-tags";
import type {
  LessonRecordDTO,
  LessonRecordObservation,
  LessonRecordStatus,
} from "../types";

export type CreateLessonRecordsBulkInput = {
  lessonId: string;
  studentIds: string[];
  recordedAt: string;
  status: LessonRecordStatus;
  note?: string | null;
  /**
   * Hattie observation seed — values applied to every created row. Per-child
   * overrides are written separately via updateLessonRecordAction after this
   * mutation returns.
   */
  observation?: LessonRecordObservation | null;
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
  /** Optional — pass when called from a classroom-bound UI so we can
   *  invalidate that classroom's heatmap + attention caches too. The
   *  field isn't part of the GraphQL input. */
  schoolClassId?: string,
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

    // Classroom-level caches (heatmap + attention) — only invalidate the
    // one classroom the bulk-entry targeted to avoid stampeding org-wide.
    if (schoolClassId) {
      updateTag(classroomAttentionTag(schoolClassId));
      updateTag(classroomHeatmapTag(schoolClassId));
    }

    return { success: true as const, data: createLessonRecordsBulk };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
