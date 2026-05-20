"use server";

import { gql } from "graphql-request";
import { updateTag } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import {
  classroomAttentionTag,
  classroomEngagementTimelineTag,
  classroomHeatmapTag,
  studentLessonRecordsTag,
  studentTimelineTag,
} from "../lib/cache-tags";
import type {
  LessonRecordDTO,
  LessonRecordObservation,
  LessonRecordStatus,
} from "../types";

export type UpdateLessonRecordInput = {
  id: string;
  recordedAt?: string;
  status?: LessonRecordStatus;
  note?: string | null;
  observation?: LessonRecordObservation | null;
};

type Response = {
  updateLessonRecord: LessonRecordDTO & { studentId: string };
};

const Document = gql`
  mutation UpdateLessonRecord($input: UpdateLessonRecordInput!) {
    updateLessonRecord(input: $input) {
      id
      studentId
      lessonId
      recordedAt
      status
      note
    }
  }
`;

/**
 * Used primarily by the per-child observation override flow in the bulk-entry
 * form: after the bulk-create returns, we issue one update per overridden
 * child to apply their specific badges.
 */
export const updateLessonRecordAction = async (
  input: UpdateLessonRecordInput,
  /** Optional — when called from a classroom-bound UI, pass to invalidate
   *  that classroom's caches as well. */
  schoolClassId?: string,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { updateLessonRecord } = await client.request<Response>(Document, {
      input,
    });

    if (updateLessonRecord?.studentId) {
      updateTag(studentLessonRecordsTag(updateLessonRecord.studentId));
      updateTag(studentTimelineTag(updateLessonRecord.studentId));
    }
    if (schoolClassId) {
      updateTag(classroomAttentionTag(schoolClassId));
      updateTag(classroomHeatmapTag(schoolClassId));
      updateTag(classroomEngagementTimelineTag(schoolClassId));
    }

    return { success: true as const, data: updateLessonRecord };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
