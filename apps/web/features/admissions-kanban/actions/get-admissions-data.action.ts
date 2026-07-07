"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type {
  AdmissionBoardSettings,
  AdmissionRejectionReason,
  AdmissionSource,
  KanbanApplication,
  KanbanStage,
} from "../types";

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
      cardFields
    }
  }
`;

const BoardSettingsDocument = gql`
  query AdmissionsBoardSettings {
    admissionBoardSettings {
      tableColumns
    }
  }
`;

const RejectionReasonsDocument = gql`
  query AdmissionsKanbanRejectionReasons {
    admissionRejectionReasons {
      id
      label
      color
      position
    }
  }
`;

const SourcesDocument = gql`
  query AdmissionsKanbanSources {
    admissionSources {
      id
      name
      color
      isArchived
      position
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
      admissionSource {
        id
        name
        color
      }
      stageEnteredAt
      familyId
      enrolledStudentId
      assignedGradeLevelId
      assignedGradeLevel {
        id
        name
        shortCode
        color
        parent {
          id
          name
          shortCode
          color
        }
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

type BoardSettingsResp = {
  admissionBoardSettings: AdmissionBoardSettings | null;
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
    admissionSource: KanbanApplication["admissionSource"];
    stageEnteredAt: string;
    familyId: string;
    enrolledStudentId: string | null;
    assignedGradeLevelId: string | null;
    assignedGradeLevel: {
      id: string;
      name: string;
      shortCode: string | null;
      color: string | null;
      parent: {
        id: string;
        name: string;
        shortCode: string | null;
        color: string | null;
      } | null;
    } | null;
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
  boardSettings: AdmissionBoardSettings;
  rejectionReasons: AdmissionRejectionReason[];
  sources: AdmissionSource[];
};

export const getAdmissionsDataAction = async (): Promise<
  | { success: true; data: AdmissionsKanbanData }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const [
      { admissionStages },
      { admissionApplications },
      remindersResp,
      boardSettingsResp,
      rejectionReasonsResp,
      sourcesResp,
    ] = await Promise.all([
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
      client
        .request<BoardSettingsResp>(BoardSettingsDocument)
        .catch(() => ({ admissionBoardSettings: null })),
      client
        .request<{ admissionRejectionReasons: AdmissionRejectionReason[] }>(
          RejectionReasonsDocument,
        )
        .catch(() => ({ admissionRejectionReasons: [] })),
      client
        .request<{ admissionSources: AdmissionSource[] }>(SourcesDocument)
        .catch(() => ({ admissionSources: [] })),
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
        cardFields: s.cardFields ?? null,
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
        admissionSource: a.admissionSource,
        stageEnteredAt: a.stageEnteredAt,
        familyId: a.familyId,
        enrolledStudentId: a.enrolledStudentId,
        assignedGradeLevelId: a.assignedGradeLevelId,
        assignedGradeLevelName: a.assignedGradeLevel?.name ?? null,
        assignedGradeLevelColor: a.assignedGradeLevel?.color ?? null,
        // Split the assigned node into Stufe + optional Untergruppe: a node with
        // a `parent` is itself a subgroup (parent = Stufe); otherwise it is the
        // Stufe and there is no subgroup.
        assignedStufe: a.assignedGradeLevel
          ? a.assignedGradeLevel.parent ?? {
              id: a.assignedGradeLevel.id,
              name: a.assignedGradeLevel.name,
              shortCode: a.assignedGradeLevel.shortCode,
              color: a.assignedGradeLevel.color,
            }
          : null,
        assignedUntergruppe:
          a.assignedGradeLevel && a.assignedGradeLevel.parent
            ? {
                id: a.assignedGradeLevel.id,
                name: a.assignedGradeLevel.name,
                shortCode: a.assignedGradeLevel.shortCode,
                color: a.assignedGradeLevel.color,
              }
            : null,
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
      data: {
        stages,
        applications,
        applicationsByStage,
        familyChildCount,
        boardSettings: {
          tableColumns:
            boardSettingsResp.admissionBoardSettings?.tableColumns ?? null,
        },
        rejectionReasons: rejectionReasonsResp.admissionRejectionReasons ?? [],
        sources: sourcesResp.admissionSources ?? [],
      },
    };
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Failed to load admissions data";
    return { success: false as const, error: message };
  }
};
