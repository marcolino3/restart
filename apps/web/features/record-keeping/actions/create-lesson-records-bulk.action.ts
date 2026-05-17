"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
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
    return { success: true as const, data: createLessonRecordsBulk };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
