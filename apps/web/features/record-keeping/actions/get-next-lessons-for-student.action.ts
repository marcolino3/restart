"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { LessonOption } from "../types";

type Response = {
  nextLessonsForStudent: Array<{
    id: string;
    position: number;
    lessonType?: string | null;
    lessonScale?: string | null;
    translations: { locale: string; name: string }[];
  }>;
};

const Document = gql`
  query NextLessonsForStudent($studentId: ID!, $limit: Int) {
    nextLessonsForStudent(studentId: $studentId, limit: $limit) {
      id
      position
      lessonType
      lessonScale
      translations {
        locale
        name
      }
    }
  }
`;

export const getNextLessonsForStudentAction = async (
  studentId: string,
  limit = 10,
): Promise<
  | { success: true; data: LessonOption[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const { nextLessonsForStudent } = await client.request<Response>(Document, {
      studentId,
      limit,
    });
    const data: LessonOption[] = nextLessonsForStudent.map((n) => ({
      id: n.id,
      position: n.position,
      lessonType: n.lessonType as LessonOption["lessonType"],
      lessonScale: n.lessonScale as LessonOption["lessonScale"],
      translations: n.translations.map((t) => ({
        locale: t.locale as LessonOption["translations"][number]["locale"],
        name: t.name,
      })),
    }));
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load next lessons" };
  }
};
