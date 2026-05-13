"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";
import { gql } from "graphql-request";

const UpdateStudentContactPersonLinkDocument = gql`
  mutation UpdateStudentContactPersonLink(
    $input: UpdateStudentContactPersonInput!
  ) {
    updateStudentContactPersonLink(input: $input) {
      id
    }
  }
`;

export type UpdateStudentContactPersonLinkValues = {
  id: string;
  relationshipType?: string;
  isPrimaryContact?: boolean;
  hasCustody?: boolean;
  isPickupAuthorized?: boolean;
  emergencyPriority?: number | null;
  livesWithStudent?: boolean;
  notes?: string | null;
};

export const updateStudentContactPersonLinkAction = async (
  values: UpdateStudentContactPersonLinkValues,
  studentId: string,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { updateStudentContactPersonLink } = await client.request<{
      updateStudentContactPersonLink: { id: string };
    }>(UpdateStudentContactPersonLinkDocument, { input: values });
    revalidatePath(ROUTES.admin.studentsEdit(locale, studentId));
    return { success: true as const, data: updateStudentContactPersonLink };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
