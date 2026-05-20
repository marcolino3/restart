"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const Document = gql`
  query AdmissionApplicationDetail($id: ID!) {
    admissionApplicationById(id: $id) {
      id
      organizationId
      admissionStageId
      status
      source
      stageEnteredAt
      position
      childFirstName
      childLastName
      childDateOfBirth
      childGender
      childNotes
      desiredGradeLevelId
      desiredSchoolClassId
      desiredEnrollmentDate
      enrolledStudentId
      familyId
      family {
        id
        name
        notes
        contactPersons {
          id
          salutation
          firstName
          lastName
          email
          phone
          mobile
          roles
          occupation
        }
      }
      admissionStage {
        id
        name
        stageType
      }
      desiredSchoolClass {
        id
        name
      }
      desiredGradeLevel {
        id
        name
        color
      }
    }
    admissionAuditLogs(applicationId: $id) {
      id
      action
      createdAt
      fieldName
      oldValue
      newValue
      fromStage {
        id
        name
      }
      toStage {
        id
        name
      }
      actorMembership {
        id
        user {
          firstName
          lastName
        }
      }
    }
    admissionApplicationsByFamily(
      familyId: "00000000-0000-0000-0000-000000000000"
    ) @skip(if: true) {
      id
    }
  }
`;

const SiblingsDocument = gql`
  query AdmissionApplicationSiblings($familyId: ID!) {
    admissionApplicationsByFamily(familyId: $familyId) {
      id
      childFirstName
      childLastName
      childDateOfBirth
      status
      admissionStage {
        id
        name
        color
      }
    }
  }
`;

export type AdmissionDetailContact = {
  id: string;
  salutation: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  roles: string[] | null;
  occupation: string | null;
};

export type AdmissionDetailAuditLog = {
  id: string;
  action: string;
  createdAt: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  fromStage: { id: string; name: string } | null;
  toStage: { id: string; name: string } | null;
  actorName: string | null;
};

export type AdmissionDetailSibling = {
  id: string;
  childFirstName: string;
  childLastName: string;
  childDateOfBirth: string | null;
  status: string;
  stageId: string;
  stageName: string;
  stageColor: string | null;
};

export type AdmissionApplicationDetail = {
  id: string;
  admissionStageId: string;
  stageName: string;
  status: string;
  source: string;
  stageEnteredAt: string;
  childFirstName: string;
  childLastName: string;
  childDateOfBirth: string | null;
  childGender: string | null;
  childNotes: string | null;
  desiredGradeLevelId: string | null;
  desiredGradeLevelName: string | null;
  desiredGradeLevelColor: string | null;
  desiredSchoolClassId: string | null;
  desiredSchoolClassName: string | null;
  desiredEnrollmentDate: string | null;
  enrolledStudentId: string | null;
  familyId: string;
  familyName: string | null;
  familyNotes: string | null;
  contactPersons: AdmissionDetailContact[];
  auditLogs: AdmissionDetailAuditLog[];
  siblings: AdmissionDetailSibling[];
};

export const getApplicationDetailAction = async (
  id: string,
): Promise<
  | { success: true; data: AdmissionApplicationDetail }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const detail = await client.request<{
      admissionApplicationById: {
        id: string;
        admissionStageId: string;
        status: string;
        source: string;
        stageEnteredAt: string;
        childFirstName: string;
        childLastName: string;
        childDateOfBirth: string | null;
        childGender: string | null;
        childNotes: string | null;
        desiredGradeLevelId: string | null;
        desiredSchoolClassId: string | null;
        desiredEnrollmentDate: string | null;
        enrolledStudentId: string | null;
        familyId: string;
        family: {
          id: string;
          name: string | null;
          notes: string | null;
          contactPersons: AdmissionDetailContact[];
        };
        admissionStage: { id: string; name: string; stageType: string };
        desiredSchoolClass: { id: string; name: string } | null;
        desiredGradeLevel: { id: string; name: string; color: string | null } | null;
      };
      admissionAuditLogs: Array<{
        id: string;
        action: string;
        createdAt: string;
        fieldName: string | null;
        oldValue: string | null;
        newValue: string | null;
        fromStage: { id: string; name: string } | null;
        toStage: { id: string; name: string } | null;
        actorMembership: {
          id: string;
          user?: { firstName: string; lastName: string } | null;
        } | null;
      }>;
    }>(Document, { id });

    const siblingsResp = await client.request<{
      admissionApplicationsByFamily: Array<{
        id: string;
        childFirstName: string;
        childLastName: string;
        childDateOfBirth: string | null;
        status: string;
        admissionStage: { id: string; name: string; color: string | null };
      }>;
    }>(SiblingsDocument, { familyId: detail.admissionApplicationById.familyId });

    const app = detail.admissionApplicationById;
    return {
      success: true as const,
      data: {
        id: app.id,
        admissionStageId: app.admissionStageId,
        stageName: app.admissionStage.name,
        status: app.status,
        source: app.source,
        stageEnteredAt: app.stageEnteredAt,
        childFirstName: app.childFirstName,
        childLastName: app.childLastName,
        childDateOfBirth: app.childDateOfBirth,
        childGender: app.childGender,
        childNotes: app.childNotes,
        desiredGradeLevelId: app.desiredGradeLevelId,
        desiredGradeLevelName: app.desiredGradeLevel?.name ?? null,
        desiredGradeLevelColor: app.desiredGradeLevel?.color ?? null,
        desiredSchoolClassId: app.desiredSchoolClassId,
        desiredSchoolClassName: app.desiredSchoolClass?.name ?? null,
        desiredEnrollmentDate: app.desiredEnrollmentDate,
        enrolledStudentId: app.enrolledStudentId,
        familyId: app.familyId,
        familyName: app.family.name,
        familyNotes: app.family.notes,
        contactPersons: app.family.contactPersons ?? [],
        auditLogs: detail.admissionAuditLogs.map((l) => ({
          id: l.id,
          action: l.action,
          createdAt: l.createdAt,
          fieldName: l.fieldName,
          oldValue: l.oldValue,
          newValue: l.newValue,
          fromStage: l.fromStage,
          toStage: l.toStage,
          actorName: l.actorMembership?.user
            ? `${l.actorMembership.user.firstName} ${l.actorMembership.user.lastName}`
            : null,
        })),
        siblings: siblingsResp.admissionApplicationsByFamily
          .filter((s) => s.id !== app.id)
          .map((s) => ({
            id: s.id,
            childFirstName: s.childFirstName,
            childLastName: s.childLastName,
            childDateOfBirth: s.childDateOfBirth,
            status: s.status,
            stageId: s.admissionStage.id,
            stageName: s.admissionStage.name,
            stageColor: s.admissionStage.color,
          })),
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to load detail",
    };
  }
};
