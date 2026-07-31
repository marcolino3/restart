"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { CurriculumNodeType, LessonOption } from "../types";

type RawAncestor = {
  id: string;
  nodeType: string;
  position: number;
  translations: { locale: string; name: string }[];
};

type Response = {
  lessonsByOrg: Array<{
    id: string;
    position: number;
    lessonType?: string | null;
    lessonScale?: string | null;
    translations: { locale: string; name: string }[];
    ancestors?: RawAncestor[] | null;
  }>;
};

const Document = gql`
  query GetLessonsForRecordKeeping($forSchoolClassId: ID) {
    lessonsByOrg(includeArchived: false, forSchoolClassId: $forSchoolClassId) {
      id
      position
      lessonType
      lessonScale
      translations {
        locale
        name
      }
      ancestors {
        id
        nodeType
        position
        translations {
          locale
          name
        }
      }
    }
  }
`;

const toLocale = (s: string) =>
  s as LessonOption["translations"][number]["locale"];

/**
 * `schoolClassId` narrows the list to the class's curriculum cycle. Without
 * it — or when the class has no cycle configured — every lesson of the org is
 * returned, so recording progress works even on an unconfigured setup.
 */
export const getLessonsForOrgAction = async (
  schoolClassId?: string | null,
): Promise<
  | { success: true; data: LessonOption[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const { lessonsByOrg } = await client.request<Response>(Document, {
      forSchoolClassId: schoolClassId || null,
    });
    const lessons: LessonOption[] = lessonsByOrg.map((n) => ({
      id: n.id,
      position: n.position,
      lessonType: n.lessonType as LessonOption["lessonType"],
      lessonScale: n.lessonScale as LessonOption["lessonScale"],
      translations: n.translations.map((t) => ({
        locale: toLocale(t.locale),
        name: t.name,
      })),
      ancestors: (n.ancestors ?? []).map((a) => ({
        id: a.id,
        nodeType: a.nodeType as CurriculumNodeType,
        position: a.position,
        translations: a.translations.map((t) => ({
          locale: toLocale(t.locale),
          name: t.name,
        })),
      })),
    }));
    return { success: true as const, data: lessons };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load lessons" };
  }
};
