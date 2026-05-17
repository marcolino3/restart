"use server";

import { unstable_cache } from "next/cache";
import { gql } from "graphql-request";
import {
  createGqlClientWithCookieHeader,
  readSessionCookieHeader,
} from "@/lib/graphql/server-cookie-graphql-client";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { classroomHeatmapTag } from "../lib/cache-tags";
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

const HeatmapDocument = gql`
  query ClassroomHeatmapData($schoolClassId: ID!, $locale: String!) {
    classroomHeatmapData(schoolClassId: $schoolClassId, locale: $locale) {
      students {
        studentId
        firstName
        lastName
      }
      areas {
        areaId
        areaName
      }
      cells {
        studentId
        areaId
        status
        count
      }
    }
  }
`;

type HeatmapResp = {
  classroomHeatmapData: {
    students: HeatmapStudent[];
    areas: HeatmapArea[];
    cells: Array<{
      studentId: string;
      areaId: string;
      status: LessonRecordStatus;
      count: number;
    }>;
  };
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
  const { classroomHeatmapData } = await client.request<HeatmapResp>(
    HeatmapDocument,
    { schoolClassId, locale },
  );

  // Flatten the flat cell list into cells[studentId][areaId].
  const nestedCells: Record<string, Record<string, HeatmapCell>> = {};
  for (const s of classroomHeatmapData.students) {
    nestedCells[s.studentId] = {};
  }
  for (const c of classroomHeatmapData.cells) {
    if (!nestedCells[c.studentId]) nestedCells[c.studentId] = {};
    if (!nestedCells[c.studentId][c.areaId]) {
      nestedCells[c.studentId][c.areaId] = {
        total: 0,
        byStatus: EMPTY_BY_STATUS(),
      };
    }
    nestedCells[c.studentId][c.areaId].total += c.count;
    nestedCells[c.studentId][c.areaId].byStatus[c.status] += c.count;
  }

  return {
    students: classroomHeatmapData.students,
    areas: classroomHeatmapData.areas,
    cells: nestedCells,
  };
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
      { tags: [classroomHeatmapTag(schoolClassId)] },
    );

    const data = await cached(schoolClassId, locale, orgId);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load heatmap" };
  }
};
