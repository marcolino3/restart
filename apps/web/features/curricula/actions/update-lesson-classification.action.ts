"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { LessonScale, LessonType } from "../types";

export type UpdateLessonClassificationInput = {
  id: string;
  lessonType?: LessonType | null;
  lessonScale?: LessonScale | null;
};

type Response = {
  updateCurriculumNode: {
    id: string;
    lessonType?: LessonType | null;
    lessonScale?: LessonScale | null;
  };
};

const Document = gql`
  mutation UpdateLessonClassification($input: UpdateCurriculumNodeInput!) {
    updateCurriculumNode(input: $input) {
      id
      lessonType
      lessonScale
    }
  }
`;

export const updateLessonClassificationAction = async (
  input: UpdateLessonClassificationInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { updateCurriculumNode } = await client.request<Response>(Document, {
      input,
    });
    return { success: true as const, data: updateCurriculumNode };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
