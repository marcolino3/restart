"use server";

import {
  StudentFormSchema,
  StudentFormOutput,
} from "../schemas/student-form.schema";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const UpdateStudentDocument = gql`
  mutation UpdateStudent($input: UpdateStudentInput!) {
    updateStudent(input: $input) {
      id
    }
  }
`;

export const updateStudentAction = async (values: StudentFormOutput) => {
  const locale = await getLocale();
  const parsed = StudentFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  if (!parsed.id) {
    return { success: false as const, error: "Missing student id" };
  }

  const toIsoDate = (d: Date) => d.toISOString().split("T")[0];

  const input = {
    id: parsed.id,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    dateOfBirth: parsed.dateOfBirth ? toIsoDate(parsed.dateOfBirth) : null,
    gender: parsed.gender || null,
    enrollmentDate: parsed.enrollmentDate
      ? toIsoDate(parsed.enrollmentDate)
      : null,
    exitDate: parsed.exitDate ? toIsoDate(parsed.exitDate) : null,
    notes: parsed.notes || null,
    // Master data extension (Scope 1) — send explicitly so clearing works.
    preferredName: parsed.preferredName || null,
    placeOfBirth: parsed.placeOfBirth || null,
    firstLanguages: parsed.firstLanguages,
    familyLanguages: parsed.familyLanguages,
    religion: parsed.religion || null,
    socialSecurityNumber: parsed.socialSecurityNumber || null,
    externalStudentId: parsed.externalStudentId || null,
    nationalities: parsed.nationalities,
  };

  try {
    const { updateStudent } = await client.request<{
      updateStudent: { id: string };
    }>(UpdateStudentDocument, { input });
    revalidatePath(`/${locale}/admin/students`);
    return { success: true as const, data: updateStudent };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to update student" };
  }
};
