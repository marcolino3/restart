"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type {
  StudentImportMode,
  StudentImportPlan,
  StudentImportResult,
} from "../types/student-import";

type Response = { importStudents: StudentImportResult };

const Document = gql`
  mutation ImportStudents($input: ImportStudentsInput!) {
    importStudents(input: $input) {
      createdStudents
      updatedStudents
      skippedStudents
      createdContacts
      updatedContacts
      createdFamilies
      createdLinks
      createdEnrollments
    }
  }
`;

/** Drops preview-only fields (row numbers, display names) before committing. */
function stripPlanForCommit(plan: StudentImportPlan, mode: StudentImportMode) {
  return {
    mode,
    families: plan.families.map((f) => ({
      key: f.key,
      name: f.name,
      existingFamilyId: f.existingFamilyId ?? undefined,
      address: f.address
        ? {
            street: f.address.street ?? undefined,
            houseNumber: f.address.houseNumber ?? undefined,
            postalCode: f.address.postalCode ?? undefined,
            city: f.address.city ?? undefined,
            countryId: f.address.countryId ?? undefined,
          }
        : undefined,
    })),
    contacts: plan.contacts.map((c) => ({
      tempId: c.tempId,
      familyKey: c.familyKey,
      existingContactPersonId: c.existingContactPersonId ?? undefined,
      salutation: c.salutation ?? undefined,
      title: c.title ?? undefined,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email ?? undefined,
      phone: c.phone ?? undefined,
      mobile: c.mobile ?? undefined,
      occupation: c.occupation ?? undefined,
      preferredLanguages: c.preferredLanguages,
      roles: c.roles,
    })),
    students: plan.students.map((s) => ({
      tempId: s.tempId,
      familyKey: s.familyKey,
      existingStudentId: s.existingStudentId ?? undefined,
      firstName: s.firstName,
      lastName: s.lastName,
      preferredName: s.preferredName ?? undefined,
      dateOfBirth: s.dateOfBirth ?? undefined,
      gender: s.gender ?? undefined,
      placeOfBirth: s.placeOfBirth ?? undefined,
      nationalities: s.nationalities,
      firstLanguages: s.firstLanguages,
      familyLanguages: s.familyLanguages,
      religion: s.religion ?? undefined,
      socialSecurityNumber: s.socialSecurityNumber ?? undefined,
      externalStudentId: s.externalStudentId ?? undefined,
      enrollmentDate: s.enrollmentDate ?? undefined,
      notes: s.notes ?? undefined,
      schoolClassId: s.schoolClassId ?? undefined,
      gradeLevelId: s.gradeLevelId ?? undefined,
      links: s.links.map((l) => ({
        contactTempId: l.contactTempId,
        relationshipType: l.relationshipType,
        isPrimaryContact: l.isPrimaryContact,
        hasCustody: l.hasCustody,
        isPickupAuthorized: l.isPickupAuthorized,
        emergencyPriority: l.emergencyPriority ?? undefined,
        livesWithStudent: l.livesWithStudent,
      })),
    })),
  };
}

export const importStudentsAction = async (
  plan: StudentImportPlan,
  mode: StudentImportMode,
) => {
  const input = stripPlanForCommit(plan, mode);
  const [client, locale] = await Promise.all([
    serverCookieGqlClient(),
    getLocale(),
  ]);
  try {
    const { importStudents } = await client.request<Response>(Document, {
      input,
    });
    revalidatePath(`/${locale}/admin/students`);
    revalidatePath(`/${locale}/admin/contact-persons`);
    return { success: true as const, data: importStudents };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
