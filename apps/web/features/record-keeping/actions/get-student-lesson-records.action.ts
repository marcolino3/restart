"use server";

import { unstable_cache } from "next/cache";
import { gql } from "graphql-request";
import {
  createGqlClientWithCookieHeader,
  readSessionCookieHeader,
} from "@/lib/graphql/server-cookie-graphql-client";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { studentLessonRecordsTag } from "../lib/cache-tags";
import type { LessonRecordStatus } from "../types";

export type StudentLessonRecordItem = {
  id: string;
  lessonId: string;
  recordedAt: string;
  status: LessonRecordStatus;
  note?: string | null;
  lesson?: {
    id: string;
    position: number;
    translations: { locale: string; name: string }[];
    ancestors?: Array<{
      id: string;
      nodeType: "AREA" | "TOPIC" | "GROUP" | "LESSON";
      position: number;
      translations: { locale: string; name: string }[];
    }>;
  } | null;
  recordedBy?: { id: string; firstName?: string; lastName?: string } | null;
};

type Response = {
  lessonRecords: StudentLessonRecordItem[];
};

const Document = gql`
  query GetStudentLessonRecords($filter: LessonRecordsFilterInput) {
    lessonRecords(filter: $filter) {
      id
      lessonId
      recordedAt
      status
      note
      lesson {
        id
        position
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
      recordedBy {
        id
        firstName
        lastName
      }
    }
  }
`;

const fetchRecords = async (
  studentId: string,
  cookieHeader: string,
): Promise<StudentLessonRecordItem[]> => {
  const client = createGqlClientWithCookieHeader(cookieHeader);
  const { lessonRecords } = await client.request<Response>(Document, {
    filter: { studentId },
  });
  return lessonRecords;
};

export const getStudentLessonRecordsAction = async (
  studentId: string,
): Promise<
  | { success: true; data: StudentLessonRecordItem[] }
  | { success: false; error?: string }
> => {
  try {
    const [userRes, cookieHeader] = await Promise.all([
      getCurrentUserAction(),
      readSessionCookieHeader(),
    ]);
    const orgId = userRes?.data?.orgId ?? "no-org";

    const cached = unstable_cache(
      async (sid: string, _orgKey: string) => fetchRecords(sid, cookieHeader),
      ["student-lesson-records", studentId, orgId],
      { tags: [studentLessonRecordsTag(studentId)] },
    );

    const data = await cached(studentId, orgId);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load records" };
  }
};
