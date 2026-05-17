"use server";

import { unstable_cache } from "next/cache";
import { gql } from "graphql-request";
import {
  createGqlClientWithCookieHeader,
  readSessionCookieHeader,
} from "@/lib/graphql/server-cookie-graphql-client";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import type { LessonRecordStatus } from "../types";

export type HeatmapStudent = {
  studentId: string;
  firstName: string;
  lastName: string;
};

export type HeatmapArea = {
  areaId: string;
  areaName: string;
};

/** One cell = breakdown of latest-status per lesson for (student, area). */
export type HeatmapCell = {
  total: number;
  byStatus: Record<LessonRecordStatus, number>;
};

export type HeatmapData = {
  students: HeatmapStudent[];
  areas: HeatmapArea[];
  /** cells[studentId][areaId] */
  cells: Record<string, Record<string, HeatmapCell>>;
};

const StudentsDocument = gql`
  query HeatmapStudents($schoolClassId: ID!) {
    activeEnrollmentsBySchoolClassId(schoolClassId: $schoolClassId) {
      id
      student {
        id
        firstName
        lastName
      }
    }
  }
`;

const RecordsDocument = gql`
  query HeatmapRecords($filter: LessonRecordsFilterInput) {
    lessonRecords(filter: $filter) {
      id
      studentId
      lessonId
      status
      recordedAt
      lesson {
        id
        ancestors {
          id
          nodeType
          translations {
            locale
            name
          }
        }
      }
    }
  }
`;

type StudentsResp = {
  activeEnrollmentsBySchoolClassId: Array<{
    id: string;
    student: { id: string; firstName: string; lastName: string };
  }>;
};

type RecordsResp = {
  lessonRecords: Array<{
    id: string;
    studentId: string;
    lessonId: string;
    status: LessonRecordStatus;
    recordedAt: string;
    lesson?: {
      id: string;
      ancestors?: Array<{
        id: string;
        nodeType: "AREA" | "TOPIC" | "GROUP" | "LESSON";
        translations: { locale: string; name: string }[];
      }>;
    } | null;
  }>;
};

const pickName = (
  translations: { locale: string; name: string }[],
  locale: string,
): string => {
  const normalized = locale.toUpperCase();
  return (
    translations.find((t) => t.locale === normalized)?.name ??
    translations[0]?.name ??
    "—"
  );
};

const EMPTY_BY_STATUS = (): Record<LessonRecordStatus, number> => ({
  PLANNING: 0,
  INTRODUCED: 0,
  PRACTICED: 0,
  MASTERED: 0,
  NEEDS_MORE: 0,
});

const fetchHeatmap = async (
  schoolClassId: string,
  locale: string,
  cookieHeader: string,
): Promise<HeatmapData> => {
  const client = createGqlClientWithCookieHeader(cookieHeader);

  const [studentsRes, recordsRes] = await Promise.all([
    client.request<StudentsResp>(StudentsDocument, { schoolClassId }),
    client.request<RecordsResp>(RecordsDocument, {
      filter: { schoolClassId },
    }),
  ]);

  const students: HeatmapStudent[] = studentsRes.activeEnrollmentsBySchoolClassId
    .map((e) => ({
      studentId: e.student.id,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
    }))
    .sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
      ),
    );

  // 1. Latest record per (studentId, lessonId)
  type LatestKey = string;
  const latestKey = (sid: string, lid: string): LatestKey => `${sid}:${lid}`;
  const latest = new Map<
    LatestKey,
    {
      status: LessonRecordStatus;
      recordedAt: string;
      id: string;
      areaId: string | null;
      areaName: string | null;
    }
  >();

  for (const r of recordsRes.lessonRecords) {
    const k = latestKey(r.studentId, r.lessonId);
    const area = r.lesson?.ancestors?.find((a) => a.nodeType === "AREA");
    const areaId = area?.id ?? null;
    const areaName = area ? pickName(area.translations, locale) : null;
    const existing = latest.get(k);
    if (
      !existing ||
      r.recordedAt > existing.recordedAt ||
      (r.recordedAt === existing.recordedAt && r.id > existing.id)
    ) {
      latest.set(k, {
        status: r.status,
        recordedAt: r.recordedAt,
        id: r.id,
        areaId,
        areaName,
      });
    }
  }

  // 2. Areas (aus den Records abgeleitet — keine Area = bucket "Ohne Bereich")
  const areaNames = new Map<string, string>();
  for (const v of latest.values()) {
    if (v.areaId && v.areaName) areaNames.set(v.areaId, v.areaName);
  }
  const areas: HeatmapArea[] = Array.from(areaNames.entries())
    .map(([areaId, areaName]) => ({ areaId, areaName }))
    .sort((a, b) => a.areaName.localeCompare(b.areaName));

  // 3. Cells berechnen
  const cells: Record<string, Record<string, HeatmapCell>> = {};
  for (const s of students) cells[s.studentId] = {};

  for (const [key, v] of latest.entries()) {
    if (!v.areaId) continue;
    const [studentId] = key.split(":");
    if (!cells[studentId]) cells[studentId] = {};
    if (!cells[studentId][v.areaId]) {
      cells[studentId][v.areaId] = { total: 0, byStatus: EMPTY_BY_STATUS() };
    }
    cells[studentId][v.areaId].total += 1;
    cells[studentId][v.areaId].byStatus[v.status] += 1;
  }

  return { students, areas, cells };
};

export const getClassroomHeatmapAction = async (
  schoolClassId: string,
  locale: string,
): Promise<
  { success: true; data: HeatmapData } | { success: false; error?: string }
> => {
  try {
    const [userRes, cookieHeader] = await Promise.all([
      getCurrentUserAction(),
      readSessionCookieHeader(),
    ]);
    const orgId = userRes?.data?.orgId ?? "no-org";

    const cached = unstable_cache(
      async (cid: string, loc: string, _orgKey: string) =>
        fetchHeatmap(cid, loc, cookieHeader),
      ["classroom-heatmap", schoolClassId, locale, orgId],
      { tags: [`classroom-heatmap:${schoolClassId}`] },
    );

    const data = await cached(schoolClassId, locale, orgId);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load heatmap" };
  }
};
