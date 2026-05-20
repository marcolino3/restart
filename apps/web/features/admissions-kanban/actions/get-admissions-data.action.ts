"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { KanbanApplication, KanbanStage } from "../types";

const RemindersDocument = gql`
  query AdmissionsKanbanReminders {
    orgAdmissionReminders(filter: OPEN) {
      id
      applicationId
      dueAt
    }
  }
`;

const StagesDocument = gql`
  query AdmissionsKanbanStages {
    admissionStages {
      id
      name
      slug
      color
      position
      stageType
      isDefault
      isArchived
    }
  }
`;

const ApplicationsDocument = gql`
  query AdmissionsKanbanApplications {
    admissionApplications {
      id
      admissionStageId
      position
      childFirstName
      childLastName
      childDateOfBirth
      childGender
      status
      source
      stageEnteredAt
      familyId
      enrolledStudentId
      desiredGradeLevelId
      desiredGradeLevel {
        id
        name
        color
      }
      family {
        id
        name
        contactPersons {
          id
          firstName
          lastName
          email
          phone
          mobile
          roles
        }
      }
    }
  }
`;

type StagesResp = {
  admissionStages: Array<KanbanStage & { isArchived: boolean }>;
};

type ApplicationsResp = {
  admissionApplications: Array<{
    id: string;
    admissionStageId: string;
    position: number;
    childFirstName: string;
    childLastName: string;
    childDateOfBirth: string | null;
    childGender: KanbanApplication["childGender"];
    status: KanbanApplication["status"];
    source: KanbanApplication["source"];
    stageEnteredAt: string;
    familyId: string;
    enrolledStudentId: string | null;
    desiredGradeLevelId: string | null;
    desiredGradeLevel: { id: string; name: string; color: string | null } | null;
    family: {
      id: string;
      name: string | null;
      contactPersons: Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        mobile: string | null;
        roles: string[] | null;
      }>;
    };
  }>;
};

export type AdmissionsKanbanData = {
  stages: KanbanStage[];
  applications: KanbanApplication[];
  applicationsByStage: Record<string, KanbanApplication[]>;
  familyChildCount: Record<string, number>;
};

export const getAdmissionsDataAction = async (): Promise<
  | { success: true; data: AdmissionsKanbanData }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const [{ admissionStages }, { admissionApplications }, remindersResp] =
      await Promise.all([
        client.request<StagesResp>(StagesDocument),
        client.request<ApplicationsResp>(ApplicationsDocument),
        client
          .request<{
            orgAdmissionReminders: Array<{
              id: string;
              applicationId: string;
              dueAt: string;
            }>;
          }>(RemindersDocument)
          .catch(() => ({ orgAdmissionReminders: [] })),
      ]);

    const now = Date.now();
    const reminderCounts = new Map<
      string,
      { open: number; overdue: number }
    >();
    for (const r of remindersResp.orgAdmissionReminders) {
      const entry = reminderCounts.get(r.applicationId) ?? {
        open: 0,
        overdue: 0,
      };
      entry.open += 1;
      if (new Date(r.dueAt).getTime() < now) entry.overdue += 1;
      reminderCounts.set(r.applicationId, entry);
    }

    const stages: KanbanStage[] = admissionStages
      .filter((s) => !s.isArchived)
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        color: s.color,
        position: s.position,
        stageType: s.stageType,
        isDefault: s.isDefault,
      }));

    const familyChildCount: Record<string, number> = {};
    for (const a of admissionApplications) {
      familyChildCount[a.familyId] = (familyChildCount[a.familyId] ?? 0) + 1;
    }

    const applications: KanbanApplication[] = admissionApplications.map((a) => {
      const contacts = a.family.contactPersons ?? [];
      const firstWithEmail = contacts.find((c) => c.email);
      const firstWithPhone = contacts.find((c) => c.mobile || c.phone);
      return {
        id: a.id,
        admissionStageId: a.admissionStageId,
        position: a.position,
        childFirstName: a.childFirstName,
        childLastName: a.childLastName,
        childDateOfBirth: a.childDateOfBirth,
        childGender: a.childGender,
        status: a.status,
        source: a.source,
        stageEnteredAt: a.stageEnteredAt,
        familyId: a.familyId,
        enrolledStudentId: a.enrolledStudentId,
        desiredGradeLevelId: a.desiredGradeLevelId,
        desiredGradeLevelName: a.desiredGradeLevel?.name ?? null,
        desiredGradeLevelColor: a.desiredGradeLevel?.color ?? null,
        openRemindersCount: reminderCounts.get(a.id)?.open ?? 0,
        overdueRemindersCount: reminderCounts.get(a.id)?.overdue ?? 0,
        family: {
          id: a.family.id,
          name: a.family.name,
          contactNames: contacts.map(
            (c) => `${c.firstName} ${c.lastName}`.trim(),
          ),
          primaryEmail: firstWithEmail?.email ?? null,
          primaryPhone: firstWithPhone?.mobile ?? firstWithPhone?.phone ?? null,
          childrenCount: familyChildCount[a.familyId] ?? 1,
        },
      };
    });

    const applicationsByStage: Record<string, KanbanApplication[]> = {};
    for (const s of stages) applicationsByStage[s.id] = [];
    for (const a of applications) {
      if (!applicationsByStage[a.admissionStageId]) {
        applicationsByStage[a.admissionStageId] = [];
      }
      applicationsByStage[a.admissionStageId].push(a);
    }
    for (const id of Object.keys(applicationsByStage)) {
      applicationsByStage[id].sort((x, y) => x.position - y.position);
    }

    return {
      success: true as const,
      data: { stages, applications, applicationsByStage, familyChildCount },
    };
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Failed to load admissions data";
    return { success: false as const, error: message };
  }
};
