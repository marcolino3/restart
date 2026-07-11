"use server";

import {
  StudentFormSchema,
  StudentFormOutput,
} from "../schemas/student-form.schema";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const CreateStudentDocument = gql`
  mutation CreateStudent($input: CreateStudentInput!) {
    createStudent(input: $input) {
      id
    }
  }
`;

export const createStudentAction = async (values: StudentFormOutput) => {
  const locale = await getLocale();
  const parsed = StudentFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  const toIsoDate = (d: Date) => d.toISOString().split("T")[0];

  const input = {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    ...(parsed.dateOfBirth ? { dateOfBirth: toIsoDate(parsed.dateOfBirth) } : {}),
    ...(parsed.gender ? { gender: parsed.gender } : {}),
    ...(parsed.enrollmentDate
      ? { enrollmentDate: toIsoDate(parsed.enrollmentDate) }
      : {}),
    ...(parsed.exitDate ? { exitDate: toIsoDate(parsed.exitDate) } : {}),
    ...(parsed.notes ? { notes: parsed.notes } : {}),
    // Master data extension (Scope 1).
    ...(parsed.preferredName ? { preferredName: parsed.preferredName } : {}),
    ...(parsed.placeOfBirth ? { placeOfBirth: parsed.placeOfBirth } : {}),
    ...(parsed.firstLanguages.length
      ? { firstLanguages: parsed.firstLanguages }
      : {}),
    ...(parsed.familyLanguages.length
      ? { familyLanguages: parsed.familyLanguages }
      : {}),
    ...(parsed.religion ? { religion: parsed.religion } : {}),
    ...(parsed.socialSecurityNumber
      ? { socialSecurityNumber: parsed.socialSecurityNumber }
      : {}),
    ...(parsed.externalStudentId
      ? { externalStudentId: parsed.externalStudentId }
      : {}),
    ...(parsed.nationalities.length
      ? { nationalities: parsed.nationalities }
      : {}),
  };

  try {
    const { createStudent } = await client.request<{
      createStudent: { id: string };
    }>(CreateStudentDocument, { input });
    revalidatePath(ROUTES.admin.students(locale));
    return { success: true as const, data: createStudent };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
