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
        parentId
        sortOrder
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
      dateOfBirth
      isActive
    }
  }
`;

const GradeLevelsDocument = gql`
  query KanbanGradeLevels {
    gradeLevelsByOrgId {
      id
      name
      parentId
      sortOrder
    }
  }
`;

const ClassroomStudentsDocument = gql`
  query KanbanClassroomStudents($schoolClassId: ID!) {
    activeEnrollmentsBySchoolClassId(schoolClassId: $schoolClassId) {
      id
      gradeLevelId
      student {
        id
        firstName
        lastName
        dateOfBirth
        isActive
      }
    }
  }
`;

export type KanbanGradeLevel = {
  id: string;
  name: string;
  /** Null for a top-level stage; set for a subgroup like US1. */
  parentId?: string | null;
  sortOrder: number;
};

type Resp1 = {
  schoolClassesByOrgId: Array<{
    id: string;
    name: string;
    color?: string | null;
    maxCapacity?: number | null;
    sortOrder: number;
    isActive: boolean;
    gradeLevels?: KanbanGradeLevel[];
  }>;
};
type Resp2 = { unassignedStudents: KanbanStudent[] };
type Resp4 = { gradeLevelsByOrgId: KanbanGradeLevel[] };
type Resp3 = {
  activeEnrollmentsBySchoolClassId: Array<{
    id: string;
    gradeLevelId?: string | null;
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
    const [
      { schoolClassesByOrgId },
      { unassignedStudents },
      { gradeLevelsByOrgId },
    ] = await Promise.all([
      client.request<Resp1>(SchoolClassesDocument),
      client.request<Resp2>(UnassignedDocument),
      client.request<Resp4>(GradeLevelsDocument),
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
        const gradeLevelByStudentId: Record<string, string | null> = {};
        for (const e of activeEnrollmentsBySchoolClassId) {
          studentsById[e.student.id] = e.student;
          ids.push(e.student.id);
          gradeLevelByStudentId[e.student.id] = e.gradeLevelId ?? null;
        }
        return { c, ids, gradeLevelByStudentId };
      }),
    );

    // From the org-wide query, not from the classes: a class carries only its
    // top-level stages, and the kanban needs their subgroups as well.
    const gradeLevels: KanbanGradeLevel[] = [...gradeLevelsByOrgId].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );

    const classrooms: KanbanClassroom[] = classroomEntries.map(
      ({ c, ids, gradeLevelByStudentId }) => ({
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
        gradeLevelByStudentId,
      }),
    );

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
