"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const CreateEnrollmentDocument = gql`
  mutation CreateEnrollment($input: CreateSchoolClassEnrollmentInput!) {
    createEnrollment(input: $input) {
      id
    }
  }
`;

export const createEnrollmentAction = async (
  studentId: string,
  schoolClassId: string,
  enrolledAt: string
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { createEnrollment } = await client.request<{
      createEnrollment: { id: string };
    }>(CreateEnrollmentDocument, {
      input: { studentId, schoolClassId, enrolledAt },
    });
    revalidatePath(`/${locale}/admin/students`);
    return { success: true as const, data: createEnrollment };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to create enrollment" };
  }
};
