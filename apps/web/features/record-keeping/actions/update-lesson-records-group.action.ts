"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { LessonRecordStatus } from "../types";

export type UpdateLessonRecordsGroupInput = {
  recordIds: string[];
  lessonId: string;
  recordedAt: string;
  studentIds?: string[];
  status?: LessonRecordStatus;
  durationMinutes?: number | null;
  note?: string | null;
};

type Response = {
  updateLessonRecordsGroup: { id: string; studentId: string }[];
};

const Document = gql`
  mutation UpdateLessonRecordsGroup($input: UpdateLessonRecordsGroupInput!) {
    updateLessonRecordsGroup(input: $input) {
      id
      studentId
    }
  }
`;

/** Bulk-edits status/duration for every record behind one overview-table row. */
export const updateLessonRecordsGroupAction = async (
  input: UpdateLessonRecordsGroupInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { updateLessonRecordsGroup } = await client.request<Response>(
      Document,
      { input },
    );
    revalidatePath("/[locale]/admin/record-keeping", "page");
    return { success: true as const, data: updateLessonRecordsGroup };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
