"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { KanbanClassroom, KanbanStudent } from "../types";

const SchoolClassesDocument = gql`
  query KanbanSchoolClasses {
    schoolClassesByOrgId {
      id
      name
      color
      maxCapacity
      sortOrder
      isActive
      gradeLevels {
        id
        name
      }
    }
  }
`;

const UnassignedDocument = gql`
  query KanbanUnassignedStudents {
    unassignedStudents {
      id
      firstName
      lastName
    }
  }
`;

const ClassroomStudentsDocument = gql`
  query KanbanClassroomStudents($schoolClassId: ID!) {
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

export type KanbanGradeLevel = { id: string; name: string };

type Resp1 = {
  schoolClassesByOrgId: Array<{
    id: string;
    name: string;
    color?: string | null;
    maxCapacity?: number | null;
    sortOrder: number;
    isActive: boolean;
    gradeLevels?: { id: string; name: string }[];
  }>;
};
type Resp2 = { unassignedStudents: KanbanStudent[] };
type Resp3 = {
  activeEnrollmentsBySchoolClassId: Array<{
    id: string;
    student: KanbanStudent;
  }>;
};

export type KanbanData = {
  classrooms: KanbanClassroom[];
  unassigned: KanbanStudent[];
  studentsById: Record<string, KanbanStudent>;
  gradeLevels: KanbanGradeLevel[];
};

export const getKanbanDataAction = async (): Promise<
  { success: true; data: KanbanData } | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const [{ schoolClassesByOrgId }, { unassignedStudents }] =
      await Promise.all([
        client.request<Resp1>(SchoolClassesDocument),
        client.request<Resp2>(UnassignedDocument),
      ]);

    const activeClassrooms = schoolClassesByOrgId
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    const studentsById: Record<string, KanbanStudent> = {};
    for (const s of unassignedStudents) studentsById[s.id] = s;

    const classroomEntries = await Promise.all(
      activeClassrooms.map(async (c) => {
        const { activeEnrollmentsBySchoolClassId } = await client.request<Resp3>(
          ClassroomStudentsDocument,
          { schoolClassId: c.id },
        );
        const ids: string[] = [];
        for (const e of activeEnrollmentsBySchoolClassId) {
          studentsById[e.student.id] = e.student;
          ids.push(e.student.id);
        }
        return { c, ids };
      }),
    );

    const gradeLevelMap = new Map<string, string>();
    for (const c of activeClassrooms) {
      for (const g of c.gradeLevels ?? []) gradeLevelMap.set(g.id, g.name);
    }
    const gradeLevels: KanbanGradeLevel[] = Array.from(gradeLevelMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const classrooms: KanbanClassroom[] = classroomEntries.map(({ c, ids }) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      maxCapacity: c.maxCapacity,
      sortOrder: c.sortOrder,
      gradeLevelIds: (c.gradeLevels ?? []).map((g) => g.id),
      studentIds: ids.sort((a, b) => {
        const sa = studentsById[a];
        const sb = studentsById[b];
        if (!sa || !sb) return 0;
        return `${sa.lastName} ${sa.firstName}`.localeCompare(
          `${sb.lastName} ${sb.firstName}`,
        );
      }),
    }));

    return {
      success: true as const,
      data: {
        classrooms,
        unassigned: unassignedStudents,
        studentsById,
        gradeLevels,
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load kanban data" };
  }
};
