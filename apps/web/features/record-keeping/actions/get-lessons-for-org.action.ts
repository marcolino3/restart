"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { LessonOption } from "../types";

type Response = {
  lessonsByOrg: Array<{
    id: string;
    position: number;
    lessonType?: string | null;
    lessonScale?: string | null;
    translations: { locale: string; name: string }[];
  }>;
};

const Document = gql`
  query GetLessonsForRecordKeeping {
    lessonsByOrg(includeArchived: false) {
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

export const getLessonsForOrgAction = async (): Promise<
  | { success: true; data: LessonOption[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const { lessonsByOrg } = await client.request<Response>(Document);
    const lessons: LessonOption[] = lessonsByOrg.map((n) => ({
      id: n.id,
      position: n.position,
      lessonType: n.lessonType as LessonOption["lessonType"],
      lessonScale: n.lessonScale as LessonOption["lessonScale"],
      translations: n.translations.map((t) => ({
        locale: t.locale as LessonOption["translations"][number]["locale"],
        name: t.name,
      })),
    }));
    return { success: true as const, data: lessons };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load lessons" };
  }
};
