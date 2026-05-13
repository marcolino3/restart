"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const UpdateEnrollmentDocument = gql`
  mutation UpdateEnrollment($input: UpdateSchoolClassEnrollmentInput!) {
    updateEnrollment(input: $input) {
      id
    }
  }
`;

export const updateEnrollmentAction = async (id: string, leftAt: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { updateEnrollment } = await client.request<{
      updateEnrollment: { id: string };
    }>(UpdateEnrollmentDocument, { input: { id, leftAt } });
    revalidatePath(`/${locale}/admin/students`);
    return { success: true as const, data: updateEnrollment };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to update enrollment" };
  }
};
